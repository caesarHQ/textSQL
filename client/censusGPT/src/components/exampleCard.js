import { capturePosthog } from '../utils/loggers/posthog'

export const ExampleCard = ({ example, props }) => {
    return (
        <div
            className="relative flex flex-col items-center rounded-lg shadow-md hover:shadow-lg bg-white dark:bg-dark-800 px-6 py-5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:cursor-pointer hover:transform hover:scale-105 transition-all duration-200"
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
                    loading="lazy"
                    className="h-full w-full object-cover rounded-t-lg"
                />
            )}
            <div className="flex items-center justify-center w-10 h-10 bg-gray-200 dark:bg-dark-700 rounded-full -mt-5 mx-auto">
                <span className="text-lg">{example.emoji}</span>
            </div>
            <p className="text-sm sm:text-lg font-medium text-black bg-gray-100 dark:bg-dark-600 p-2 rounded-lg focus:outline-none w-full px-4 py-2">
                {example.input_text}
            </p>
        </div>
    )
}
