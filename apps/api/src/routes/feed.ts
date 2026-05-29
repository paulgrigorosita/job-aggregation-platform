import type { FastifyInstance } from 'fastify';
import { db } from '@jap/database';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function feedRoutes(app: FastifyInstance) {
  app.get('/feed.xml', {
    schema: { tags: ['stats'], summary: 'RSS feed of latest AI jobs' },
    async handler(_request, reply) {
      const jobs = await db.job.findMany({
        where: { isActive: true, isAI: true },
        include: {
          company: { select: { name: true } },
          tags: { select: { tag: true } },
        },
        orderBy: { postedAt: 'desc' },
        take: 100,
      });

      const items = jobs
        .map((job) => {
          const title = escapeXml(`${job.title} at ${job.company.name}`);
          const desc = escapeXml((job.description ?? '').slice(0, 500));
          const pubDate = (job.postedAt ?? job.firstSeenAt).toUTCString();
          const link = escapeXml(job.applyUrl);
          return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${desc}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${job.id}</guid>
      <category>${escapeXml(job.source)}</category>
    </item>`;
        })
        .join('');

      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AI &amp; Tech Jobs - JAP</title>
    <link>${process.env.NEXT_PUBLIC_API_URL ?? 'https://jobs.example.com'}</link>
    <description>US-based AI and Full-Stack engineering jobs</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

      return reply.type('application/rss+xml').send(rss);
    },
  });
}
