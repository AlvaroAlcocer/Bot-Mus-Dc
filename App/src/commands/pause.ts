import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import { getLavalink } from '../lavalink/manager';

export const pauseCommandData = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('Pause the current track');

export async function pauseCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const member = interaction.member as GuildMember;
  if (!member.voice.channel) {
    await interaction.reply({ content: 'You must be in a voice channel.', ephemeral: true });
    return;
  }

  const player = getLavalink().getPlayer(interaction.guildId!);
  if (!player || !player.playing) {
    await interaction.reply({ content: 'Nothing is playing.', ephemeral: true });
    return;
  }

  await player.pause();
  await interaction.reply('Paused the current track.');
}
