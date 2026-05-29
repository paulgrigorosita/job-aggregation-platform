import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { createLogger } from '@jap/shared';
import { jobRoutes } from './routes/jobs.js';
import { companyRoutes } from './routes/companies.js';
import { statsRoutes } from './routes/stats.js';
import { feedRoutes } from './routes/feed.js';

const logger = createLogger('api');

export async function buildApp() {
  const app = Fastify({
    logger: false, // using our own pino logger
    trustProxy: true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({ statusCode: 429, error: 'Too Many Requests', message: 'Rate limit exceeded' }),
  });

  await app.register(swagger, {
    openapi: {
      info: { title: 'Job Aggregation API', version: '1.0.0', description: 'US-focused tech job aggregation platform' },
      tags: [
        { name: 'jobs', description: 'Job listings' },
        { name: 'companies', description: 'Companies' },
        { name: 'stats', description: 'Platform statistics' },
      ],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes
  await app.register(jobRoutes, { prefix: '/api/v1' });
  await app.register(companyRoutes, { prefix: '/api/v1' });
  await app.register(statsRoutes, { prefix: '/api/v1' });
  await app.register(feedRoutes, { prefix: '/api/v1' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    logger.error({ err: error, url: request.url }, 'Request error');

    if (error.statusCode === 429) {
      return reply.status(429).send({ error: 'Too Many Requests' });
    }
    if (error.statusCode && error.statusCode < 500) {
      return reply.status(error.statusCode).send({ error: error.message });
    }

    return reply.status(500).send({ error: 'Internal server error' });
  });

  return app;
}
