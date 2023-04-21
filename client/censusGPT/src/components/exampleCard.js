import { capturePosthog } from '../utils/loggers/posthog'
export const ExampleCard = ({ example, props }) => {
    return (
        <div
            className="relative flex flex-col items-center rounded-lg border border-gray-300 bg-white dark:bg-dark-800 px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 hover:cursor-pointer hover:transform hover:scale-105 transition-all duration-200"
            onClick={() => {
                capturePosthog('example_clicked', {
                    natural_language_query: example.input_text,
                })
                props.setQuery(example.input_text)
                props.handleClick(example.input_text)
            }}
        >
            {example.img && (
                <img
                    src={example.img}
                    className="h-full w-full object-cover rounded-t-lg"
                />
            )}
            <div className="flex items-center justify-center w-10 h-10 bg-gray-200 dark:bg-dark-700 rounded-full -mt-5 mx-auto">
                <span className="text-lg">{example.emoji}</span>
            </div>
            <div className="ml-4 flex-1 pt-3">
                <p className="text-sm sm:text-lg font-medium focus:outline-none">
                    {example.input_text}
                </p>
            </div>
            <svg
                className="h-5 w-5 hidden sm:block self-end mt-3"
                fill="currentColor"
                viewBox="0 0 24 24"
            >
                <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
            </svg>
        </div>
    )
}
