/**
 * Greenhouse company discovery — probes the Greenhouse jobs API for a list
 * of candidate slugs and adds valid ones to the DB automatically.
 *
 * Sources for candidate slugs:
 *  - A large bundled list of known tech companies
 *  - Slug variations derived from company names already in DB
 */

import { createHttpClient, createLogger, slugify } from '@jap/shared';
import { db } from '@jap/database';

const logger = createLogger('discovery:greenhouse');
const http = createHttpClient(process.env.PROXY_URL);

// Large list of known/suspected Greenhouse slugs across the tech industry
const CANDIDATE_SLUGS: Array<{ name: string; slug: string }> = [
  // AI / ML
  { name: 'Scale AI', slug: 'scaleai' },
  { name: 'Hugging Face', slug: 'huggingface' },
  { name: 'Runway', slug: 'runwayml' },
  { name: 'Inflection AI', slug: 'inflection' },
  { name: 'Adept', slug: 'adept' },
  { name: 'Imbue', slug: 'imbue' },
  { name: 'Labelbox', slug: 'labelbox' },
  { name: 'Snorkel AI', slug: 'snorkelai' },
  { name: 'Weights & Biases', slug: 'wandb' },
  { name: 'Modal', slug: 'modal' },
  { name: 'Lightning AI', slug: 'lightningai' },
  { name: 'Replicate', slug: 'replicate' },
  { name: 'Together AI', slug: 'togetherai' },
  // Fintech
  { name: 'Stripe', slug: 'stripe' },
  { name: 'Brex', slug: 'brex' },
  { name: 'Plaid', slug: 'plaid' },
  { name: 'Robinhood', slug: 'robinhood' },
  { name: 'Coinbase', slug: 'coinbase' },
  { name: 'Chime', slug: 'chime' },
  { name: 'Marqeta', slug: 'marqeta' },
  { name: 'Affirm', slug: 'affirm' },
  { name: 'Klarna', slug: 'klarna' },
  { name: 'Navan', slug: 'navan' },
  { name: 'Ramp', slug: 'ramp' },
  { name: 'Mercury', slug: 'mercury' },
  { name: 'Brex', slug: 'brex' },
  { name: 'Pilot', slug: 'pilot' },
  { name: 'Modern Treasury', slug: 'moderntreasury' },
  { name: 'Sardine', slug: 'sardine' },
  { name: 'Synapse', slug: 'synapsepay' },
  { name: 'Unit', slug: 'unit' },
  { name: 'Lithic', slug: 'lithic' },
  { name: 'Stytch', slug: 'stytch' },
  { name: 'Persona', slug: 'persona' },
  { name: 'Sift', slug: 'sift' },
  { name: 'Alloy', slug: 'alloy' },
  // Developer tools / infra
  { name: 'Vercel', slug: 'vercel' },
  { name: 'Netlify', slug: 'netlify' },
  { name: 'Datadog', slug: 'datadog' },
  { name: 'Sentry', slug: 'sentry' },
  { name: 'PagerDuty', slug: 'pagerduty' },
  { name: 'HashiCorp', slug: 'hashicorp' },
  { name: 'Elastic', slug: 'elastic' },
  { name: 'MongoDB', slug: 'mongodb' },
  { name: 'Cockroach Labs', slug: 'cockroachlabs' },
  { name: 'SingleStore', slug: 'singlestore' },
  { name: 'Yugabyte', slug: 'yugabyte' },
  { name: 'Temporal', slug: 'temporal' },
  { name: 'Sourcegraph', slug: 'sourcegraph' },
  { name: 'Teleport', slug: 'teleport' },
  { name: 'Tailscale', slug: 'tailscale' },
  { name: 'Wiz', slug: 'wiz' },
  { name: 'Orca Security', slug: 'orca' },
  { name: 'Lacework', slug: 'lacework' },
  { name: 'Snyk', slug: 'snyk' },
  { name: 'Semgrep', slug: 'semgrep' },
  { name: 'Postman', slug: 'postman' },
  { name: 'Stoplight', slug: 'stoplight' },
  { name: 'ReadMe', slug: 'readme' },
  { name: 'Retool', slug: 'retool' },
  { name: 'Appsmith', slug: 'appsmith' },
  { name: 'Airplane', slug: 'airplane' },
  { name: 'Retool', slug: 'retool' },
  { name: 'Segment', slug: 'segment' },
  { name: 'Mixpanel', slug: 'mixpanel' },
  { name: 'Amplitude', slug: 'amplitude' },
  { name: 'FullStory', slug: 'fullstory' },
  { name: 'Heap', slug: 'heap' },
  { name: 'LogRocket', slug: 'logrocket' },
  { name: 'Hotjar', slug: 'hotjar' },
  { name: 'Optimizely', slug: 'optimizely' },
  { name: 'LaunchDarkly', slug: 'launchdarkly' },
  { name: 'Split', slug: 'split' },
  // Cloud / Infra
  { name: 'Cloudflare', slug: 'cloudflare' },
  { name: 'Fastly', slug: 'fastly' },
  { name: 'Akamai', slug: 'akamai' },
  { name: 'Equinix', slug: 'equinix' },
  { name: 'DigitalOcean', slug: 'digitalocean' },
  { name: 'Linode', slug: 'linode' },
  { name: 'CoreWeave', slug: 'coreweave' },
  { name: 'Lambda Labs', slug: 'lambdalabs' },
  // Productivity / Collab
  { name: 'Notion', slug: 'notion' },
  { name: 'Coda', slug: 'coda' },
  { name: 'Airtable', slug: 'airtable' },
  { name: 'Loom', slug: 'loom' },
  { name: 'Miro', slug: 'miro' },
  { name: 'Figma', slug: 'figma' },
  { name: 'Webflow', slug: 'webflow' },
  { name: 'Framer', slug: 'framer' },
  { name: 'Linear', slug: 'linear' },
  { name: 'Height', slug: 'height' },
  { name: 'Shortcut', slug: 'shortcut' },
  { name: 'Asana', slug: 'asana' },
  { name: 'Monday.com', slug: 'mondaycom' },
  { name: 'ClickUp', slug: 'clickup' },
  // HR / Work
  { name: 'Rippling', slug: 'rippling' },
  { name: 'Gusto', slug: 'gusto' },
  { name: 'Lattice', slug: 'lattice' },
  { name: 'Leapsome', slug: 'leapsome' },
  { name: 'Workday', slug: 'workday' },
  { name: 'BambooHR', slug: 'bamboohr' },
  { name: 'Greenhouse', slug: 'greenhouse' },
  { name: 'Lever', slug: 'lever' },
  // Healthcare / Bio
  { name: 'Oscar Health', slug: 'oscar' },
  { name: 'Ro', slug: 'ro' },
  { name: 'Hims & Hers', slug: 'hims' },
  { name: 'Carbon Health', slug: 'carbonhealth' },
  { name: 'Color', slug: 'color' },
  { name: 'Tempus', slug: 'tempus' },
  { name: 'Recursion', slug: 'recursionpharma' },
  // E-commerce / Marketplace
  { name: 'Shopify', slug: 'shopify' },
  { name: 'Faire', slug: 'faire' },
  { name: 'Whatnot', slug: 'whatnot' },
  { name: 'StockX', slug: 'stockx' },
  { name: 'Poshmark', slug: 'poshmark' },
  { name: 'Depop', slug: 'depop' },
  // Logistics / Mobility
  { name: 'Lyft', slug: 'lyft' },
  { name: 'DoorDash', slug: 'doordash' },
  { name: 'Instacart', slug: 'instacart' },
  { name: 'Waymo', slug: 'waymo' },
  { name: 'Cruise', slug: 'cruise' },
  { name: 'Aurora', slug: 'aurora' },
  { name: 'Nuro', slug: 'nuro' },
  { name: 'Zoox', slug: 'zoox' },
  // Media / Consumer
  { name: 'Reddit', slug: 'reddit' },
  { name: 'Pinterest', slug: 'pinterest' },
  { name: 'Snap', slug: 'snap' },
  { name: 'Discord', slug: 'discord' },
  { name: 'Duolingo', slug: 'duolingo' },
  { name: 'Calm', slug: 'calm' },
  { name: 'Headspace', slug: 'headspace' },
  { name: 'Spotify', slug: 'spotify' },
  { name: 'SoundCloud', slug: 'soundcloud' },
  // Enterprise SaaS
  { name: 'Salesforce', slug: 'salesforce' },
  { name: 'Okta', slug: 'okta' },
  { name: 'Zendesk', slug: 'zendesk' },
  { name: 'HubSpot', slug: 'hubspot' },
  { name: 'Intercom', slug: 'intercom' },
  { name: 'Drift', slug: 'drift' },
  { name: 'Gong', slug: 'gong' },
  { name: 'Outreach', slug: 'outreach' },
  { name: 'Salesloft', slug: 'salesloft' },
  { name: 'Chorus', slug: 'chorus' },
  { name: 'Clari', slug: 'clari' },
  { name: 'Gainsight', slug: 'gainsight' },
  { name: 'Totango', slug: 'totango' },
  { name: 'ChurnZero', slug: 'churnzero' },
  { name: 'Pendo', slug: 'pendo' },
  { name: 'Productboard', slug: 'productboard' },
  { name: 'Aha!', slug: 'aha' },
  { name: 'Vanta', slug: 'vanta' },
  { name: 'Drata', slug: 'drata' },
  { name: 'Tugboat Logic', slug: 'tugboatlogic' },
  { name: 'Secureframe', slug: 'secureframe' },
  // Data / BI
  { name: 'Snowflake', slug: 'snowflake' },
  { name: 'Databricks', slug: 'databricks' },
  { name: 'Fivetran', slug: 'fivetran' },
  { name: 'Airbyte', slug: 'airbyte' },
  { name: 'dbt Labs', slug: 'dbtlabs' },
  { name: 'Looker', slug: 'looker' },
  { name: 'Mode', slug: 'mode' },
  { name: 'Hex', slug: 'hex' },
  { name: 'Metabase', slug: 'metabase' },
  { name: 'ThoughtSpot', slug: 'thoughtspot' },
  { name: 'Atlan', slug: 'atlan' },
  { name: 'Alation', slug: 'alation' },
  { name: 'Collibra', slug: 'collibra' },
  { name: 'Monte Carlo', slug: 'montecarlodata' },
  { name: 'Great Expectations', slug: 'greatexpectations' },
  // Security
  { name: 'CrowdStrike', slug: 'crowdstrike' },
  { name: 'Palo Alto Networks', slug: 'paloaltonetworks' },
  { name: 'SentinelOne', slug: 'sentinelone' },
  { name: 'Abnormal Security', slug: 'abnormalsecurity' },
  { name: 'Cybereason', slug: 'cybereason' },
  { name: 'Exabeam', slug: 'exabeam' },
  { name: 'Cyera', slug: 'cyera' },
  { name: 'Armis', slug: 'armis' },
  { name: 'Axonius', slug: 'axonius' },
  // Other notable
  { name: 'Anthropic', slug: 'anthropic' },
  { name: 'OpenAI', slug: 'openai' },
  { name: 'Zoom', slug: 'zoom' },
  { name: 'Dropbox', slug: 'dropbox' },
  { name: 'Box', slug: 'box' },
  { name: 'GitHub', slug: 'github' },
  { name: 'GitLab', slug: 'gitlab' },
  { name: 'Palantir', slug: 'palantir' },
  { name: 'Twilio', slug: 'twilio' },
  { name: 'SendGrid', slug: 'sendgrid' },
  { name: 'Uber', slug: 'uber' },
  { name: 'Airbnb', slug: 'airbnb' },
  { name: 'Expensify', slug: 'expensify' },
];

