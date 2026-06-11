import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  TextBasedChannel,
  Message,
} from 'discord.js';
import { Track, Player } from 'lavalink-client';

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function buildProgressBar(current: number, total: number, length = 10): string {
  const ratio = total > 0 ? current / total : 0;
  const filled = Math.round(ratio * length);
  const empty = length - filled;
  return '▬'.repeat(filled) + '🔘' + '▬'.repeat(empty);
}

function getButtons(paused: boolean, loop: boolean) {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('np_prev')
      .setEmoji('⏮️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('np_pause')
      .setEmoji(paused ? '▶️' : '⏸️')
      .setStyle(paused ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('np_skip')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('np_stop')
      .setEmoji('⏹️')
      .setStyle(ButtonStyle.Danger),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('np_shuffle')
      .setEmoji('🔀')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('np_loop')
      .setEmoji(loop ? '🔂' : '🔁')
      .setStyle(loop ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('np_voldown')
      .setEmoji('🔉')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('np_volup')
      .setEmoji('🔊')
      .setStyle(ButtonStyle.Secondary),
  );

  return [row1, row2];
}

export async function sendNowPlaying(
  channel: TextBasedChannel & { send: Function },
  player: Player,
  track: Track
): Promise<void> {
  const durationMs = track.info.duration ?? 0;
  const positionMs = player.position ?? 0;
  const requester = (track.requester as { username?: string })?.username ?? 'Unknown';

  const queue = player.queue;
  const queueLength = queue.tracks.length;
  const nextTrack = queueLength > 0 ? queue.tracks[0] : null;

  const embed = new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setAuthor({
      name: track.info.author || 'Unknown Artist',
      iconURL: track.info.artworkUrl ?? undefined,
    })
    .setTitle(track.info.title)
    .setURL(track.info.uri ?? null)
    .setThumbnail(track.info.artworkUrl ?? null)
    .setDescription(
      `\`${formatTime(positionMs)}\` ${buildProgressBar(positionMs, durationMs)} \`${formatTime(durationMs)}\``
    )
    .addFields(
      { name: 'Requested by', value: requester, inline: true },
      { name: 'Volume', value: `${player.volume}%`, inline: true },
    );

  if (nextTrack) {
    embed.addFields({
      name: 'Up Next',
      value: `[${nextTrack.info.title}](${nextTrack.info.uri})`,
      inline: false,
    });
  }

  embed.setFooter({
    text: queueLength > 0
      ? `${queueLength + 1} tracks in queue`
      : 'Only track in queue',
  });
  embed.setTimestamp();

  const msg: Message = await channel.send({
    embeds: [embed],
    components: getButtons(player.paused, player.repeatMode === 'track'),
  });

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: durationMs + 30_000,
  });

  const progressInterval = setInterval(async () => {
    if (!player.connected) return;
    const pos = player.position ?? 0;
    if (pos > durationMs) return;
    const updated = EmbedBuilder.from(embed)
      .setDescription(`\`${formatTime(pos)}\` ${buildProgressBar(pos, durationMs)} \`${formatTime(durationMs)}\``);
    await msg.edit({ embeds: [updated] }).catch(() => {});
  }, 5_000);

  collector.on('collect', async (btn) => {
    await btn.deferUpdate();

    switch (btn.customId) {
      case 'np_pause':
        if (player.paused) {
          await player.resume();
        } else {
          await player.pause();
        }
        await msg.edit({
          components: getButtons(player.paused, player.repeatMode === 'track'),
        });
        break;

      case 'np_skip':
        await player.skip();
        break;

      case 'np_prev': {
        const previous = await queue.shiftPrevious();
        if (previous) {
          await player.play({ clientTrack: previous });
        }
        break;
      }

      case 'np_loop': {
        const newMode = player.repeatMode === 'track' ? 'off' : 'track';
        await player.setRepeatMode(newMode);
        await msg.edit({
          components: getButtons(player.paused, player.repeatMode === 'track'),
        });
        break;
      }

      case 'np_shuffle':
        await queue.shuffle();
        break;

      case 'np_voldown': {
        const newVol = Math.max(0, player.volume - 10);
        await player.setVolume(newVol);
        const volEmbed = EmbedBuilder.from(embed).setFields(
          { name: 'Requested by', value: requester, inline: true },
          { name: 'Volume', value: `${newVol}%`, inline: true },
        );
        await msg.edit({ embeds: [volEmbed] }).catch(() => {});
        break;
      }

      case 'np_volup': {
        const newVol = Math.min(200, player.volume + 10);
        await player.setVolume(newVol);
        const volEmbed = EmbedBuilder.from(embed).setFields(
          { name: 'Requested by', value: requester, inline: true },
          { name: 'Volume', value: `${newVol}%`, inline: true },
        );
        await msg.edit({ embeds: [volEmbed] }).catch(() => {});
        break;
      }

      case 'np_stop':
        clearInterval(progressInterval);
        await player.destroy();
        collector.stop('stopped');
        break;
    }
  });

  collector.on('end', () => {
    clearInterval(progressInterval);
    msg.edit({ components: [] }).catch(() => {});
  });
}
