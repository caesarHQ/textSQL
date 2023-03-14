import React, { useState, useRef, useEffect, useReducer } from 'react'
import Map, { Layer, Source } from 'react-map-gl'
import mapboxgl from 'mapbox-gl'
import bbox from '@turf/bbox'
import posthog from 'posthog-js'
import * as turf from '@turf/turf'
import { FaTimes } from 'react-icons/fa'
import Plot from 'react-plotly.js'

// Components
import Table from './components/table'
import LoadingSpinner from './components/loadingSpinner'
import Examples from './components/examples'
import ErrorMessage from './components/error'
import * as Sentry from '@sentry/react'
import toast, { Toaster } from 'react-hot-toast'
import Disclaimer from './components/disclaimer'
import { VizSelector } from './components/vizSelector'

// Utils
import {
    cleanupQuery,
    getCities,
    getZipcodes,
    getZipcodesMapboxFormatted,
} from './utils'

// Mapbox UI configuration
import {
    zipcodeFeatures,
    citiesFeatures,
    zipcodeLayerHigh,
    zipcodeLayerLow,
    citiesLayer,
} from './mapbox-ui-config'

// Plotly UI configuration
import {
    getPlotConfig
} from './plotly-ui-config'

import './css/App.css'
import {
    ContributeButton,
    DarkModeButton,
    DiscordButton,
    GithubButton,
} from './Discord'
import { notify } from './Toast'
import { useDebouncedCallback } from 'use-debounce'
import { useSearchParams } from 'react-router-dom'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { hybrid } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { AiOutlineSearch } from 'react-icons/ai'