async function probeSlug(slug: string): Promise<boolean> {
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
    const res = await http.get<{ jobs: unknown[] }>(url);
    return Array.isArray(res?.jobs);
  } catch {
    return false;
  }
}

export async function discoverGreenhouseCompanies(): Promise<number> {
  let added = 0;

  // Deduplicate candidates
  const seen = new Set<string>();
  const candidates = CANDIDATE_SLUGS.filter((c) => {
    if (seen.has(c.slug)) return false;
    seen.add(c.slug);
    return true;
  });

  // Find slugs not already tracked
  const existing = await db.company.findMany({
    where: { atsType: 'greenhouse' },
    select: { atsSlug: true },
  });
  const existingSlugs = new Set(existing.map((c) => c.atsSlug));

  const toProbe = candidates.filter((c) => !existingSlugs.has(c.slug));
  logger.info({ total: toProbe.length }, 'Probing Greenhouse slugs');

  for (const { name, slug } of toProbe) {
    const valid = await probeSlug(slug);
    if (valid) {
      await db.company.upsert({
        where: { slug: slugify(name) },
        create: { name, slug: slugify(name), atsType: 'greenhouse', atsSlug: slug },
        update: { atsType: 'greenhouse', atsSlug: slug },
      });
      logger.info({ name, slug }, 'Discovered Greenhouse company');
      added++;
    }
    // Polite delay
    await new Promise((r) => setTimeout(r, 300));
  }

  logger.info({ added }, 'Greenhouse discovery complete');
  return added;
}
