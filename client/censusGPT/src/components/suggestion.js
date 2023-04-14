import { useSearchParams } from 'react-router-dom'

let api_endpoint = process.env.REACT_APP_API_URL || 'https://dev-text-sql-be.onrender.com'

if (process.env.REACT_APP_HOST_ENV === 'dev') {
    api_endpoint = 'http://localhost:9000'
}

const acceptSuggestion = async (id) => {
    const url = `${api_endpoint}/api/accept_suggestion`
    const body = {
        id,
    }
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })
    const data = await response.json()
    console.log(data)
    return "success"
}



const Suggestion = (props) => {
    const {
        suggestedQuery,
        setTitle,
        setQuery,
        fetchBackend,
        currentSuggestionId,
    } = props

    const [searchParams, setSearchParams] = useSearchParams();

    const handleClick = () => {
        acceptSuggestion(currentSuggestionId)
        setSearchParams(new URLSearchParams({ s: props.suggestedQuery }))
        setTitle(suggestedQuery)
        setQuery(suggestedQuery)
        fetchBackend(suggestedQuery, currentSuggestionId)
    };

    const clickableQuery = (
        <div style={{ wordWrap: 'break-word' }}>
            Try this: <span onClick={handleClick} style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>{props.suggestedQuery}</span>
        </div>
    );

    return (
        <div className="hidden items-center mt-2 justify-center md:block">
            <div style={{"whiteSpace":"pre"}} className="text-sm tracking-tight text-gray-600 dark:text-white">
                {clickableQuery}
            </div>
        </div>
    )
}



export default Suggestion
