import * as Sentry from '@sentry/react';

export function initSentry(dsn?: string) {
  if (!dsn) return;
  try {
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
  } catch (err) {
    // ignore init errors
    // eslint-disable-next-line no-console
    console.warn('Sentry init failed', err);
  }
}
