import posthog from 'posthog-js'

const POSTHOG_KEY = process.env.REACT_APP_POSTHOG_KEY

if (POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
        api_host: 'https://app.posthog.com',
    })
}

export const capturePosthog = (eventName, properties) => {
    if (POSTHOG_KEY) {
        posthog.capture(eventName, properties)
    }
}