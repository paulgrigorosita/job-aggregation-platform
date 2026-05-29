import { createHash } from 'crypto';

export function hashUrl(url: string): string {
  const normalized = url
    .toLowerCase()
    .replace(/\/$/, '')
    .replace(/([?&])utm_[^&]*(&|$)/g, '$1')
    .replace(/([?&])ref=[^&]*(&|$)/g, '$1')
    .replace(/[?&]$/, '');
  return createHash('sha256').update(normalized).digest('hex');
}

export function normalizeCompanyTitle(company: string, title: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  return `${clean(company)}::${clean(title)}`;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
