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

function getButtons(paused: boolean, loop: boolean, autoplay: boolean) {
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
      .setCustomId('np_queue')
      .setEmoji('📋')
      .setLabel('Queue')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('np_autoplay')
      .setEmoji('🔁')
      .setLabel(autoplay ? 'Autoplay ON' : 'Autoplay OFF')
      .setStyle(autoplay ? ButtonStyle.Success : ButtonStyle.Secondary),
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
  const autoplay = (player.getData('autoplay') as boolean) ?? false;

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
    );

  if (queueLength > 0) {
    const preview = queue.tracks.slice(0, 5);
    const list = preview
      .map((t, i) => `**${i + 1}.** [${t.info.title}](${t.info.uri})`)
      .join('\n');
    const remaining = queueLength > 5 ? `\n*... and ${queueLength - 5} more*` : '';
    embed.addFields({ name: 'Up Next', value: `${list}${remaining}`, inline: false });
  }

  embed.setFooter({
    text: queueLength > 0
      ? `${queueLength + 1} tracks in queue`
      : 'Only track in queue',
  });
  embed.setTimestamp();

  const msg: Message = await channel.send({
    embeds: [embed],
    components: getButtons(player.paused, player.repeatMode === 'track', autoplay),
  });

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: durationMs + 30_000,
  });

  function getUpdatedAutoplay(): boolean {
    return (player.getData('autoplay') as boolean) ?? false;
  }

  function updateButtons() {
    msg.edit({
      components: getButtons(player.paused, player.repeatMode === 'track', getUpdatedAutoplay()),
    }).catch(() => {});
  }

  collector.on('collect', async (btn) => {
    switch (btn.customId) {
      case 'np_pause':
        await btn.deferUpdate();
        if (player.paused) {
          await player.resume();
        } else {
          await player.pause();
        }
        updateButtons();
        break;

      case 'np_skip':
        await btn.deferUpdate();
        await player.skip();
        break;

      case 'np_prev': {
        await btn.deferUpdate();
        const previous = await queue.shiftPrevious();
        if (previous) {
          await player.play({ clientTrack: previous });
        }
        break;
      }

      case 'np_loop': {
        await btn.deferUpdate();
        const newMode = player.repeatMode === 'track' ? 'off' : 'track';
        await player.setRepeatMode(newMode);
        updateButtons();
        break;
      }

      case 'np_shuffle':
        await btn.deferUpdate();
        await queue.shuffle();
        break;

      case 'np_queue': {
        const tracks = queue.tracks;
        const maxTracks = 15;
        let queueText = '';
        if (queue.current) {
          const uri = queue.current.info.uri ?? '';
          queueText += `**Now Playing:** ${uri ? `[${queue.current.info.title}](${uri})` : queue.current.info.title}\n\n`;
        }
        if (tracks.length === 0) {
          queueText += 'The queue is empty.';
        } else {
          const slice = tracks.slice(0, maxTracks);
          const list = slice
            .map((t, i) => {
              const uri = t.info.uri ?? '';
              const title = uri ? `[${t.info.title}](${uri})` : t.info.title;
              return `${i + 1}. ${title} (\`${formatTime(t.info.duration ?? 0)}\`)`;
            })
            .join('\n');
          const remaining = tracks.length > maxTracks ? `\n... and ${tracks.length - maxTracks} more` : '';
          queueText += `**Queue (${tracks.length} tracks):**\n${list}${remaining}`;
        }
        if (queueText.length > 1900) {
          queueText = queueText.slice(0, 1900) + '\n... (truncated)';
        }
        await btn.reply({ content: queueText, ephemeral: true });
        break;
      }

      case 'np_autoplay': {
        await btn.deferUpdate();
        const current = player.getData('autoplay') ?? false;
        player.setData('autoplay', !current);
        updateButtons();
        break;
      }

      case 'np_stop':
        await btn.deferUpdate();
        await player.destroy();
        collector.stop('stopped');
        break;
    }
  });

  collector.on('end', () => {
    msg.edit({ components: [] }).catch(() => {});
  });
}
