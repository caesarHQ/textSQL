const Suggestion = (props) => {

    const urlEncodedQuery = encodeURIComponent(props.suggestedQuery);

    const suggestedQuery = (
        <div style={{ wordWrap: 'break-word' }}>
            Try: <a href={`/sf?s=${urlEncodedQuery}`} style={{ color: 'blue', textDecoration: 'underline' }}>{props.suggestedQuery}</a>
        </div>
    );

    return (
        <div className="hidden items-center mt-2 justify-center md:block">
            <div style={{"whiteSpace":"pre"}} className="text-sm tracking-tight text-gray-600 dark:text-white">
                {suggestedQuery}
            </div>
        </div>
    )
}



export default Suggestion
