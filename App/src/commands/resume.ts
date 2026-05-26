import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import { getLavalink } from '../lavalink/manager';

export const resumeCommandData = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Resume the paused track');

export async function resumeCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const member = interaction.member as GuildMember;
  if (!member.voice.channel) {
    await interaction.reply({ content: 'You must be in a voice channel.', ephemeral: true });
    return;
  }

  const player = getLavalink().getPlayer(interaction.guildId!);
  if (!player || !player.paused) {
    await interaction.reply({ content: 'The player is not paused.', ephemeral: true });
    return;
  }

  await player.resume();
  await interaction.reply('Resumed the player.');
}
