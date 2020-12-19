import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';

Sentry.init({
    dsn: 'https://08cf17c769734a8a8a5b95cacde0c250@o491618.ingest.sentry.io/5557471',
    integrations: [new Integrations.BrowserTracing()],

    tracesSampleRate: 1.0,
});
