import { Client } from 'discord.js';
import { LavalinkManager } from 'lavalink-client';
import { config } from '../config';

let lavalink: LavalinkManager | null = null;

export function getLavalink(): LavalinkManager {
  if (!lavalink) {
    throw new Error('LavalinkManager not initialized. Call initManager first.');
  }
  return lavalink;
}

export function initManager(client: Client): LavalinkManager {
  lavalink = new LavalinkManager({
    nodes: [
      {
        id: 'Main',
        host: config.lavalink.host,
        port: config.lavalink.port,
        authorization: config.lavalink.password,
      },
    ],
    sendToShard(guildId, payload) {
      const guild = client.guilds.cache.get(guildId);
      if (guild) {
        guild.shard.send(payload);
      }
    },
    client: {
      id: '',
      username: '',
    },
    autoSkip: true,
    playerOptions: {
      onEmptyQueue: {
        destroyAfterMs: 30_000,
      },
    },
  });

  lavalink.nodeManager.on('connect', (node) => {
    console.log(`[Lavalink] Node "${node.id}" connected`);
  });

  lavalink.nodeManager.on('error', (node, error) => {
    console.error(`[Lavalink] Node "${node.id}" error: ${error.message}`);
  });

  lavalink.on('trackStart', (player, track) => {
    if (!track) return;
    const channel = client.channels.cache.get(player.textChannelId!);
    if (channel?.isTextBased() && 'send' in channel) {
      (channel as { send: (content: string) => Promise<unknown> }).send(`Now playing: **${track.info.title}**`);
    }
  });

  return lavalink;
}
