import { Client, ChatInputCommandInteraction } from 'discord.js';
import { playCommand } from '../commands/play';
import { skipCommand } from '../commands/skip';
import { stopCommand } from '../commands/stop';
import { queueCommand } from '../commands/queue';
import { pauseCommand } from '../commands/pause';
import { resumeCommand } from '../commands/resume';

const commandMap: Record<string, (interaction: ChatInputCommandInteraction) => Promise<void>> = {
  play: playCommand,
  skip: skipCommand,
  stop: stopCommand,
  queue: queueCommand,
  pause: pauseCommand,
  resume: resumeCommand,
};

export function registerInteractionEvent(client: Client): void {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const handler = commandMap[interaction.commandName];
    if (handler) {
      try {
        await handler(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'An error occurred.', ephemeral: true });
        } else {
          await interaction.reply({ content: 'An error occurred.', ephemeral: true });
        }
      }
    }
  });
}
