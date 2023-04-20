import React from 'react'
import ReactDOM from 'react-dom'
import './css/index.css'
import App from './App'
import SanFrancisco from './SanFrancisco'
import reportWebVitals from './reportWebVitals'
import { sendToVercelAnalytics } from './vitals'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import TermsOfService from './misc/tos'
import PrivacyPolicy from './misc/privacy'
import FeedProvider from './contexts/feedContext'

const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <FeedProvider app="USA">
                <App />
            </FeedProvider>
        ),
    },
    {
        path: '/sf',
        element: (
            <FeedProvider app="SF">
                <SanFrancisco />
            </FeedProvider>
        ),
    },
    {
        path: '/sanfrancisco',
        element: (
            <FeedProvider app="SF">
                <SanFrancisco />
            </FeedProvider>
        ),
    },
    {
        path: '/tos',
        element: <TermsOfService />,
    },
    {
        path: '/privacy',
        element: <PrivacyPolicy />,
    },
])

ReactDOM.render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
    document.getElementById('root')
)

reportWebVitals(sendToVercelAnalytics)
