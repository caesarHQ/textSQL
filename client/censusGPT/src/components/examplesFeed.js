// Examples
import { useContext } from 'react'
import { FeedContext } from '../contexts/feedContext'
import { ExampleCard } from './exampleCard'
/**
 * Examples component
 * @param {*} props – The props for the example component used to pass in callback functions
 * @param {*} props.posthogInstance - The posthog instance
 * @param {*} props.setQuery - Sets the query in the search bar
 * @param {*} props.handleClick - Handles the search button click
 * @returns {JSX.Element} – The examples component
 */
const ExamplesFeed = (props) => {
    const { examples } = useContext(FeedContext)

    return (
        <div className="px-10 text-gray-900 dark:text-white max-w-6xl">
            <p className={'my-2 font-medium'}>Try one of these examples: </p>
            <div>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}
                >
                    {examples.map((example, idx) => (
                        <ExampleCard
                            key={idx}
                            example={example}
                            props={props}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ExamplesFeed
