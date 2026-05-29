// got-scraping is purpose-built for web scraping with TLS fingerprint rotation
import gotScraping from 'got-scraping';

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

export function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function createHttpClient(proxyUrl?: string) {
  return gotScraping.extend({
    headers: { 'user-agent': randomUA() },
    timeout: { request: 20_000 },
    retry: {
      limit: 3,
      methods: ['GET', 'POST'],
      statusCodes: [408, 429, 500, 502, 503, 504],
      calculateDelay: ({ retryCount }) =>
        Math.min(1000 * 2 ** retryCount + Math.random() * 200, 30_000),
    },
    ...(proxyUrl ? { proxyUrl } : {}),
  });
}
