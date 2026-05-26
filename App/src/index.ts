import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config';
import { initManager, getLavalink } from './lavalink/manager';
import { registerReadyEvent } from './events/ready';
import { registerInteractionEvent } from './events/interactionCreate';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

client.on('raw', (d) => {
  getLavalink().sendRawData(d).catch((error) => {
    console.error('sendRawData error:', error);
  });
});

initManager(client);
registerReadyEvent(client);
registerInteractionEvent(client);

client.login(config.discordToken);
