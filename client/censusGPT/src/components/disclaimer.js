const Disclaimer = (props) => {
    const SF_disclaimer = (
        <>
            Note: SanFranciscoGPT currently only has data for crime, 311 cases, demographics, income, population, food, parks, and housing in SF. But we are working to add more data! 
            <br />
            <a href="https://data.sfgov.org/City-Infrastructure/311-Cases/vw6y-z8j6" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>311 data</a> and <a href="https://data.sfgov.org/Public-Safety/Police-Department-Incident-Reports-2018-to-Present/wg3w-h783" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>crime data</a> are sourced from the <a href="https://datasf.org/opendata/" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>city's website for public datasets</a> and include data from 1/1/21 to 4/7/23.
            <br />
            This app uses <a href="https://data.sfgov.org/Geographic-Locations-and-Boundaries/Analysis-Neighborhoods/p5b7-5n3h" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>SF Analysis Neighborhoods</a> which have boundaries formed specifically to fit census tracts.
        </>
    );

    const Census_disclaimer = (
        <>
            Note: CensusGPT currently only has data for crime, demographics, income, education levels, and population in the USA. But we are working to add more data!
            <br />
            Census data is sourced from the 2021 ACS (latest). Crime data is sourced from the FBI's 2019 UCR (latest).
        </>
    );

    return (
        <div className="hidden items-center mt-2 justify-center md:block">
            <div style={{"whiteSpace":"pre"}} className="text-xs tracking-tight text-gray-600 dark:text-white">
                {props.version === 'San Francisco' ? SF_disclaimer : Census_disclaimer}
            </div>
        </div>
    )
}


export default Disclaimer
