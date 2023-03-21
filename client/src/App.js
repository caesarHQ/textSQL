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
    polygonsLayer
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
import { BsClipboard2, BsClipboard2Check, BsPencilSquare, BsQuestionCircle } from 'react-icons/bs'

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

const SearchInput = (props) => {
    const { value, onSearchChange, onClear } = props
    return (
        <div className="flex rounded-full sm:rounded-md shadow-inner sm:shadow-sm w-full md:max-w-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-white">
            <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <input
                    type="text"
                    name="search"
                    id="search"
                    placeholder={`Ask anything about ${props.version === 'Census' ? 'US' : props.version} Demographics...`}
                    className="focus:ring-0 block w-full rounded-none rounded-l-md border-0 py-1.5 sm:ring-1 sm:ring-inset sm:ring-gray-300 sm:dark:ring-neutral-500 sm:focus:ring-2 sm:focus:ring-inset sm:focus:ring-blue-600 sm:dark:focus:ring-blue-600 sm:text-sm sm:leading-6 bg-transparent dark:placeholder-neutral-400"
                    value={value}
                    onChange={onSearchChange}
                />
            </div>
            <button
                type="button"
                className="focus:ring-0 focus:text-blue-600 hover:text-blue-600 dark:text-white/50 dark:hover:text-blue-600 relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md p-2 text-xs sm:text-sm font-semibold sm:ring-1 ring-inset ring-gray-300 dark:ring-neutral-500 sm:focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-600 focus:outline-none sm:hover:bg-gray-50 sm:hover:dark:bg-dark-900"
                onClick={onClear}
            >
                <FaTimes />
            </button>
        </div>
    )
}

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
    const [editingSql, setEditingSql] = useState(false)
    const [copied, setCopied] = useState(false)
    const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false)
    const [mobileHelpIsOpen, setMobileHelpIsOpen] = useState(true)
    const [mobileTableIsOpen, setMobileTableIsOpen] = useState(false)
    const [mobileSqlIsOpen, setMobileSqlIsOpen] = useState(false)
    const mobileMenuRef = useRef()
    const mobileHelpRef = useRef()
    const mobileTableRef = useRef()
    const mobileSqlRef = useRef()
    const mapRef = useRef()
    const expandedMobileSearchRef = useRef()
    const [touchStart, setTouchStart] = useState(null)
    const [touchEnd, setTouchEnd] = useState(null)
    const [polygons, setPolygons] = useState([])

    const onTouchStart = (e) => {
        if (expandedMobileSearchRef.current?.contains(e.target)) return
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientY)
    }

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientY)

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return
        const distance = touchStart - touchEnd
        const swipeUp = distance > 50
        const swipeDown = distance < -225
        swipeUp && !mobileMenuIsOpen ? setMobileMenuIsOpen(true) : swipeDown && mobileMenuIsOpen ? setMobileMenuIsOpen(false) : null
    }

    useEffect(() => {
        document.title = query || (props.version === 'Census' ? 'Census GPT' : 'San Francisco GPT')
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
        setPolygons([])
    }

    const handleSearchChange = (event) => {
        const { value } = event.target
        setQuery(value)
        setTitle('')
    }

    const handleClearSearch = () => {
        setQuery('')
    }

    const executeSql = (sql) => {
        console.log(1, sql)
        setIsLoading(true)
        setMobileHelpIsOpen(false)
        clearMapLayers()

        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                sql
            }),
        }

        fetch(api_endpoint + '/api/execute_sql', options)
            .then((response) => response.json())
            .then((response) => {
                // Set the loading state to false
                setIsLoading(false)

                // Handle errors
                if (!response || !response.result) {
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
                setMobileMenuIsOpen(true)
            })
            .catch((err) => {
                Sentry.setContext('queryContext', {
                    query: query
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

    const fetchBackend = (natural_language_query) => {
        if (natural_language_query == null) {
            return;
        }
        // Don't send a request if the query is empty!
        natural_language_query = natural_language_query.trim()
        if (!natural_language_query.length) return

        // Set the loading state
        setIsLoading(true)
        setMobileHelpIsOpen(false)

        // clear previous layers
        clearMapLayers()

        // Sanitize the query
        if(props.version === 'Census') {
            natural_language_query = cleanupQuery(natural_language_query)
        }

        let requestBody = {
            natural_language_query,
            table_names: ['crime_by_city', 'demographic_data'],
        }

        if(props.version === 'San Francisco') {
            requestBody = {
                natural_language_query,
                scope: 'SF'
            }
        }

        // Set the options for the fetch request
        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(requestBody),
        }

        let responseOuter = null
        // Send the request
        fetch((props.version === 'Census' ? api_endpoint : 'https://dev-text-sql-be.onrender.com/') + '/api/text_to_sql', options)
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

                // Filter out geolocation columns (lat, long, shape)
                let filteredColumns = []
                if (props.version === 'Census') {
                    filteredColumns = response.result.column_names.filter(
                        (c) => c !== 'lat' && c !== 'long'
                    )
                } else {
                    filteredColumns = response.result.column_names.filter(
                        (c) => c !== 'lat' && c !== 'long' && c !== 'shape'
                    )
                }
               

                // Fit the order of columns and filter out lat and long row values
                let rows = response.result.results.map((value) => {
                    let row = []
                    // Find each of the filtered column value in the object and push it into the row
                    filteredColumns.map((c) => row.push(value[c]))
                    return row
                })
                setTableInfo({ rows, columns: filteredColumns })

                if (props.version === 'San Francisco' && filteredColumns.indexOf('neighborhood') >= 0) {
                    // Render polygon shapes on the map
                    setPolygons(response.result.results.map(r => [r.shape]))
                    setVisualization('map')
                } else if (props.version === 'San Francisco' && filteredColumns.indexOf('neighborhood') == -1) {
                    // No neighborhoods to render. Default to chart
                    setVisualization('chart')
                }
                else if (
                     // render cities layer on the map
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
                setMobileMenuIsOpen(true)
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

    const SQL = ({ sql }) => {
        const sqlRef = useRef(sql)

        const CopySqlToClipboardButton = ({ text }) => {
            const handleCopy = async () => {
                if ('clipboard' in navigator) {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1000)
                    return await navigator.clipboard.writeText(text)
                } else {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1000)
                    return document.execCommand('copy', true, text)
                }
            }

            return (
                <button onClick={handleCopy} className='text-xs rounded-md px-2.5 py-2 font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 bg-white dark:bg-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700'>
                    {copied ? <BsClipboard2Check /> : <BsClipboard2 />}
                </button>
            )
        }

        const EditSqlButton = () => (
            <button onClick={() => setEditingSql(!editingSql)} className={`text-xs rounded-md px-2.5 py-2 font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 hover:bg-gray-100 dark:hover:bg-neutral-700  ${editingSql ? 'bg-gray-100 dark:bg-neutral-700' : 'bg-white dark:bg-neutral-600'}`}>
                <BsPencilSquare />
            </button>
        )

        return (
            <pre
                align="left"
                className="rounded-md bg-gray-100 dark:bg-dark-800 dark:text-white"
            >
                <div className='flex items-center w-full min-h-full'>
                    <div className='flex w-full h-full rounded-t-md items-center p-1.5 space-x-1.5 bg-gradient-to-b dark:from-black/50 from-neutral-300/75 to-neutral-300/50 dark:to-black/20 backdrop-blur-sm font-sans'>
                        <h2 className='font-bold tracking-wide h-6'>
                            {title}
                        </h2>
                        <div className='fixed flex w-full items-center justify-end right-1 space-x-1.5'>
                            {editingSql && (
                                <button
                                    onClick={() => {
                                        setSQL(sqlRef.current)
                                        setEditingSql(false)
                                        executeSql(sqlRef.current)
                                    }}
                                    className='h-6 text-xs items-center flex rounded-full ring-1 ring-blue-600 bg-blue-600/50 hover:bg-blue-600/75 px-2 backdrop-blur-lg font-semibold text-white'>
                                    Submit
                                </button>
                            )}
                            <EditSqlButton />
                            <CopySqlToClipboardButton text={sqlRef.current} />
                        </div>
                    </div>
                </div>
                <code
                    className={`px-2 bg-transparent text-sm text-gray-800 dark:text-white flex rounded-b-md ${editingSql && 'ring-2 ring-inset'}`}>
                    <SyntaxHighlighter
                        ref={sqlRef}
                        language="sql"
                        style={hybrid}
                        customStyle={{
                            color: undefined,
                            background: undefined,
                            margin: undefined,
                            padding: undefined,
                        }}
                        contentEditable={editingSql}
                        spellCheck={false}
                        suppressContentEditableWarning
                        onInput={(e) => sqlRef.current = e.currentTarget.textContent}
                        className='outline-none'
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && editingSql) {
                                setSQL(sqlRef.current)
                                setEditingSql(false)
                                executeSql(sqlRef.current)
                            }
                        }}
                        onDoubleClickCapture={() => !editingSql && setEditingSql(true)}
                    >
                        {editingSql ? sqlRef.current : sql}
                    </SyntaxHighlighter>
                </code>
            </pre>
        )
    }

    const polygonsGeoJSON = {
        type: "FeatureCollection",
        features: polygons.map((polygon) => {
          return {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: polygon,
            },
          };
        }),
    };

    let initialView = {
        longitude: -100,
        latitude: 40,
        zoom: 3.5
    }

    if (props.version === 'San Francisco') {
       initialView = {
            longitude: -122.431297,
            latitude: 37.773972,
            zoom: 11.5,
        }
    }

    return (
        <main className='h-screen bg-white dark:bg-dark-900 dark:text-white overflow-y-auto max-h-screen'>
            <div className="App flex flex-col h-full">
                <link
                    href="https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css"
                    rel="stylesheet"
                />

                <div className="fixed sm:relative w-full sm:flex flex-col p-2 sm:p-6 space-y-1.5 bg-gradient-to-b from-black/95 to-transparent bg/10 backdrop-blur-sm pb-2.5 sm:from-white sm:dark:from-transparent z-50">
                    <h1
                        className="text-4xl font-bold text-white sm:text-black dark:text-white"
                        onClick={() => {
                            window.location.assign('/')
                            handleClearSearch()
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        {props.version} GPT
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
                                version={props.version}
                            />
                            <SearchButton />
                        </form>
                    </div>
                    <Disclaimer version={props.version} />
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
                                version={props.version}
                            />
                        ) : isLoading ? (
                            <> </>
                        ) : (
                            <div className='flex flex-col space-y-4'>
                                <div>
                                    <SQL sql={sql} />
                                </div>

                                <Table
                                    columns={tableInfo.columns}
                                    values={tableInfo.rows}
                                />
                            </div>
                        )}
                    </div>

                    <div className='flex flex-grow h-full w-full relative sm:rounded-lg shadow overflow-hidden'>
                        <div className='fixed sm:absolute top-24 sm:top-0 right-0 z-10 p-1'>
                            <VizSelector
                                selected={visualization} setSelected={setVisualization}
                                tableRef={mobileTableRef} setTableIsOpen={setMobileTableIsOpen}
                                sqlRef={mobileSqlRef} setSqlIsOpen={setMobileSqlIsOpen}
                                viewsCanOpen={sql.length}
                            />
                        </div>
                        <div className="overflow-hidden sm:rounded-lg shadow flex w-full h-full fixed sm:relative">
                            {visualization == 'map' ?
                                <Map
                                    ref={mapRef}
                                    mapboxAccessToken="pk.eyJ1IjoicmFodWwtY2Flc2FyaHEiLCJhIjoiY2xlb2w0OG85MDNoNzNzcG5kc2VqaGR3dCJ9.mhsdkiyqyI5jLgy8TKYavg"
                                    style={{ width: '100%', height: '100%' }}
                                    mapStyle="mapbox://styles/mapbox/dark-v11"
                                    initialViewState={initialView}
                                    minZoom={props.version === 'San Francisco' ? 11 : 0}
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
                                    <Source
                                        id="polygons"
                                        type="geojson"
                                        data={polygonsGeoJSON}
                                    >
                                        <Layer {...polygonsLayer} />
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
                <div className='absolute top-24 flex w-full justify-center sm:hidden z-50'>
                    {isLoading && <span className='animate-spin text-4xl text-blue-600'><ImSpinner /></span>}
                </div>

                <button className='fixed top-[5.5rem] bg-black/20 backdrop-blur-sm rounded-lg text-white/80 hover:text-white p-2 m-2 text-xl sm:hidden z-40'
                    onClick={() => setMobileHelpIsOpen(!mobileHelpIsOpen)}
                >
                    <BsQuestionCircle />
                </button>
                {mobileHelpIsOpen && (
                    <div className='fixed h-screen w-screen z-30 items-center justify-center flex sm:hidden' onClick={(e) => mobileHelpRef.current && !mobileHelpRef.current.contains(e.target) && setMobileHelpIsOpen(false)}>
                        <div className='space-y-4 flex-col bg-white/80 dark:bg-dark-900/80 ring-1 ring-dark-300 backdrop-blur-sm shadow rounded-lg p-4 flex w-4/5 h-1/2 overflow-auto' ref={mobileHelpRef}>
                            <div className='font-bold text-lg'>
                                Welcome to {props.version} GPT
                            </div>
                            <Examples
                                postHogInstance={posthog}
                                setQuery={setQuery}
                                handleClick={fetchBackend}
                                version={props.version}
                            />
                        </div>
                    </div>
                )}

                {mobileMenuIsOpen ? (
                    <div className='bg-black/50 dark:bg-black/10 backdrop-blur fixed w-screen h-screen flex z-50 sm:hidden pointer-events-auto' onClick={(e) => mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && setMobileMenuIsOpen(false)}>
                        <div className='absolute w-full bottom-0 flex pointer-events-auto'>
                            <div className='overflow-auto min-h-[50vh] max-h-[65vh] bg-gray-300/60 dark:bg-black/50 backdrop-blur-xl w-full rounded-t-[2rem] flex flex-col items-center' ref={mobileMenuRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                                <button className='w-full items-center flex justify-center p-1.5 pt-2 rounded-full' onClick={() => setMobileMenuIsOpen(false)}>
                                    <div className='bg-black/50 dark:bg-white/40 h-1 w-16 rounded-full' />
                                </button>

                                <div className='flex flex-col items-center w-full p-4 space-y-8'>
                                    <div className='w-full'>
                                        <form
                                            autoComplete={'off'}
                                            onSubmit={(event) => {
                                                event.preventDefault()
                                                handleSearchClick(event)
                                            }}
                                            ref={expandedMobileSearchRef}
                                        >
                                            <SearchInput
                                                value={query}
                                                onSearchChange={handleSearchChange}
                                                onClear={handleClearSearch}
                                                version={props.version}
                                            />
                                        </form>
                                    </div>

                                    {sql.length != 0 && !isLoading && (
                                        <div className='space-y-4 flex-col flex w-full h-fit items-center pb-4'>
                                            <div className='bg-white/80 dark:bg-dark-900/80 ring-1 ring-dark-300 backdrop-blur-sm shadow rounded-lg w-full overflow-auto'>
                                                <SQL sql={sql} />
                                            </div>
                                            <div className='bg-white/80 dark:bg-dark-900/80 ring-1 ring-dark-300 backdrop-blur-sm shadow rounded-lg flex w-full overflow-auto'>
                                                <Table
                                                    columns={tableInfo.columns}
                                                    values={tableInfo.rows}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='fixed w-screen h-screen flex z-50 sm:hidden pointer-events-none' onClick={(e) => mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && setMobileMenuIsOpen(false)}>
                        <div className='absolute w-full bottom-0 flex pointer-events-auto'>
                            <div className='h-24 bg-gray-300/60 dark:bg-black/50 backdrop-blur-xl w-full rounded-t-[2rem] flex flex-col items-center' onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                                <button className='w-full items-center flex justify-center p-1.5 pt-2 rounded-full' onClick={() => setMobileMenuIsOpen(true)}>
                                    <div className='bg-black/50 dark:bg-white/40 h-1 w-16 rounded-full' />
                                </button>

                                <div className='flex w-full justify-center p-4'>
                                    <form
                                        autoComplete={'off'}
                                        className='w-full'
                                        onSubmit={(event) => {
                                            event.preventDefault()
                                            handleSearchClick(event)
                                        }}
                                    >
                                        <SearchInput
                                            value={query}
                                            onSearchChange={handleSearchChange}
                                            onClear={handleClearSearch}
                                            version={props.version}
                                        />
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {mobileTableIsOpen && sql.length && (
                    <div className='absolute h-screen w-screen z-30 items-center justify-center flex sm:hidden' onClick={(e) => mobileTableRef.current && !mobileTableRef.current.contains(e.target) && setMobileTableIsOpen(false)}>
                        <div className='bg-white/80 dark:bg-dark-900/80 ring-1 ring-dark-300 backdrop-blur-sm shadow rounded-lg flex w-4/5 max-h-80 overflow-auto items-start justify-center' ref={mobileTableRef}>
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
                            <SQL sql={sql} />
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}

App.defaultProps = {
    version: 'Census'
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
