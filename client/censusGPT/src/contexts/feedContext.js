import { createContext, useState, useEffect } from 'react'

export const FeedContext = createContext()

const FeedProvider = ({ children }) => {
    const [examples, setExamples] = useState([])

    useEffect(() => {
        console.log('fetching examples')
    }, [])

    return (
        <FeedContext.Provider value={{ examples }}>
            {children}
        </FeedContext.Provider>
    )
}

export default FeedProvider
