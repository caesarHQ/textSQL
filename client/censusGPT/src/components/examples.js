// Examples
import { capturePosthog } from "../utils/loggers/posthog"
/**
 * Examples component
 * @param {*} props – The props for the example component used to pass in callback functions
 * @param {*} props.posthogInstance - The posthog instance
 * @param {*} props.setQuery - Sets the query in the search bar
 * @param {*} props.handleClick - Handles the search button click
 * @returns {JSX.Element} – The examples component
 */
const Examples = (props) => {
    let basic_example_queries = [
        'Five cities in Florida with the highest crime',
        'Richest neighborhood in Houston, TX',
    ]
    let advanced_example_queries = [
        '3 neighborhoods in San Francisco that have the highest female to male ratio',
        'Which area in San Francisco has the highest racial diversity and what is the percentage population of each race in that area?',
        // "Which 5 areas have the median income closest to the national median income?"
    ]

    if (props.version === 'San Francisco') {
        basic_example_queries = [
            'Show me the locations of the 10 highest rated coffee shops with at least 100 ratings.',
            'Which neighborhood has the most parks?',
            'Show me all the needles in SF',
            'Show me all the muggings',
            'Which two neighborhoods have the most homeless activity?',
            'Which five neighborhoods have the most poop on the street?',
        ]
        advanced_example_queries = [
            'Which four neighborhoods had the most crime incidents involving guns or knives in 2021?',
            '3 neighborhoods with the highest female to male ratio',
            'What are the top 5 neighborhoods with the most encampments per capita?',
            'What hour of the day do most burglaries occur?',
        ]
    }

    return (
        <div className="px-10 text-gray-900 dark:text-white max-w-4xl">
            <p className={'my-2 font-medium'}> Try these: </p>
            <div>
                <p className="my-4"> Basic </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {basic_example_queries.map((q) => (
                        <div
                            key={q}
                            className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white dark:bg-dark-800 px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400"
                        >
                            <div className="min-w-0 flex-1">
                                <p
                                    className="focus:outline-none hover:cursor-pointer"
                                    onClick={() => {
                                        capturePosthog(
                                            'example_clicked',
                                            { natural_language_query: q }
                                        )
                                        props.setQuery(q)
                                        props.handleClick(q)
                                    }}
                                >
                                    <span
                                        className="absolute inset-0"
                                        aria-hidden="true"
                                    />
                                    <p className="text-sm font-medium">{q}</p>
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
                    ))}
                </div>
            </div>
            <div>
                <p className="my-4"> Advanced </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {advanced_example_queries.map((q) => (
                        <div
                            key={q}
                            className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white dark:bg-dark-800 px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400"
                        >
                            <div className="min-w-0 flex-1">
                                <p
                                    className="focus:outline-none hover:cursor-pointer"
                                    onClick={() => {
                                        capturePosthog(
                                            'example_clicked',
                                            { natural_language_query: q }
                                        )
                                        props.setQuery(q)
                                        props.handleClick(q)
                                    }}
                                >
                                    <span
                                        className="absolute inset-0"
                                        aria-hidden="true"
                                    />
                                    <p className="text-sm font-medium">{q}</p>
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
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Examples
