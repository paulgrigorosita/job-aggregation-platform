import { describe, it, expect } from 'vitest';
import { isUSRelevant } from '../utils/location.js';

describe('isUSRelevant', () => {
  it.each([
    ['San Francisco, CA', true],
    ['New York, NY', true],
    ['Remote (US)', true],
    ['US Remote', true],
    ['Remote - United States', true],
    ['United States', true],
    ['Remote', true],
    ['Remote - North America', true],
    ['Austin, Texas', true],
    ['Seattle, WA', true],
    ['London, UK', false],
    ['Bangalore, India', false],
    ['Europe only', false],
    ['EU only', false],
    ['EMEA', false],
    ['Remote - EMEA', false],
    ['', false],
    ['Singapore', false],
    ['Toronto, Canada only', false],
  ] as const)('isUSRelevant(%s) === %s', (loc, expected) => {
    expect(isUSRelevant(loc)).toBe(expected);
  });
});
