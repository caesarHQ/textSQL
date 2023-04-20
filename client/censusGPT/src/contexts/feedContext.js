import { createContext, useState, useEffect } from 'react'

export const FeedContext = createContext()

let api_endpoint =
    process.env.REACT_APP_API_URL || 'https://dev-text-sql-be.onrender.com'

if (process.env.REACT_APP_HOST_ENV === 'dev') {
    api_endpoint = 'http://localhost:9000'
}

const FeedProvider = ({ app, children }) => {
    const [examples, setExamples] = useState([])

    const fetchExamples = async () => {
        const response = await fetch(`${api_endpoint}/examples/${app}`)
        const data = await response.json()
        if (data.success) {
            setExamples(data.examples)
        }
    }

    useEffect(() => {
        console.log('fetching examples for ', app)
        fetchExamples()
    }, [])

    return (
        <FeedContext.Provider value={{ examples }}>
            {children}
        </FeedContext.Provider>
    )
}

export default FeedProvider
