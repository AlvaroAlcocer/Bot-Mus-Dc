import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getLavalink } from '../lavalink/manager';

export const queueCommandData = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Show the current queue');

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export async function queueCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const player = getLavalink().getPlayer(interaction.guildId!);

  if (!player) {
    await interaction.reply({ content: 'No active player.', ephemeral: true });
    return;
  }

  const queue = player.queue;
  const current = player.queue.current;

  let response = '';

  if (current) {
    response += `**Now playing:** ${current.info.title}`;
    if ('requester' in current && current.requester) {
      response += ` (requested by ${(current.requester as any).username || 'unknown'})`;
    }
    response += '\n\n';
  }

  const tracks = queue.tracks;
  if (tracks.length === 0) {
    response += 'The queue is empty.';
  } else {
    const slice = tracks.slice(0, 10);
    const trackList = slice.map((t, i) =>
      `${i + 1}. ${t.info.title} (${formatDuration(t.info.duration ?? 0)})`
    );
    const remaining = tracks.length > 10 ? `\n... and ${tracks.length - 10} more` : '';
    response += `**Queue:**\n${trackList.join('\n')}${remaining}`;
  }

  await interaction.reply(response);
}
