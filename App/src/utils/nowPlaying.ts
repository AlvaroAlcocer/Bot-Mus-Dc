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

export async function sendNowPlaying(
  channel: TextBasedChannel & { send: Function },
  player: Player,
  track: Track
): Promise<void> {
  const durationMs = track.info.duration ?? 0;
  const min = Math.floor(durationMs / 60000);
  const sec = String(Math.floor((durationMs % 60000) / 1000)).padStart(2, '0');
  const requester = (track.requester as { username?: string })?.username ?? 'Unknown';

  const embed = new EmbedBuilder()
    .setAuthor({ name: '🎵 NowPlaying' })
    .setDescription(`**[${track.info.title}](${track.info.uri})**`)
    .addFields(
      { name: 'Duration', value: `\`${min}:${sec}\``, inline: true },
      { name: 'Requested by', value: requester, inline: true }
    )
    .setThumbnail(track.info.artworkUrl ?? null)
    .setColor(0x1a1a2e);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('np_pause').setLabel('Pause').setEmoji('⏸').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('np_skip').setLabel('Skip').setEmoji('⏭').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('np_loop').setLabel('Loop').setEmoji('🔁').setStyle(ButtonStyle.Success),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('np_shuffle').setLabel('Shuffle').setEmoji('🔀').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('np_stop').setLabel('End Session').setEmoji('⏹').setStyle(ButtonStyle.Danger),
  );

  const msg: Message = await channel.send({ embeds: [embed], components: [row1, row2] });

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: durationMs + 15_000,
  });

  collector.on('collect', async (btn) => {
    await btn.deferUpdate();

    switch (btn.customId) {
      case 'np_pause':
        if (player.paused) {
          await player.resume();
          await btn.editReply({ content: '▶️ Resumed.' });
        } else {
          await player.pause();
          await btn.editReply({ content: '⏸ Paused.' });
        }
        break;
      case 'np_skip':
        await player.skip();
        break;
      case 'np_loop':
        const newMode = player.repeatMode === 'track' ? 'off' : 'track';
        await player.setRepeatMode(newMode);
        break;
      case 'np_shuffle':
        player.queue.shuffle();
        break;
      case 'np_stop':
        await player.destroy();
        collector.stop('stopped');
        break;
    }
  });

  collector.on('end', () => {
    msg.edit({ components: [] }).catch(() => {});
  });
}