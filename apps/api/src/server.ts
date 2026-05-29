import 'dotenv/config';
import { createLogger } from '@jap/shared';
import { buildApp } from './app.js';

const logger = createLogger('server');
const PORT = Number(process.env.PORT ?? 3001);

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    logger.info({ port: PORT }, 'API server started');
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
