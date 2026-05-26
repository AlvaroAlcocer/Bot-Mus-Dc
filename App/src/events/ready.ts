import { Client, REST, Routes, SlashCommandOptionsOnlyBuilder } from 'discord.js';
import { getLavalink } from '../lavalink/manager';
import { playCommandData } from '../commands/play';
import { skipCommandData } from '../commands/skip';
import { stopCommandData } from '../commands/stop';
import { queueCommandData } from '../commands/queue';
import { pauseCommandData } from '../commands/pause';
import { resumeCommandData } from '../commands/resume';

const commands: SlashCommandOptionsOnlyBuilder[] = [
  playCommandData,
  skipCommandData,
  stopCommandData,
  queueCommandData,
  pauseCommandData,
  resumeCommandData,
];

export function registerReadyEvent(client: Client): void {
  client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user?.tag}`);

    await getLavalink().init({
      id: client.user!.id,
      username: client.user!.username,
    });

    const rest = new REST({ version: '10' }).setToken(client.token!);

    try {
      console.log('Registering slash commands...');
      await rest.put(Routes.applicationCommands(client.user!.id), {
        body: commands.map((cmd) => cmd.toJSON()),
      });
      console.log('Slash commands registered.');
    } catch (error) {
      console.error('Failed to register commands:', error);
    }
  });
}
