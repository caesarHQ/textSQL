const Suggestion  = (props) => {

    const urlEncodedQuery = encodeURIComponent(props.suggestionForFailedQuery);

    const suggestionForFailedQuery = (
        <>
            Suggested query: <a href={`/sf?s=${urlEncodedQuery}`} style={{ color: 'blue', textDecoration: 'underline' }}>{props.suggestionForFailedQuery}</a>
        </>
    );

    return (
        <div className="hidden items-center mt-2 justify-center md:block">
            <div style={{"white-space":"pre"}} className="text-sm tracking-tight text-gray-600 dark:text-white">
                {suggestionForFailedQuery}
            </div>
        </div>
    )
}


export default Suggestion
