import React, { useState, useRef, useEffect, useReducer } from 'react'
import Map, { Layer, Source } from 'react-map-gl'
import mapboxgl from 'mapbox-gl'
import bbox from '@turf/bbox'
import posthog from 'posthog-js'
import * as turf from '@turf/turf'
import { FaTimes } from 'react-icons/fa'
import { ImSpinner } from 'react-icons/im'
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
import { BsClipboard2, BsClipboard2Check, BsQuestionCircle } from 'react-icons/bs'

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
        <div className="flex rounded-md shadow-inner sm:shadow-sm w-full md:max-w-lg bg-white dark:bg-dark-800 text-gray-900  dark:text-white">
            <div className="relative flex flex-grow items-stretch focus-within:z-10">
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
                    className="block w-full rounded-none rounded-l-md border-0 py-1.5 sm:ring-1 ring-inset ring-gray-300 dark:ring-neutral-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-600 sm:text-sm sm:leading-6 bg-transparent dark:placeholder-neutral-400"
                    value={value}
                    onChange={onSearchChange}
                />
            </div>
            <button
                type="button"
                className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md p-2 text-xs sm:text-sm font-semibold sm:ring-1 ring-inset ring-gray-300 dark:ring-neutral-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-600 focus:outline-none hover:bg-gray-50 hover:dark:bg-dark-900"
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
            className="text-white bg-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow-sm hover:bg-blue-700 ml-3"
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
            layout={{ ...config.layout, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent' }}
            style={{ width: '100%', height: '100%' }}
            config={{ responsive: true, displayModeBar: false }}
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

    const [mobileHelpIsOpen, setMobileHelpIsOpen] = useState(true)
    const [mobileTableIsOpen, setMobileTableIsOpen] = useState(false)
    const [mobileSqlIsOpen, setMobileSqlIsOpen] = useState(false)
    const [mobileResultIsOpen, setMobileResultIsOpen] = useState(false)
    const mobileHelpRef = useRef()
    const mobileTableRef = useRef()
    const mobileSqlRef = useRef()
    const mobileResultRef = useRef()
    const mapRef = useRef()

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
                table_names: ['crime_by_city', 'demographic_data'],
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
                        mapRef && mapRef.current && mapRef.current.flyTo({
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
                        mapRef && mapRef.current && mapRef.current.fitBounds(
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
                        mapRef && mapRef.current && mapRef.current.flyTo({
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
                        mapRef && mapRef.current && mapRef.current.fitBounds(
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
                setMobileHelpIsOpen(false)
                setMobileResultIsOpen(true)
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

    const [copied, setCopied] = useState(false)
    const CopySqlToClipboard = (sql) => {
        const handleCopy = async () => {
            if ('clipboard' in navigator) {
                setCopied(true)
                setTimeout(() => setCopied(false), 1000)
                return await navigator.clipboard.writeText(sql.text)
            } else {
                setCopied(true)
                setTimeout(() => setCopied(false), 1000)
                return document.execCommand('copy', true, sql.text)
            }
        }

        return (
            <button onClick={handleCopy} className='absolute text-md rounded-md px-2.5 py-2 font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 bg-white dark:bg-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700'>
                {copied ? <BsClipboard2Check /> : <BsClipboard2 />}
            </button>
        )
    }

    return (
        <div className="App bg-white dark:bg-dark-900 dark:text-white flex flex-col h-screen">
            <link
                href="https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css"
                rel="stylesheet"
            />

            <div className="absolute w-full sm:relative sm:flex flex-col p-2 sm:p-6 space-y-1.5 bg-gradient-to-b from-black/95 to-transparent bg/10 backdrop-blur-sm pb-2.5 sm:from-white sm:dark:from-transparent z-50">
                <h1
                    className="text-4xl font-bold text-white sm:text-black dark:text-white"
                    onClick={() => {
                        window.location.assign('/')
                        handleClearSearch()
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    Census GPT
                </h1>
                <div className="inline-flex gap-x-1.5 align-middle justify-center">
                    <ContributeButton />
                    <GithubButton />
                    <DiscordButton />
                    <DarkModeButton />
                </div>
                <Toaster />
                <div className='hidden sm:block sm:px-6 sm:pb-2'>
                    <form
                        autoComplete={'off'}
                        className="flex justify-center"
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
                </div>
                <Disclaimer />
            </div>


            <div className="flex flex-col lg:flex-row h-full w-full gap-6 sm:p-6">
                <div className="hidden sm:flex sm:flex-col h-full w-full max-h-[23rem] lg:max-h-full overflow-y-auto">
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
                        <div className='flex flex-col space-y-4'>
                            <div>
                                <p class="font-medium"> {title} </p>
                                <pre
                                    align="left"
                                    className="rounded-md bg-gray-100 dark:bg-dark-800 dark:text-white"
                                >
                                    <code className="text-sm text-gray-800 dark:text-white">
                                        <div className='flex justify-end p-1'>
                                            <CopySqlToClipboard text={sql} />
                                        </div>
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
                            </div>

                            <Table
                                columns={tableInfo.columns}
                                values={tableInfo.rows}
                            />
                        </div>
                    )}
                </div>

                <div className='flex flex-grow h-full w-full relative sm:rounded-lg shadow overflow-hidden'>
                    <div className='absolute top-24 sm:top-0 right-0 z-10 p-1'>
                        <VizSelector
                            selected={visualization} setSelected={setVisualization}
                            tableRef={mobileTableRef} setTableIsOpen={setMobileTableIsOpen}
                            sqlRef={mobileSqlRef} setSqlIsOpen={setMobileSqlIsOpen}
                            viewsCanOpen={sql.length}
                        />
                    </div>
                    <div className="overflow-hidden sm:rounded-lg shadow flex h-full w-full relative">
                        {visualization == 'map' ?
                            <Map
                                ref={mapRef}
                                mapboxAccessToken="pk.eyJ1IjoicmFodWwtY2Flc2FyaHEiLCJhIjoiY2xlb2w0OG85MDNoNzNzcG5kc2VqaGR3dCJ9.mhsdkiyqyI5jLgy8TKYavg"
                                style={{ width: '100%', height: '100%' }}
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
                            </Map> :
                            // following <div> helps plot better scale bar widths for responsiveness
                            <div className='overflow-x-auto flex w-full overflow-hidden mb-32 sm:mb-0'>
                                <DataPlot cols={tableInfo.columns} rows={tableInfo.rows} />
                            </div>
                        }
                    </div>
                </div>

            </div>

            {/* Mobile */}
            <div className='absolute bottom-32 flex w-full justify-center sm:hidden z-50'>
                {isLoading && <span className='animate-spin text-2xl text-white'><ImSpinner /></span>}
            </div>
            {mobileResultIsOpen && !isLoading && sql.length != 0 &&
                <div className='absolute w-screen h-screen items-center justify-center flex sm:hidden z-50' onClick={(e) => mobileResultRef.current && !mobileResultRef.current.contains(e.target) && setMobileResultIsOpen(false)}>
                    <div className='absolute w-full bottom-32 items-center justify-center flex'>
                        <div className='flex flex-col w-4/5 max-h-96 h-full' ref={mobileResultRef}>
                            <button
                                className='relative h-0 top-1 px-2 z-10 justify-end flex text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white text-xs'
                                onClick={() => setMobileResultIsOpen(false)}
                            >
                                Close
                            </button>
                            <div className='space-y-2 flex-col justify-between h-full bg-white/80 dark:bg-dark-900/80 ring-1 ring-dark-300 backdrop-blur-sm shadow rounded-lg pt-6 pb-2 px-2 flex w-full items-center overflow-auto'>
                                <div className='bg-white/80 dark:bg-dark-900/80 ring-1 ring-dark-300 backdrop-blur-sm shadow rounded-lg flex flex-col w-full max-h-48 overflow-auto'>
                                    <div className='flex justify-end p-1 absolute right-0'>
                                        <CopySqlToClipboard text={sql} />
                                    </div>
                                    <pre
                                        align="left"
                                        className="rounded-md dark:text-white"
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
                                </div>
                                <div className='bg-white/80 dark:bg-dark-900/80 ring-1 ring-dark-300 backdrop-blur-sm shadow rounded-lg flex w-full overflow-auto items-start justify-center'>
                                    <Table
                                        columns={tableInfo.columns}
                                        values={tableInfo.rows}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            }
            <div className='absolute bottom-16 z-50 flex w-full justify-center sm:hidden'>
                <div className='rounded-xl bg-black/5 dark:bg-black/20 w-full mx-4 p-2.5 backdrop-blur-lg ring-1 dark:ring-white/40 ring-blue-500'>
                    <form
                        autoComplete={'off'}
                        className="flex justify-center"
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
                    </form>
                </div>
            </div>
            <button className='absolute top-[5.5rem] bg-black/20 backdrop-blur-sm rounded-lg text-white hover:text-blue-600 p-2 m-2 text-xl sm:hidden z-40'
                onClick={() => setMobileHelpIsOpen(!mobileHelpIsOpen)}
            >
                <BsQuestionCircle />
            </button>
            {mobileHelpIsOpen && (
                <div className='absolute h-screen w-screen z-30 items-center justify-center flex sm:hidden' onClick={(e) => mobileHelpRef.current && !mobileHelpRef.current.contains(e.target) && setMobileHelpIsOpen(false)}>
                    <div className='space-y-4 flex-col bg-white/80 dark:bg-dark-900/80 ring-1 ring-dark-300 backdrop-blur-sm shadow rounded-lg p-4 flex w-4/5 h-2/5 overflow-auto' ref={mobileHelpRef}>
                        <div className='font-bold text-lg'>
                            Welcome to Census GPT
                        </div>
                        <Examples
                            postHogInstance={posthog}
                            setQuery={setQuery}
                            handleClick={fetchBackend}
                        />
                    </div>
                </div>
            )}
            {mobileTableIsOpen && sql.length && (
                <div className='absolute h-screen w-screen z-30 items-center justify-center flex sm:hidden' onClick={(e) => mobileTableRef.current && !mobileTableRef.current.contains(e.target) && setMobileTableIsOpen(false)}>
                    <div className='bg-white/80 dark:bg-dark-900/80 ring-1 ring-dark-300 backdrop-blur-sm shadow rounded-lg p-4 flex w-4/5 max-h-80 overflow-auto items-start justify-center' ref={mobileTableRef}>
                        <Table
                            columns={tableInfo.columns}
                            values={tableInfo.rows}
                        />
                    </div>
                </div>
            )}
            {mobileSqlIsOpen && sql.length && (
                <div className='absolute h-screen w-screen z-30 items-center justify-center flex sm:hidden' onClick={(e) => mobileSqlRef.current && !mobileSqlRef.current.contains(e.target) && setMobileSqlIsOpen(false)}>
                    <div className='bg-white/80 dark:bg-dark-900/80 ring-1 ring-dark-300 backdrop-blur-sm shadow rounded-lg flex flex-col w-4/5 max-h-80 overflow-auto' ref={mobileSqlRef}>
                        <div className='flex justify-end p-1 relative'>
                            <CopySqlToClipboard text={sql} />
                        </div>
                        <pre
                            align="left"
                            className="rounded-md dark:text-white"
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
                    </div>
                </div>
            )}
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
