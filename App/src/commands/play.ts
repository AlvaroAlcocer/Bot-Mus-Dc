import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import { getLavalink } from '../lavalink/manager';

export const playCommandData = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play a song from YouTube or SoundCloud')
  .addStringOption((option) =>
    option
      .setName('query')
      .setDescription('Song name or URL')
      .setRequired(true)
  );

export async function playCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({ content: 'You must be in a voice channel.', ephemeral: true });
    return;
  }

  const query = interaction.options.getString('query', true);

  await interaction.deferReply();

  const lavalink = getLavalink();
  const guildId = interaction.guildId!;
  const voiceChannelId = voiceChannel.id;

  let player = lavalink.getPlayer(guildId);

  if (!player) {
    player = lavalink.createPlayer({
      guildId,
      voiceChannelId,
      textChannelId: interaction.channelId,
      volume: 100,
      selfDeaf: true,
    });
  }

  const result = await player.search(query, interaction.user);

  if (!result || result.loadType === 'error' || result.loadType === 'empty') {
    await interaction.editReply('No results found.');
    return;
  }

  if (result.loadType === 'playlist') {
    await player.queue.add(result.tracks);
    await interaction.editReply(
      `Added **${result.tracks.length}** tracks from playlist **${result.playlist?.name}** to the queue.`
    );
  } else {
    const track = result.tracks[0];
    await player.queue.add(track);
    await interaction.editReply(`Added **${track.info.title}** to the queue.`);
  }

  if (!player.connected) {
    await player.connect();
  }

  if (!player.playing) {
    await player.play();
  }
}
