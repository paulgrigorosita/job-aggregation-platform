import { describe, it, expect } from 'vitest';
import { hashUrl, normalizeCompanyTitle, slugify } from '../utils/hash.js';

describe('hashUrl', () => {
  it('produces consistent hash', () => {
    const h1 = hashUrl('https://example.com/jobs/123');
    const h2 = hashUrl('https://example.com/jobs/123');
    expect(h1).toBe(h2);
  });
  it('strips trailing slash', () => {
    expect(hashUrl('https://example.com/jobs')).toBe(hashUrl('https://example.com/jobs/'));
  });
});

describe('normalizeCompanyTitle', () => {
  it('normalizes to lowercase with double colon separator', () => {
    expect(normalizeCompanyTitle('Acme Inc.', 'Senior Engineer')).toBe('acme inc::senior engineer');
  });
});

describe('slugify', () => {
  it('converts to slug', () => {
    expect(slugify('Acme Inc.')).toBe('acme-inc');
  });
});
