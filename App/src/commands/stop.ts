import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import { getLavalink } from '../lavalink/manager';

export const stopCommandData = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Stop the player and clear the queue');

export async function stopCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const member = interaction.member as GuildMember;
  if (!member.voice.channel) {
    await interaction.reply({ content: 'You must be in a voice channel.', ephemeral: true });
    return;
  }

  const player = getLavalink().getPlayer(interaction.guildId!);
  if (!player) {
    await interaction.reply({ content: 'Nothing is playing.', ephemeral: true });
    return;
  }

  await player.destroy();
  await interaction.reply('Stopped the player and cleared the queue.');
}
