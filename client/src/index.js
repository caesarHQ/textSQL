import React from 'react'
import ReactDOM from 'react-dom'
import './css/index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { sendToVercelAnalytics } from './vitals'
import 'mapbox-gl/dist/mapbox-gl.css'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import {
    createBrowserRouter,
    RouterProvider,
} from 'react-router-dom'

Sentry.init({
    dsn: 'https://5072f8efa99b414788bf6b7307464081@o4504813129826304.ingest.sentry.io/4504813131530240',
    integrations: [new BrowserTracing()],
    tracesSampleRate: 1.0,
})

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
    },
])

ReactDOM.render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
    document.getElementById('root')
)

reportWebVitals(sendToVercelAnalytics)
