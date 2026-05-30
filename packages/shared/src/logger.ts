// Own interface so DTS build never needs to resolve pino's ESM-only types
export interface Logger {
  info(obj: object | string, msg?: string): void;
  warn(obj: object | string, msg?: string): void;
  error(obj: object | string, msg?: string): void;
  debug(obj: object | string, msg?: string): void;
  fatal(obj: object | string, msg?: string): void;
  trace(obj: object | string, msg?: string): void;
  child(bindings: Record<string, unknown>): Logger;
}

function buildLogger(): Logger {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pino = require('pino');
    const isDev = process.env.NODE_ENV !== 'production';
    return pino({
      level: process.env.LOG_LEVEL ?? 'info',
      transport: isDev
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    });
  } catch {
    const fmt = (obj: object | string, msg?: string) => {
      const message = typeof obj === 'string' ? obj : msg ?? '';
      const extra = typeof obj === 'object' ? JSON.stringify(obj) : '';
      return `${message} ${extra}`.trim();
    };
    const stub: Logger = {
      info: (o, m) => console.info(fmt(o, m)),
      warn: (o, m) => console.warn(fmt(o, m)),
      error: (o, m) => console.error(fmt(o, m)),
      debug: (o, m) => console.debug(fmt(o, m)),
      fatal: (o, m) => console.error(fmt(o, m)),
      trace: (o, m) => console.debug(fmt(o, m)),
      child: () => stub,
    };
    return stub;
  }
}

export const logger: Logger = buildLogger();

export function createLogger(name: string): Logger {
  return logger.child({ module: name });
}
