// Examples
import { useContext } from 'react'
import { FeedContext } from '../contexts/feedContext'

import { capturePosthog } from '../utils/loggers/posthog'

const ExampleCard = ({ example, props }) => {
    return (
        <div className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white dark:bg-dark-800 px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400">
            <div className="min-w-0 flex-1">
                <p
                    className="focus:outline-none hover:cursor-pointer"
                    onClick={() => {
                        capturePosthog('example_clicked', {
                            natural_language_query: example.input_text,
                        })
                        props.setQuery(example.input_text)
                        props.handleClick(example.input_text)
                    }}
                >
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium">
                        {example.emoji} {example.input_text}
                    </p>
                </p>
            </div>
            <svg
                className="h-5 w-5 hidden sm:block"
                fill="currentColor"
                viewBox="0 0 24 24"
            >
                <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
            </svg>
        </div>
    )
}

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
    console.log('examples: ', examples)

    return (
        <div className="px-10 text-gray-900 dark:text-white max-w-4xl">
            <p className={'my-2 font-medium'}> Try these: </p>
            <div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
