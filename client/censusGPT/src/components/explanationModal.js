import { useEffect, useState } from 'react'
import { XCircleIcon } from '@heroicons/react/20/solid'

export const ExplanationModal = ({showExplanationModal, setShowExplanationModal, version}) =>{

    const messageToShow = showExplanationModal == 'no_tables' ? "Sorry, we don't think we're able to help with that query yet ='(" : "Sorry, we tried to answer your question but weren't able to get a working query."

    return (

    <div className={`rounded-md bg-red-50 p-4`}>
        <div className="flex">
            <div className="flex-shrink-0">
                <XCircleIcon
                    className="h-5 w-5 text-red-400 cursor-pointer"
                    aria-hidden="true"
                    onClick={
                        () => {
                            setShowExplanationModal(false)
                        }
                    }
                />
            </div>
            <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                    <div>{messageToShow}</div>
                    <Disclaimer version={version} />

                </h3>
            </div>
        </div>
    </div>
    )    

}
const Disclaimer = (props) => {
    const SF_disclaimer = (
        <>
            Note: SanFranciscoGPT currently only has data for crime, 311 cases, demographics, income, population, food, parks, housing in SF. But we are working to add more data! 
            <br />
            <a href="https://data.sfgov.org/City-Infrastructure/311-Cases/vw6y-z8j6" style={{ color: 'blue', textDecoration: 'underline' }}>311 data</a> and <a href="https://data.sfgov.org/Public-Safety/Police-Department-Incident-Reports-2018-to-Present/wg3w-h783" style={{ color: 'blue', textDecoration: 'underline' }}>crime data</a> are sourced from the <a href="https://datasf.org/opendata/" style={{ color: 'blue', textDecoration: 'underline' }}>city's website for public datasets</a> and include data from 1/1/21 to 4/7/23.
            <br />
            This app uses <a href="https://data.sfgov.org/Geographic-Locations-and-Boundaries/Analysis-Neighborhoods/p5b7-5n3h" style={{ color: 'blue', textDecoration: 'underline' }}>SF Analysis Neighborhoods</a> which have boundaries formed specifically to fit census tracts.
        </>
    );

    const Census_disclaimer = (
        <>
            Note: CensusGPT currently only has data for crime, demographics, income, education levels and population in the USA. But we are working to add more data!
            <br />
            Census data is sourced from the 2021 ACS (latest). Crime data is sourced from the FBI's 2019 UCR (latest).
        </>
    );

    return (
        <div className="text-sm text-gray-600 dark:text-white font-medium mx-auto">
            {props.version === 'San Francisco' ? SF_disclaimer : Census_disclaimer}
        </div>
    )
}

export default Disclaimer
