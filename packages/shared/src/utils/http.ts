import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

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

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const status = (err as { response?: { status?: number } })?.response?.status;
      const retryable = !status || [408, 429, 500, 502, 503, 504].includes(status);
      if (!retryable || attempt === maxAttempts - 1) throw err;
      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 200, 30_000);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export interface HttpClient {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
}

export function createHttpClient(proxyUrl?: string): HttpClient {
  const instance: AxiosInstance = axios.create({
    timeout: 20_000,
    headers: { 'User-Agent': randomUA() },
    ...(proxyUrl ? { proxy: false, httpAgent: undefined } : {}),
  });

  return {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
      withRetry(() => instance.get<T>(url, config).then((r) => r.data)),
    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      withRetry(() => instance.post<T>(url, data, config).then((r) => r.data)),
  };
}