// Add system dark mode
localStorage.theme === 'dark' ||
(!('theme' in localStorage) &&
    window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? document.documentElement.classList.add('dark')
    : document.documentElement.classList.remove('dark')

// Init posthog
posthog.init('phc_iLMBZqxwjAjaKtgz29r4EWv18El2qg3BIJoOOpw7s2e', {
    api_host: 'https://app.posthog.com',
})

// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// prettier-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

let api_endpoint = 'https://text-sql-be.onrender.com'

if (process.env.REACT_APP_HOST_ENV === 'dev') {
    api_endpoint = 'http://localhost:9000'
}

const SearchInput = (props) => {
    const { value, onSearchChange, onClear } = props
    return (
        <div className="flex rounded-md shadow-sm w-full md:max-w-lg bg-white dark:bg-dark-800 text-gray-900  dark:text-white">
            <div className="relative flex flex-grow items-stretch focus-within:z-10  ">
                {/*<input*/}
                {/*  type="email"*/}
                {/*  name="email"*/}
                {/*  id="email"*/}
                {/*  className="block w-full rounded-none rounded-l-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"*/}
                {/*  placeholder="John Smith"*/}
                {/*/>*/}

                <input
                    type="text"
                    name="search"
                    id="search"
                    placeholder="Ask anything about US Demographics..."
                    className="block w-full rounded-none rounded-l-md border-0 py-1.5 ring-1 ring-inset ring-gray-300 dark:ring-neutral-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-600 sm:text-sm sm:leading-6 bg-transparent dark:placeholder-neutral-400"
                    value={value}
                    onChange={onSearchChange}
                />
            </div>
            <button
                type="button"
                className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 dark:ring-neutral-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-600 focus:outline-none hover:bg-gray-50 hover:dark:bg-dark-900 focus:outline-dark-300 outline-1 outline-dark-300"
                onClick={onClear}
            >
                <FaTimes />
            </button>
        </div>
    )
}

const SearchButton = (props) => {
    return (
        <button
            type="submit"
            className="text-white bg-blue-600 focus:ring-4 focus:ring-blue-300 focus:outline-none inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm hover:bg-blue-700 ml-3"
        >
            <span className="hidden md:block">Search</span>
            <AiOutlineSearch className="md:hidden" />
        </button>
    )
}
const DataPlot = (props) => {
    let config = getPlotConfig(props.rows, props.cols)

    return (
      <Plot
        data={config.data}
        layout={config.layout}
        style={{ width: '100%', height: '100%' }}
        config = {{responsive: true, displayModeBar: false}}
      />
    );
};

function App(props) {
    const [searchParams, setSearchParams] = useSearchParams()
    const [query, setQuery] = useState('')
    const [sql, setSQL] = useState('')
    const [zipcodesFormatted, setZipcodesFormatted] = useState([])
    const [zipcodes, setZipcodes] = useState([])
    const [tableInfo, setTableInfo] = useState({ rows: [], columns: [] })
    const [statusCode, setStatusCode] = useState(0)
    const [errorMessage, setErrorMessage] = useState('')
    const [cities, setCities] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [visualization, setVisualization] = useState('map')

    useEffect(() => {
        document.title = query || 'Census GPT'
    }, [query])

    useEffect(() => {
        if (errorMessage !== '') {
            console.log(errorMessage)
            notify(errorMessage)
        }
    }, [errorMessage])

    const queryParameters = new URLSearchParams(window.location.search)
    const urlSearch = queryParameters.get('s')

    const clearMapLayers = () => {
        setCities([])
        setZipcodes([])
        setZipcodesFormatted([])
    }

    const mapRef = useRef()

    const handleSearchChange = (event) => {
        const { value } = event.target
        setQuery(value)
        setTitle('')
    }

    const handleClearSearch = () => {
        setQuery('')
    }

    const fetchBackend = (natural_language_query) => {
        // Don't send a request if the query is empty!
        natural_language_query = natural_language_query.trim()
        if (!natural_language_query.length) return

        // Set the loading state
        setIsLoading(true)

        // clear previous layers
        clearMapLayers()

        // Sanitize the query
        natural_language_query = cleanupQuery(natural_language_query)

        // Set the options for the fetch request
        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                natural_language_query,
                table_names: ['crime_by_city', 'acs_census_data'],
            }),
        }

        let responseOuter = null
        // Send the request
        fetch(api_endpoint + '/api/text_to_sql', options)
            .then((response) => response.json())
            .then((response) => {
                // Set the loading state to false
                setIsLoading(false)

                // Handle errors
                if (!response || !response.sql_query || !response.result) {
                    posthog.capture('backend_error', response)
                    setErrorMessage(
                        'Something went wrong. Please try again or try a different query'
                    )
                    return
                }

                // Capture the response in posthog
                posthog.capture('backend_response', response)

                // Set the state for SQL and Status Code
                setStatusCode(response.status)
                responseOuter = response
                setSQL(response.sql_query)

                console.log('Backend Response ==>', response)

                // Filter out lat and long columns
                let filteredColumns = response.result.column_names.filter(
                    (c) => c !== 'lat' && c !== 'long'
                )

                // Fit the order of columns and filter out lat and long row values
                let rows = response.result.results.map((value) => {
                    let row = []
                    // Find each of the filtered column value in the object and push it into the row
                    filteredColumns.map((c) => row.push(value[c]))
                    return row
                })
                setTableInfo({ rows, columns: filteredColumns })

               
                // render cities layer on the map
                if (
                    filteredColumns.indexOf('zip_code') === -1 &&
                    filteredColumns.indexOf('city') >= 0
                ) {
                    // Get the cities
                    let responseCities = getCities(response.result)
                    console.log(responseCities)
                    if (!responseCities.length) {
                        setErrorMessage('No results were returned')
                        setCities([])
                        setZipcodes([]) // reset cities rendering
                    } else if (responseCities.length < 2) {
                        // Focus the map to relevant parts
                        // Fitbounds needs at least two geo coordinates.
                        // If less that 2 co-ordinates then use fly to.
                        mapRef && mapRef.current.flyTo({
                            center: [
                                responseCities[0].long,
                                responseCities[0].lat,
                            ],
                            essential: true, // this animation is considered essential with respect to prefers-reduced-motion
                        })
                    } else {
                        let [minLng, minLat, maxLng, maxLat] = bbox(
                            turf.lineString(
                                responseCities.map((c) => [c.long, c.lat])
                            )
                        )
                        mapRef && mapRef.current.fitBounds(
                            [
                                [minLng, minLat],
                                [maxLng, maxLat],
                            ],
                            { padding: '100', duration: 1000 }
                        )
                    }

                    // Set the cities into the state
                    setCities(responseCities)

                    // reset zipcode rendering
                    setZipcodes([])

                    setVisualization('map')
                } else if (filteredColumns.indexOf('zip_code') >= 0) {
                    // Render zipcodes layer on the map
                    let responseZipcodes = getZipcodes(response.result)
                    setZipcodesFormatted(
                        getZipcodesMapboxFormatted(responseZipcodes)
                    )

                    // Fitbounds needs at least two geo coordinates.
                    if (!responseZipcodes.length) {
                        setErrorMessage('No results were returned')
                        setZipcodes([])
                        setCities([]) // reset cities rendering
                    } else if (responseZipcodes.length < 2) {
                        // Fitbounds needs at least two geo coordinates.
                        // If less that 2 co-ordinates then use fly to.
                        mapRef && mapRef.current.flyTo({
                            center: [
                                responseZipcodes[0].long,
                                responseZipcodes[0].lat,
                            ],
                            essential: true, // this animation is considered essential with respect to prefers-reduced-motion
                        })
                    } else {
                        let [minLng, minLat, maxLng, maxLat] = bbox(
                            turf.lineString(
                                responseZipcodes.map((z) => [z.long, z.lat])
                            )
                        )
                        mapRef && mapRef.current.fitBounds(
                            [
                                [minLng, minLat],
                                [maxLng, maxLat],
                            ],
                            { padding: '100', duration: 1000 }
                        )
                    }
                    setVisualization('map')
                    setZipcodes(responseZipcodes)
                    setCities([]) // reset cities rendering
                } else {
                    // No zipcodes or cities to render. Default to chart
                    setVisualization('chart')
                }
            })
            .catch((err) => {
                Sentry.setContext('queryContext', {
                    query: query,
                    ...responseOuter,
                })
                Sentry.captureException(err)
                setIsLoading(false)
                posthog.capture('backend_error', {
                    error: err,
                })
                setStatusCode(500)
                setErrorMessage(err.message || err)
                console.error(err)
            })
    }

    const debouncedFetchBackend = useDebouncedCallback((query) => {
        fetchBackend(query)
    }, 100)

    useEffect(() => {
        const queryFromURL = searchParams.get('s')
        if (queryFromURL != query) {
            posthog.capture('search_clicked', {
                natural_language_query: urlSearch,
            })
            setQuery(urlSearch)
            debouncedFetchBackend(urlSearch)
        }
    }, [searchParams])

    const handleSearchClick = (event) => {
        setSearchParams(`?${new URLSearchParams({ s: query })}`)
        setTitle(query)
        posthog.capture('search_clicked', { natural_language_query: query })
        fetchBackend(query)
    }

    return (
        <div className="App bg-white dark:bg-dark-900 dark:text-white">
            <link
                href="https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css"
                rel="stylesheet"
            />
            <div className="overflow-hidden rounded-lg shadow md:h-screen">
                <div className="px-4 py-5 sm:px-6">
                    <h1
                        className="text-4xl font-bold mb-2"
                        onClick={() => {
                            window.location.assign('/')
                            handleClearSearch()
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        Census GPT
                    </h1>
                    <div className="inline-flex gap-x-1.5 align-middle justify-center mb-3">
                        <ContributeButton />
                        <GithubButton />
                        <DiscordButton />
                        <DarkModeButton />
                    </div>
                    <Toaster />
                    <div>
                        <form
                            autoComplete={'off'}
                            className="mt-1 flex justify-center"
                            onSubmit={(event) => {
                                event.preventDefault()
                                handleSearchClick(event)
                            }}
                        >
                            <SearchInput
                                value={query}
                                onSearchChange={handleSearchChange}
                                onClear={handleClearSearch}
                            />
                            <SearchButton />
                        </form>
                        <Disclaimer />
                    </div>
                </div>
                <div className="px-4 h-full sm:p-6 flex flex-col md:flex-row md:pb-[200px]">
                    <div className="rounded-lg overflow-y-auto max-h-[60vh] h-full md:h-full md:max-h-full shadow flex-grow-[0] w-full mr-8 mb-8">
                        {/*spinner*/}
                        <LoadingSpinner isLoading={isLoading} />
                        {sql.length === 0 && !isLoading ? (
                            <Examples
                                postHogInstance={posthog}
                                setQuery={setQuery}
                                handleClick={fetchBackend}
                            />
                        ) : isLoading ? (
                            <> </>
                        ) : (
                            <>
                                <p class="my-2 font-medium"> {title} </p>
                                <pre
                                    align="left"
                                    className="rounded-md bg-gray-100 dark:bg-dark-800 dark:text-white"
                                >
                                    <code className="text-sm text-gray-800 dark:text-white">
                                        <SyntaxHighlighter
                                            language="sql"
                                            style={hybrid}
                                            customStyle={{
                                                color: undefined,
                                                background: undefined,
                                                margin: undefined,
                                                padding: '1rem',
                                            }}
                                        >
                                            {sql}
                                        </SyntaxHighlighter>
                                    </code>
                                </pre>
                                {/*{statusCode === 500 ? (*/}
                                {/*    <ErrorMessage errorMessage={errorMessage} />*/}
                                {/*) : (*/}
                                {/*    <></>*/}
                                {/*)}*/}
                                <Table
                                    columns={tableInfo.columns}
                                    values={tableInfo.rows}
                                />
                            </>
                        )}
                    </div>
                    <div className="overflow-hidden rounded-lg shadow flex-grow-[2] h-[70vh] md:h-full w-full relative">
                        { visualization == 'map' ? <Map
                            ref={mapRef}
                            mapboxAccessToken="pk.eyJ1IjoicmFodWwtY2Flc2FyaHEiLCJhIjoiY2xlb2w0OG85MDNoNzNzcG5kc2VqaGR3dCJ9.mhsdkiyqyI5jLgy8TKYavg"
                            style={{ width: '100%', height: '100%'}}
                            mapStyle="mapbox://styles/mapbox/dark-v11"
                            initialViewState={{
                                longitude: -100,
                                latitude: 40,
                                zoom: 3.5,
                            }}
                        >
                            <Source
                                id="zips-kml"
                                type="vector"
                                url="mapbox://darsh99137.4nf1q4ec"
                            >
                                <Layer
                                    {...zipcodeLayerLow(zipcodesFormatted)}
                                />
                            </Source>
                            <Source
                                id="zip-zoomed-out"
                                type="geojson"
                                data={{
                                    type: 'FeatureCollection',
                                    features: zipcodeFeatures(zipcodes),
                                }}
                            >
                                <Layer {...zipcodeLayerHigh} />
                            </Source>
                            <Source
                                id="cities"
                                type="geojson"
                                data={{
                                    type: 'FeatureCollection',
                                    features: citiesFeatures(cities),
                                }}
                            >
                                <Layer {...citiesLayer} />
                            </Source>
                        </Map> : <> <DataPlot cols={tableInfo.columns} rows={tableInfo.rows}/> </>}
                        <VizSelector selected={visualization} setSelected = {setVisualization} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App

// /* DO NOT REMOVE

// Use this to find out what feature info is pulled for each zipcode from the vector tiles

//     map.current.on('mousemove', function (e) {
//       var features = map.current.queryRenderedFeatures(e.point, {
//           layers:  ['Zip', 'zips-kml']
//       });
//       if (features.length > 0) {
//         console.log("\n\nFEATURES => ", features)
//           if (features[0].layer.id == 'Zip') {
//             console.log("ZIP5", features[0].properties.ZIP5)
//           } else if (features[0].layer.id == 'zips-kml') {
//             console.log("ZIPS-KMLLLL", features[0].properties.Name)
//             console.log("ZIPS-KML", features[0].properties.Name.replace(/^\D+/g, '').split("<closeparen>")[0])
//             console.log("TYYPE>>>", typeof features[0].properties.Name.replace(/^\D+/g, ''));

//           } else {
//             console.log("ZCTAE10", features[0].properties.ZCTA5CE10)
//           }

//       } else {
//           // document.getElementById('pd').innerHTML = '<p>Hover over a state!</p>';
//       }
//   });

//   */

//   });
