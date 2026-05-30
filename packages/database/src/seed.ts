import { db } from './index.js';
import companies from './seeds/companies.json';

async function seed() {
  console.log(`Seeding ${companies.length} companies...`);

  for (const company of companies) {
    await db.company.upsert({
      where: { slug: company.slug },
      create: {
        name: company.name,
        slug: company.slug,
        atsType: company.atsType ?? null,
        atsSlug: company.atsSlug ?? null,
      },
      update: {
        atsType: company.atsType ?? null,
        atsSlug: company.atsSlug ?? null,
      },
    });
  }

  console.log('Seed complete.');
  await db.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
