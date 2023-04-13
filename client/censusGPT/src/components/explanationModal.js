import { useEffect, useState } from 'react'
import { XCircleIcon } from '@heroicons/react/20/solid'

export const ExplanationModal = ({setShowExplanationModal, version}) =>{

    return (

    <div className={`rounded-md bg-red-50 p-4`}>
        <div className="flex">
        <div className="flex-grow ml-3 w-full">
      <h3 className="text-sm font-medium text-red-800">
        <div>Sorry, we don't think we're able to help with that query ='(</div>
      </h3>
      <div className="w-full">
        <Disclaimer version={version} />
      </div>
    </div>
        </div>
    </div>
    )    

}
const Disclaimer = (props) => {
    const SF_disclaimer = (
        <>
            Note: SanFranciscoGPT currently only supports data about crime, 311 cases, age, race, gender, income and population in San Francisco. But we are working to add more data! 
            <br />
            <a href="https://data.sfgov.org/City-Infrastructure/311-Cases/vw6y-z8j6" style={{ color: 'blue', textDecoration: 'underline' }}>311 data</a> and <a href="https://data.sfgov.org/Public-Safety/Police-Department-Incident-Reports-2018-to-Present/wg3w-h783" style={{ color: 'blue', textDecoration: 'underline' }}>crime data</a> are sourced from the city's website for public datasets and include data from 1/1/21 to 4/7/23.
        </>
    );

    const Census_disclaimer = (
        <>
            Note: CensusGPT currently only supports data about crime, age, race, gender, income, education levels and population in the USA. But we are working to add more data!
            <br />
            Census data is sourced from the 2021 ACS (latest). Crime data is sourced from the FBI's 2019 UCR (latest).
        </>
    );

    return (
        <div className="text-sm text-gray-600 dark:text-white font-medium mx-auto mt-3">
            {props.version === 'San Francisco' ? SF_disclaimer : Census_disclaimer}
        </div>

    )
}

export default Disclaimer
