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
        element: <App />,
    },
    {
        path: '/sf',
        element: <SanFrancisco />,
    },
    {
        path: '/sanfrancisco',
        element: <SanFrancisco />,
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
        <FeedProvider>
            <RouterProvider router={router} />
        </FeedProvider>
    </React.StrictMode>,
    document.getElementById('root')
)

reportWebVitals(sendToVercelAnalytics)
