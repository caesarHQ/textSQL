import { useSearchParams } from 'react-router-dom'


const Suggestion = (props) => {

    const {
        suggestedQuery,
        setTitle,
        fetchBackend,
    } = props

    const [searchParams, setSearchParams] = useSearchParams();

    const handleClick = () => {
        setSearchParams(new URLSearchParams({ s: props.suggestedQuery }));
        setTitle(suggestedQuery);
        fetchBackend(suggestedQuery);
    };

    const clickableQuery = (
        <div style={{ wordWrap: 'break-word' }}>
            Try: <span onClick={handleClick} style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>{props.suggestedQuery}</span>
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
