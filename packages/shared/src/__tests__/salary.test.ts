import { describe, it, expect } from 'vitest';
import { parseSalary } from '../utils/salary.js';

describe('parseSalary', () => {
  it('returns null for null', () => expect(parseSalary(null)).toBeNull());
  it('returns null for empty string', () => expect(parseSalary('')).toBeNull());
  it('parses $120k-$160k', () => {
    const r = parseSalary('$120k-$160k');
    expect(r?.min).toBe(120000);
    expect(r?.max).toBe(160000);
    expect(r?.period).toBe('annual');
  });
  it('parses $60-$80/hr', () => {
    const r = parseSalary('$60-$80/hr');
    expect(r?.min).toBe(60);
    expect(r?.max).toBe(80);
    expect(r?.period).toBe('hourly');
  });
  it('parses single $150,000', () => {
    const r = parseSalary('$150,000');
    expect(r?.min).toBe(150000);
    expect(r?.max).toBeNull();
  });
  it('returns USD currency', () => {
    expect(parseSalary('$100k')?.currency).toBe('USD');
  });
});
