import { describe, it, expect } from 'vitest';
import { isUSRelevant } from '../utils/location.js';

describe('isUSRelevant', () => {
  it.each([
    // US locations — should pass
    ['San Francisco, CA', true],
    ['New York, NY', true],
    ['Remote (US)', true],
    ['US Remote', true],
    ['Remote - United States', true],
    ['United States', true],
    ['Remote', true],
    ['Austin, Texas', true],
    ['Seattle, WA', true],
    ['Worldwide', true],
    ['Global', true],
    ['Anywhere', true],
    // Canada — should be rejected
    ['Canada', false],
    ['Remote, Canada', false],
    ['Remote - Canada', false],
    ['Toronto, ON, Canada', false],
    ['Toronto, Canada only', false],
    ['Vancouver, BC', false],
    ['Montreal, Quebec', false],
    ['Calgary, Alberta', false],
    ['Ottawa, Ontario', false],
    // Other non-US — should be rejected
    ['London, UK', false],
    ['Bangalore, India', false],
    ['Europe only', false],
    ['Europe', false],
    ['EU only', false],
    ['EMEA', false],
    ['Remote - EMEA', false],
    ['', false],
    ['Singapore', false],
    ['Sydney, Australia', false],
  ] as const)('isUSRelevant(%s) === %s', (loc, expected) => {
    expect(isUSRelevant(loc)).toBe(expected);
  });
});
