import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

const SENTRY_ROUTE = process.env.REACT_APP_SENTRY_ROUTE

if (SENTRY_ROUTE) {
    Sentry.init({
        dsn: SENTRY_ROUTE,
        integrations: [new BrowserTracing()],
        tracesSampleRate: 1.0,
    })
}

export const logSentryError = (queryContext, err) => {
    console.log('LOGGING TO SENTRY')
    if (SENTRY_ROUTE) {
        Sentry.setContext('queryContext', queryContext)
        Sentry.captureException(err)
    }
}