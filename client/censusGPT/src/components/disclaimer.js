const Disclaimer = (props) => {
    const SF_disclaimer = `Disclaimer: SanFranciscoGPT currently only supports data about crime,
    311 cases, age, race, gender, income and population in San Francisco.
    But we are working to add more data!`;

    const Census_disclaimer = `Disclaimer: CensusGPT currently only supports data about crime,
    age, race, gender, income, education levels and population in the USA.
    But we are working to add more data!`; 
    return (
        <div className="hidden items-center mt-2 justify-center md:block">
            <p className="text-xs tracking-tight text-gray-600 dark:text-white">
                {props.version === 'San Francisco' ? SF_disclaimer : Census_disclaimer}
            </p>
        </div>
    )
}

export default Disclaimer
