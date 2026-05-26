import dotenv from 'dotenv';

dotenv.config();

export const config = {
  discordToken: process.env.DISCORD_TOKEN || '',
  lavalink: {
    host: process.env.LAVALINK_HOST || 'localhost',
    port: parseInt(process.env.LAVALINK_PORT || '2333', 10),
    password: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
  },
};
