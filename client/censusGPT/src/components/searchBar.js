import { AiOutlineSearch } from 'react-icons/ai'
import { FaTimes } from 'react-icons/fa'
import Suggestion from './suggestion'


const SearchButton = (props) => {
    return (
        <button
            type="submit"
            className="text-white bg-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow-sm hover:bg-blue-700 ml-3"
        >
            <span className="hidden md:block">Search</span>
            <AiOutlineSearch className="md:hidden" />
        </button>
    )
}

const SearchBar = (props) => {
    const {
        value,
        onSearchChange,
        onClear,
        suggestedQuery,
        setTitle,
        setQuery,
        fetchBackend,
        currentSuggestionId,
    } = props

    return (
        <div className="flex flex-col w-full max-w-full md:max-w-3xl">
            <div className="flex rounded-md">
                <div className="relative flex flex-grow items-stretch focus-within:z-10 shadow-sm bg-white dark:bg-dark-800 text-gray-900 dark:text-white">
                    <input
                        type="text"
                        name="search"
                        id="search"
                        placeholder={`Ask anything about ${
                            props.version === "Census" ?
                                "US crime, demographics, housing, income..."
                                :
                                "San Francisco crime, drug use, homelessness, demographics, income, bars, restaurants, parks..."
                        }`}
                        className="block w-full rounded-none rounded-l-md border-0 py-1.5 ring-1 ring-inset ring-gray-300 dark:ring-neutral-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-600 text-sm leading-6 bg-transparent dark:placeholder-neutral-400"
                        value={value}
                        onChange={onSearchChange}
                    />
                    <button
                        type="button"
                        className="focus:text-blue-600 hover:text-blue-600 dark:text-white/50 dark:hover:text-blue-600 relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md p-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 dark:ring-neutral-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-600 focus:outline-none hover:bg-gray-50 hover:dark:bg-dark-900"
                        onClick={onClear}
                    >
                        <FaTimes />
                    </button>
                </div>
                <SearchButton />
            </div>
            <div className="text-left">
            {
                suggestedQuery ?
                <Suggestion
                    suggestedQuery={suggestedQuery}
                    setTitle={setTitle}
                    fetchBackend={fetchBackend}
                    currentSuggestionId={currentSuggestionId}
                    setQuery={setQuery}
                    />
                :
                null
            }
            </div>
        </div>
    )
}

export default SearchBar
