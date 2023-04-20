import { createContext, useState, useEffect } from 'react'

export const FeedContext = createContext()

const FeedProvider = ({ app, children }) => {
    const [examples, setExamples] = useState([])

    useEffect(() => {
        console.log('fetching examples for ', app)
    }, [])

    return (
        <FeedContext.Provider value={{ examples }}>
            {children}
        </FeedContext.Provider>
    )
}

export default FeedProvider
