import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { parseISO, parse, subDays, isValid } from 'date-fns';

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });

export function normalizeTitle(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

export function normalizeDescription(html: string): string {
  if (!html) return '';
  // If it looks like plain text already
  if (!html.includes('<')) return html.slice(0, 15_000);
  try {
    return turndown.turndown(html).slice(0, 15_000);
  } catch {
    const $ = cheerio.load(html);
    return $.text().replace(/\s+/g, ' ').trim().slice(0, 15_000);
  }
}

export function normalizeLocation(raw: string): { location: string; remote: boolean } {
  if (!raw) return { location: '', remote: false };
  const trimmed = raw.trim();
  const remote =
    /remote/i.test(trimmed) ||
    /distributed/i.test(trimmed) ||
    /anywhere/i.test(trimmed);
  return { location: trimmed, remote };
}

export function normalizeDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  // ISO 8601
  try {
    const d = parseISO(raw);
    if (isValid(d)) return d;
  } catch {}
  // Relative: "3 days ago"
  const relMatch = /(\d+)\s+day/i.exec(raw);
  if (relMatch) return subDays(new Date(), parseInt(relMatch[1]));
  // Common formats
  const formats = ['MM/dd/yyyy', 'yyyy-MM-dd', 'MMMM d, yyyy'];
  for (const fmt of formats) {
    try {
      const d = parse(raw, fmt, new Date());
      if (isValid(d)) return d;
    } catch {}
  }
  // Unix timestamp
  const ts = Number(raw);
  if (!isNaN(ts) && ts > 1_000_000_000) return new Date(ts * 1000);
  return null;
}
