import 'dotenv/config';
import { rankNewJobs } from './services/jobRanker.js';
import { db } from '@jap/database';

async function main() {
  const unranked = await db.job.count({ where: { isActive: true, fitScore: null } });
  console.log(`Found ${unranked} unranked jobs. Starting fit scoring...`);

  const { ranked, deactivated } = await rankNewJobs();

  console.log(`Done. Ranked: ${ranked}, Deactivated (low fit): ${deactivated}`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
