import type { SalaryRange } from '../types/job.js';

export function parseSalary(raw: string | null | undefined): SalaryRange | null {
  if (!raw) return null;

  const isHourly = /\/(hr|hour)/i.test(raw);
  const period: SalaryRange['period'] = isHourly ? 'hourly' : 'annual';

  // Match amounts like $120k, $120,000, 120000
  const amountRe = /\$?([\d,]+(?:\.\d+)?)\s*(k)?/gi;
  const matches: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = amountRe.exec(raw)) !== null) {
    const n = parseFloat(m[1].replace(/,/g, ''));
    const val = m[2] ? n * 1000 : n;
    // Ignore values that can't be a real salary (IDs, timestamps, etc.)
    if (val > 0 && val <= 10_000_000) matches.push(val);
  }

  if (matches.length === 0) return null;
  if (matches.length === 1) return { min: matches[0], max: null, currency: 'USD', period };

  const sorted = matches.slice(0, 2).sort((a, b) => a - b);
  return { min: sorted[0], max: sorted[1], currency: 'USD', period };
}
