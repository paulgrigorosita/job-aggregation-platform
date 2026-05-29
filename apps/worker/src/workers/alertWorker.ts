import { Worker, type Job } from 'bullmq';
import { createConnection } from '../redis.js';
import { db } from '@jap/database';
import { createLogger } from '@jap/shared';
import type { AlertJobData } from '../queues.js';

const logger = createLogger('worker:alert');

async function sendDiscordAlert(jobId: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const job = await db.job.findUnique({
    where: { id: jobId },
    include: { company: { select: { name: true } }, tags: { select: { tag: true } } },
  });
  if (!job) return;

  const tags = job.tags.map((t) => `\`${t.tag}\``).join(', ');
  const salary =
    job.salaryMin && job.salaryMax
      ? `$${(job.salaryMin / 1000).toFixed(0)}k–$${(job.salaryMax / 1000).toFixed(0)}k`
      : 'Not specified';

  const embed = {
    title: `${job.title} @ ${job.company.name}`,
    url: job.applyUrl,
    color: job.isAI ? 0x7c3aed : 0x2563eb,
    fields: [
      { name: 'Location', value: job.location ?? 'Unknown', inline: true },
      { name: 'Remote', value: job.remote ? 'Yes' : 'No', inline: true },
      { name: 'Salary', value: salary, inline: true },
      { name: 'AI Score', value: `${job.aiScore}/100`, inline: true },
      { name: 'Source', value: job.source, inline: true },
      ...(tags ? [{ name: 'Skills', value: tags, inline: false }] : []),
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'JAP Job Aggregator' },
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
}

async function sendTelegramAlert(jobId: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const job = await db.job.findUnique({
    where: { id: jobId },
    include: { company: { select: { name: true } } },
  });
  if (!job) return;

  const text = [
    `🚀 *${job.title}* at *${job.company.name}*`,
    `📍 ${job.location ?? 'Unknown'} | ${job.remote ? 'Remote' : 'On-site'}`,
    `🤖 AI Score: ${job.aiScore}/100`,
    `🔗 [Apply here](${job.applyUrl})`,
  ].join('\n');

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: false }),
  });
}

export function createAlertWorker() {
  const worker = new Worker<AlertJobData>(
    'alert',
    async (job: Job<AlertJobData>) => {
      const { jobId, channel } = job.data;

      if (channel === 'discord') await sendDiscordAlert(jobId);
      else if (channel === 'telegram') await sendTelegramAlert(jobId);
    },
    {
      connection: createConnection(),
      concurrency: 5,
      limiter: { max: 10, duration: 60_000 },
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.data?.jobId, channel: job?.data?.channel, err }, 'Alert job failed');
  });

  return worker;
}
