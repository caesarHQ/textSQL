import React, { useState, useRef, useEffect, useContext } from 'react'
import Map, { Layer, Source } from 'react-map-gl'
import mapboxgl from 'mapbox-gl'
import bbox from '@turf/bbox'
import * as turf from '@turf/turf'
import { ImSpinner } from 'react-icons/im'

// Components
import Table from './components/table'
import LoadingSpinner from './components/loadingSpinner'
import Examples from './components/examples'
import ExamplesFeed from './components/examplesFeed'
import ErrorMessage from './components/error'
import toast, { Toaster } from 'react-hot-toast'
import Disclaimer from './components/disclaimer'
import { VizSelector } from './components/vizSelector'
import { ExplanationModal } from './components/explanationModal'
import DataPlot from './components/dataPlot'
import { FeedContext } from './contexts/feedContext'

import { logSentryError } from './utils/loggers/sentry'
import { capturePosthog } from './utils/loggers/posthog'
import { getUserId } from './utils/user'

// Utils
import {
    getCities,
    getZipcodes,
    getZipcodesMapboxFormatted,
} from './utils/utils'

// Mapbox UI configuration
import {
    zipcodeFeatures,
    citiesFeatures,
    zipcodeLayerHigh,
    zipcodeLayerLow,
    citiesLayer,
    polygonsLayer,
    pointsFeatures,
    pointsLayer,
} from './utils/mapbox-ui-config'
import NeighborhoodGeoData from './utils/sf_analysis_neighborhoods.js'

import './css/App.css'
import {
    ContributeButton,
    DarkModeButton,
    DiscordButton,
    GithubButton,
} from './components/headerButtons'
import SearchBar from './components/searchBar'
import { notify } from './components/toast'
import { useDebouncedCallback } from 'use-debounce'
import { useSearchParams } from 'react-router-dom'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { hybrid } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import {
    BsChevronCompactDown,
    BsClipboard2,
    BsClipboard2Check,
    BsDashLg,
    BsPatchQuestion,
    BsPencilSquare,
    BsQuestionCircle,
    BsTable,
} from 'react-icons/bs'

// Add system dark mode
localStorage.theme === 'dark' ||
(!('theme' in localStorage) &&
    window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? document.documentElement.classList.add('dark')
    : document.documentElement.classList.remove('dark')

// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// prettier-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

let api_endpoint =
    process.env.REACT_APP_API_URL || 'https://dev-text-sql-be.onrender.com'

if (process.env.REACT_APP_HOST_ENV === 'dev') {
    api_endpoint = 'http://localhost:9000'
}

let currentGenerationId = null
let currentSuggestionId = null
let userId = null
let sessionId = null

function App(props) {
    const [searchParams, setSearchParams] = useSearchParams()
    const [query, setQuery] = useState('')
    const [sql, setSQL] = useState('')
    const [tables, setTables] = useState([])
    const [zipcodesFormatted, setZipcodesFormatted] = useState([])
    const [zipcodes, setZipcodes] = useState([])
    const [tableInfo, setTableInfo] = useState({ rows: [], columns: [] })
    const [errorMessage, setErrorMessage] = useState('')
    const [showExplanationModal, setShowExplanationModal] = useState('')
    const [cities, setCities] = useState([])
    const [isGetTablesLoading, setIsGetTablesLoading] = useState(false)
    const [tableNames, setTableNames] = useState()
    const [isLoading, setIsLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [visualization, setVisualization] = useState('map')
    const [editingSql, setEditingSql] = useState(false)
    const [copied, setCopied] = useState(false)
    const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false)
    const [mobileHelpIsOpen, setMobileHelpIsOpen] = useState(true)
    const [mobileTableIsOpen, setMobileTableIsOpen] = useState(false)
    const [mobileSqlIsOpen, setMobileSqlIsOpen] = useState(false)
    const mobileTableRef = useRef()
    const mobileSqlRef = useRef()
    const mapRef = useRef()
    const expandedMobileSearchRef = useRef()
    const sqlExplanationRef = useRef()
    const [touchStart, setTouchStart] = useState(null)
    const [touchEnd, setTouchEnd] = useState(null)
    const [polygons, setPolygons] = useState([])
    const [points, setPoints] = useState([])
    const [sqlExplanationIsOpen, setSqlExplanationIsOpen] = useState(false)
    const [sqlExplanation, setSqlExplanation] = useState()
    const [isExplainSqlLoading, setIsExplainSqlLoading] = useState(false)
    const [minimizeTableNames, setMinimizeTableNames] = useState(false)
    const [suggestedQuery, setSuggestedQuery] = useState(null)

    const { useServerFeed } = useContext(FeedContext)

    const tableColumns = tableInfo?.columns
    const tableRows = tableInfo?.rows

    useEffect(() => {
        document.title =
            query ||
            (props.version === 'Census' ? 'Census GPT' : 'San Francisco GPT')
    }, [query])

    useEffect(() => {
        if (errorMessage !== '') {
            console.log(errorMessage)
            notify(errorMessage)
        }
    }, [errorMessage])

    const queryParameters = new URLSearchParams(window.location.search)
    const urlSearch = queryParameters.get('s')

    const clearAll = () => {
        setQuery('')
        setSQL('')
        setErrorMessage('')
        setCities([])
        setZipcodes([])
        setZipcodesFormatted([])
        setPolygons([])
        setPoints([])
        setTableInfo({ rows: [], columns: [] })
        setTitle(
            props.version === 'Census' ? 'Census GPT' : 'San Francisco GPT'
        )
        setVisualization('map')
        setEditingSql(false)
        setCopied(false)
        setMobileMenuIsOpen(false)
        setMobileHelpIsOpen(true)
        setMobileTableIsOpen(false)
        setMobileSqlIsOpen(false)
        setSqlExplanationIsOpen(false)
        setSqlExplanation()
        setMinimizeTableNames(false)
        setTableNames()
        setIsLoading(false)
        setSearchParams({})
    }

    const clearAllButQuery = () => {
        setSQL('')
        setErrorMessage('')
        setZipcodes([])
        setZipcodesFormatted([])
        setPoints([])
        setTableInfo({ rows: [], columns: [] })
        setTitle(
            props.version === 'Census' ? 'Census GPT' : 'San Francisco GPT'
        )
        setVisualization('map')
        setEditingSql(false)
        setCopied(false)
        setMobileMenuIsOpen(false)
        setMobileHelpIsOpen(true)
        setMobileTableIsOpen(false)
        setMobileSqlIsOpen(false)
        setSqlExplanationIsOpen(false)
        setSqlExplanation()
        setMinimizeTableNames(false)
        setTableNames()
        setIsLoading(false)
        setSuggestedQuery(null)
    }

    const clearMapLayers = () => {
        setCities([])
        setZipcodes([])
        setZipcodesFormatted([])
        setPolygons([])
        setPoints([])
    }

    const handleSearchChange = (event) => {
        const { value } = event.target
        setQuery(value)
        setTitle('')
    }

    const handleClearSearch = () => {
        setQuery('')
    }

    const getSession = async () => {
        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                scope: props.version === 'San Francisco' ? 'SF' : 'USA',
            }),
        }

        fetch(api_endpoint + '/api/session', options)
            .then((response) => response.json())
            .then((response) => {
                sessionId = response.session_id
            })
            .catch((error) => {
                console.log('error', error)
                capturePosthog('backend_error', error)
            })
    }

    const getSuggestionForFailedQuery = async () => {
        currentSuggestionId = null
        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                natural_language_query: query,
                scope: props.version === 'San Francisco' ? 'SF' : 'USA',
                generation_id: currentGenerationId,
                session_id: sessionId,
            }),
        }

        fetch(api_endpoint + '/api/get_suggestion_failed_query', options)
            .then((response) => response.json())
            .then((response) => {
                // Handle errors
                if (!response || !response.suggested_query) {
                    capturePosthog('backend_error', response)
                    return
                }

                // Capture the response in posthog
                capturePosthog('backend_response', {
                    origin: 'get_suggestion_failed_query',
                })
                // Set the state for SQL and Status Code
                if (response.generation_id)
                    currentSuggestionId = response.generation_id

                setSuggestedQuery(response.suggested_query)
            })
            .catch((err) => {
                logSentryError({ query }, err)
                setIsLoading(false)
                capturePosthog('backend_error', {
                    error: err,
                })
                console.error(err)
            })
    }

    const getSuggestionForQuery = async () => {
        currentSuggestionId = null
        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                natural_language_query: query,
                scope: props.version === 'San Francisco' ? 'SF' : 'USA',
                generation_id: currentGenerationId,
                session_id: sessionId,
            }),
        }

        fetch(api_endpoint + '/api/get_suggestion', options)
            .then((response) => response.json())
            .then((response) => {
                // Handle errors
                if (!response || !response.suggested_query) {
                    capturePosthog('backend_error', response)
                    return
                }

                // Capture the response in posthog
                capturePosthog('backend_response', {
                    origin: 'getSuggestionForQuery',
                })
                // Set the state for SQL and Status Code

                if (response.generation_id)
                    currentSuggestionId = response.generation_id

                setSuggestedQuery(response.suggested_query)
            })
            .catch((err) => {
                logSentryError({ query }, err)
                setIsLoading(false)
                capturePosthog('backend_error', {
                    error: err,
                })
                console.error(err)
            })
    }

    const executeSql = (sql) => {
        setIsLoading(true)
        setSqlExplanation()
        setMobileHelpIsOpen(false)
        clearMapLayers()

        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                sql,
                session_id: sessionId,
            }),
        }

        fetch(api_endpoint + '/api/execute_sql', options)
            .then((response) => response.json())
            .then((response) => {
                // Set the loading state to false
                setIsLoading(false)

                // Handle errors
                if (!response || !response.result) {
                    capturePosthog('backend_error', response)
                    setErrorMessage(
                        'Something went wrong. Please try again or try a different query'
                    )
                    return
                }

                // Capture the response in posthog
                capturePosthog('backend_response', { origin: 'executeSql' })

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

                    if (!responseCities.length) {
                        setErrorMessage('No results were returned')
                        setCities([])
                        setZipcodes([]) // reset cities rendering
                    } else if (responseCities.length < 2) {
                        // Focus the map to relevant parts
                        // Fitbounds needs at least two geo coordinates.
                        // If less that 2 co-ordinates then use fly to.
                        mapRef &&
                            mapRef.current &&
                            mapRef.current.flyTo({
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
                        mapRef &&
                            mapRef.current &&
                            mapRef.current.fitBounds(
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
                        mapRef &&
                            mapRef.current &&
                            mapRef.current.flyTo({
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
                        mapRef &&
                            mapRef.current &&
                            mapRef.current.fitBounds(
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
                logSentryError({ query }, err)
                setIsLoading(false)
                capturePosthog('backend_error', {
                    error: err,
                })
                setErrorMessage(err.message || err)
                console.error(err)
            })
    }

    const explainSql = (sql) => {
        setIsExplainSqlLoading(true)

        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                sql,
                session_id: sessionId,
            }),
        }

        fetch(api_endpoint + '/api/explain_sql', options)
            .then((response) => response.json())
            .then((response) => {
                setSqlExplanation(response.explanation)
                setIsExplainSqlLoading(false)
            })
            .catch((err) => {
                setSqlExplanation()
                logSentryError({ query }, err)
                setIsExplainSqlLoading(false)
                capturePosthog('explainSql_backend_error', {
                    error: err,
                })
                setErrorMessage(err.message || err)
                console.error(err)
            })
    }

    const getTables = async (natural_language_query) => {
        setIsGetTablesLoading(true)

        let requestBody = {
            natural_language_query,
            scope: props.version === 'San Francisco' ? 'SF' : 'USA',
            session_id: sessionId,
        }

        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(requestBody),
        }

        const response = await fetch(api_endpoint + '/api/get_tables', options)
        const response_1 = await response.json()
        setIsGetTablesLoading(false)

        try {
            if (response_1?.generation_id) {
                currentGenerationId = response_1.generation_id
            }
        } catch {
            //do nothing
        }

        if (!response_1 || !response_1.table_names) {
            setTableNames()
            capturePosthog('getTables_backend_error', response_1)
            setErrorMessage(
                'Something went wrong. Please try again or try a different query'
            )
            return false
        }
        if (response_1.table_names.length === 0) {
            setShowExplanationModal('no_tables')
            return false
        }

        capturePosthog('getTables_backend_response', response_1)
        setTableNames(response_1.table_names)
        return response_1.table_names
    }

    const TableNamesDisplay = () => (
        <div className="flex flex-col w-full rounded-lg shadow bg-gray-100 dark:bg-dark-800 ring-dark-300 ring-0">
            <div className="flex w-full justify-between p-2 items-center rounded-t-lg bg-gradient-to-b dark:from-black/50 from-neutral-300/75 to-neutral-300/50 dark:to-black/20 backdrop-blur-sm">
                <div className="inline-flex items-center space-x-2">
                    <BsTable className="dark:text-white/60" />
                    <span className="font-medium text-sm">Tables Queried</span>
                </div>

                <button
                    className="text-sm rounded-full p-1 bg-white/10 hover:bg-white/20"
                    onClick={() => setMinimizeTableNames(!minimizeTableNames)}
                >
                    {minimizeTableNames ? (
                        <BsChevronCompactDown />
                    ) : (
                        <BsDashLg />
                    )}
                </button>
            </div>

            {!minimizeTableNames && (
                <ul className="font-medium text-left">
                    {tableNames.map((tableName, index) => (
                        <li
                            className={`${
                                index % 2 == 0
                                    ? 'dark:bg-black/10 bg-gray-400/10'
                                    : 'dark:bg-black/20 bg-gray-400/20'
                            } py-1 pl-2 backdrop-blur-md border-b dark:border-white/10 border-black/10 ${
                                index === tableNames.length - 1 &&
                                'rounded-b-lg border-b-0'
                            }`}
                            key={'name_' + index}
                        >
                            <span className="text-sm">{tableName}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )

    const fetchBackend = async (natural_language_query) => {
        if (natural_language_query == null) {
            return
        }
        // Don't send a request if the query is empty!
        natural_language_query = natural_language_query.trim()
        if (!natural_language_query.length) return

        setMobileHelpIsOpen(false)
        setTableNames()
        setSqlExplanation()
        setShowExplanationModal(false)

        // clear previous layers
        clearMapLayers()
        clearAllButQuery()
        const table_names = await getTables(natural_language_query)

        if (!table_names) {
            await getSuggestionForFailedQuery()
            return
        }

        // Set the loading state
        setIsLoading(true)

        let requestBody = {
            natural_language_query,
            table_names,
            scope: props.version === 'San Francisco' ? 'SF' : 'USA',
            session_id: sessionId,
            generation_id: currentGenerationId,
        }

        // Set the options for the fetch request
        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(requestBody),
        }

        let responseOuter = null
        // Send the request
        const startTime = new Date().getTime()
        const apiCall = fetch(api_endpoint + '/api/text_to_sql', options)
        const TIMEOUT_DURATION = 45000
        const timeout = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Server failed to respond in time'))
            }, TIMEOUT_DURATION) // timeout after 45 seconds
        })
        Promise.race([apiCall, timeout])
            .then((response) => response.json())
            .then(async (response) => {
                // Set the loading state to false
                setIsLoading(false)

                // Handle errors
                if (!response) {
                    capturePosthog('backend_error', response)
                    setErrorMessage(
                        'Something went wrong. Please try again or try a different query'
                    )
                    setTableNames()
                    return
                }

                if (!('sql_query' in response) || !response.result) {
                    capturePosthog('backend_error', response)
                    setShowExplanationModal('attempted')
                    await getSuggestionForFailedQuery()
                    setTableNames()
                    return
                }

                // Capture the response in posthog
                const duration = new Date().getTime() - startTime

                capturePosthog('backend_response', {
                    origin: 'fetchBackend',
                    duration,
                })

                // Set the state for SQL and Status Code
                responseOuter = response
                setSQL(response.sql_query)

                // Get suggested query built on top of the current query
                await getSuggestionForQuery()

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

                if (
                    props.version === 'San Francisco' &&
                    filteredColumns.indexOf('point') >= 0
                ) {
                    // Render points shapes on the map
                    // Point: ( -122.41816048, 37.75876017)
                    setPoints(
                        response.result.results
                            .filter((r) => !!r.point)
                            .map((r) => {
                                const regex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/
                                const match = r.point.match(regex)
                                if (match) {
                                    const long = parseFloat(match[1])
                                    const lat = parseFloat(match[2])
                                    return { long, lat }
                                }
                                return null // Return null if no match is found (you can handle this case as needed)
                            })
                            .filter(Boolean)
                    ) // Filter out any null values from the result

                    setVisualization('map')
                } else if (
                    props.version === 'San Francisco' &&
                    filteredColumns.indexOf('neighborhood') >= 0
                ) {
                    // Render polygon shapes on the map
                    // Get GeoJson shape for each neighborhood from the local file
                    setPolygons(
                        response.result.results
                            .filter((r) => !!r.neighborhood)
                            .map((r) => [
                                NeighborhoodGeoData.neighborhoods[
                                    r.neighborhood
                                ]?.shape,
                            ])
                    )
                    setVisualization('map')
                } else if (
                    props.version === 'San Francisco' &&
                    filteredColumns.indexOf('neighborhood') == -1
                ) {
                    // No neighborhoods or points to render. Default to chart
                    setVisualization('chart')
                } else if (
                    // render cities layer on the map
                    filteredColumns.indexOf('zip_code') === -1 &&
                    filteredColumns.indexOf('city') >= 0
                ) {
                    // Get the cities
                    let responseCities = getCities(response.result)

                    if (!responseCities.length) {
                        setErrorMessage('No results were returned')
                        setCities([])
                        setZipcodes([]) // reset cities rendering
                    } else if (responseCities.length < 2) {
                        // Focus the map to relevant parts
                        // Fitbounds needs at least two geo coordinates.
                        // If less that 2 co-ordinates then use fly to.
                        mapRef &&
                            mapRef.current &&
                            mapRef.current.flyTo({
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
                        mapRef &&
                            mapRef.current &&
                            mapRef.current.fitBounds(
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
                        mapRef &&
                            mapRef.current &&
                            mapRef.current.flyTo({
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
                        mapRef &&
                            mapRef.current &&
                            mapRef.current.fitBounds(
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
                logSentryError(
                    {
                        query: query,
                        ...responseOuter,
                    },
                    err
                )
                setIsLoading(false)
                setTableNames()
                capturePosthog('backend_error', {
                    error: err,
                    timeout: TIMEOUT_DURATION,
                })
                setErrorMessage(err.message || err)
                console.error(err)
            })
    }

    const debouncedFetchBackend = useDebouncedCallback((query) => {
        fetchBackend(query)
    }, 100)

    useEffect(() => {
        currentGenerationId = null
        const queryFromURL = searchParams.get('s')
        if (queryFromURL) {
            if (queryFromURL != query) {
                capturePosthog('search_clicked', {
                    natural_language_query: urlSearch,
                    trigger: 'url',
                })
                setQuery(urlSearch)
                debouncedFetchBackend(urlSearch)
            }
        }
        userId = getUserId()
        getSession()
    }, [])

    const handleSearchClick = (event) => {
        currentGenerationId = null
        setSearchParams(`?${new URLSearchParams({ s: query })}`)
        setTitle(query)
        capturePosthog('search_clicked', {
            natural_language_query: query,
            trigger: 'button',
        })
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
                <button
                    onClick={handleCopy}
                    className="text-xs rounded-md px-2.5 py-2 font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 bg-white dark:bg-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700"
                >
                    {copied ? <BsClipboard2Check /> : <BsClipboard2 />}
                </button>
            )
        }

        const EditSqlButton = () => (
            <button
                onClick={() => setEditingSql(!editingSql)}
                className={`text-xs rounded-md px-2.5 py-2 font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 hover:bg-gray-100 dark:hover:bg-neutral-700  ${
                    editingSql
                        ? 'bg-gray-100 dark:bg-neutral-700'
                        : 'bg-white dark:bg-neutral-600'
                }`}
            >
                <BsPencilSquare />
            </button>
        )

        const ExplainSqlButton = () => (
            <>
                <div className="group relative flex">
                    <button
                        onClick={() => {
                            setSqlExplanationIsOpen(!sqlExplanationIsOpen)
                            !sqlExplanation && explainSql(sqlRef.current)
                        }}
                        className={`text-lg hover:text-blue-600 ${
                            sqlExplanationIsOpen && 'text-blue-600'
                        }`}
                    >
                        <BsPatchQuestion />
                    </button>
                    {sqlExplanationIsOpen ? (
                        <div
                            ref={sqlExplanationRef}
                            className="h-[5.4rem] w-[28.5rem] flex overflow-auto top-7 text-xs absolute rounded-md p-2 bg-gray-300/95 dark:bg-dark-800/95 backdrop-blur-xl ring-blue-600 ring-1 ring-inset"
                        >
                            {isExplainSqlLoading ? (
                                <div className="flex w-full items-center justify-center text-lg">
                                    <ImSpinner className="animate-spin" />
                                </div>
                            ) : (
                                <span className="whitespace-pre-wrap text-sm font-medium">
                                    {sqlExplanation}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="font-semibold top-7 text-sm hidden group-hover:block absolute rounded-md p-1 bg-gray-300/75 dark:bg-dark-800/75 backdrop-blur ring-gray-900 dark:ring-gray-300 ring-1">
                            Click to explain SQL
                        </div>
                    )}
                </div>
            </>
        )

        return (
            <pre
                align="left"
                className="rounded-lg bg-gray-100 dark:bg-dark-800 dark:text-white ring-dark-300 ring-0"
            >
                <div className="flex items-center w-full min-h-full">
                    <div className="rounded-t-lg flex w-full justify-end h-full items-center p-2 space-x-1.5 bg-gradient-to-b dark:from-black/50 from-neutral-300/75 to-neutral-300/50 dark:to-black/20 backdrop-blur-sm font-sans">
                        <ExplainSqlButton />
                        <h2 className="font-bold tracking-wide h-6 overflow-hidden flex w-full">
                            {title}
                        </h2>
                        <div className="flex right-1 space-x-1.5 relative items-center">
                            {editingSql && (
                                <button
                                    onClick={() => {
                                        setSQL(sqlRef.current)
                                        setEditingSql(false)
                                        executeSql(sqlRef.current)
                                    }}
                                    className="h-6 text-xs items-center flex rounded-full ring-1 ring-blue-600 bg-blue-600/50 hover:bg-blue-600/75 px-2 backdrop-blur-lg font-semibold text-white"
                                >
                                    Submit
                                </button>
                            )}
                            {/* <EditSqlButton /> */}
                            <CopySqlToClipboardButton text={sqlRef.current} />
                        </div>
                    </div>
                </div>
                <code
                    className={`px-2 bg-transparent text-sm text-gray-800 dark:text-white flex ${
                        editingSql && 'ring-2 ring-inset'
                    }`}
                >
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
                        onInput={(e) =>
                            (sqlRef.current = e.currentTarget.textContent)
                        }
                        className="outline-none"
                        onKeyPress={(e) => {
                            if (
                                e.key === 'Enter' &&
                                !e.shiftKey &&
                                editingSql
                            ) {
                                setSQL(sqlRef.current)
                                setEditingSql(false)
                                executeSql(sqlRef.current)
                            }
                        }}
                        // onDoubleClickCapture={() => !editingSql && setEditingSql(true)}
                    >
                        {editingSql ? sqlRef.current : sql}
                    </SyntaxHighlighter>
                </code>
            </pre>
        )
    }

    const polygonsGeoJSON = {
        type: 'FeatureCollection',
        features: polygons.map((polygon) => {
            return {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: polygon,
                },
            }
        }),
    }

    let initialView = {
        longitude: -100,
        latitude: 40,
        zoom: 3.5,
    }

    if (props.version === 'San Francisco') {
        initialView = {
            longitude: -122.431297,
            latitude: 37.773972,
            zoom: 11.5,
        }
    }

    const isStartingState =
        !zipcodesFormatted?.length &&
        !zipcodes?.length &&
        !cities?.length &&
        !points?.length &&
        !tableInfo?.columns?.length

    return (
        <main
            className="h-screen bg-white dark:bg-dark-900 dark:text-white overflow-y-auto max-h-screen"
            style={{ position: 'relative' }}
        >
            {showExplanationModal && (
                <ExplanationModal
                    showExplanationModal={showExplanationModal}
                    setShowExplanationModal={setShowExplanationModal}
                    version={props.version}
                />
            )}
            <div
                className="App flex flex-col h-full"
                onClick={(e) =>
                    sqlExplanationRef.current &&
                    !sqlExplanationRef.current.contains(e.target) &&
                    setSqlExplanationIsOpen(false)
                }
            >
                <link
                    href="https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css"
                    rel="stylesheet"
                />

                <div className="relative w-full flex flex-col p-6 space-y-1.5 bg-gradient-to-b bg/10 backdrop-blur-sm pb-2.5 from-white dark:from-transparent z-50">
                    <div className="inline-flex gap-x-2 align-middle justify-center mb-6">
                        <GithubButton />
                        <DiscordButton />
                        <DarkModeButton />
                    </div>

                    <h1
                        className="text-4xl font-bold text-black dark:text-white flex items-start justify-center"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            clearAll()
                        }}
                    >
                        {props.version} GPT
                        {props.version === 'San Francisco' && (
                            <div className="text-blue-600 font-bold uppercase text-sm ml-2 mt-[4px]">
                                BETA
                            </div>
                        )}
                    </h1>
                    <Toaster />
                    <div className="block px-6 pb-2">
                        <form
                            autoComplete={'off'}
                            className="flex justify-center"
                            onSubmit={(event) => {
                                event.preventDefault()
                                handleSearchClick(event)
                            }}
                        >
                            <SearchBar
                                value={query}
                                onSearchChange={handleSearchChange}
                                onClear={handleClearSearch}
                                version={props.version}
                                suggestedQuery={suggestedQuery}
                                setTitle={setTitle}
                                setQuery={setQuery}
                                fetchBackend={fetchBackend}
                                currentSuggestionId={currentSuggestionId}
                            />
                        </form>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row h-full w-full gap-6 p-6">
                    <div className="gap-3 flex flex-col h-full w-full lg:max-h-full overflow-y-auto items-center">
                        {/*spinner*/}
                        <LoadingSpinner
                            isLoading={isLoading || isGetTablesLoading}
                        />
                        {sql.length === 0 &&
                        !isLoading &&
                        !isGetTablesLoading ? (
                            useServerFeed ? (
                                <ExamplesFeed
                                    setQuery={setQuery}
                                    handleClick={fetchBackend}
                                    version={props.version}
                                />
                            ) : (
                                <Examples
                                    setQuery={setQuery}
                                    handleClick={fetchBackend}
                                    version={props.version}
                                />
                            )
                        ) : (
                            isLoading && <> </>
                        )}
                        <div className="flex flex-col space-y-4 w-full">
                            {!isLoading && sql.length !== 0 && (
                                <>
                                    <div>
                                        <SQL sql={sql} />
                                    </div>

                                    <Table
                                        columns={tableColumns}
                                        values={tableRows}
                                    />
                                </>
                            )}
                            {tableNames && <TableNamesDisplay />}
                        </div>
                    </div>
                    {!isStartingState && (
                        <div className="flex flex-grow h-full w-full relative rounded-lg shadow overflow-hidden">
                            <div className="absolute top-0 right-0 z-10 p-1">
                                <VizSelector
                                    selected={visualization}
                                    setSelected={setVisualization}
                                    tableRef={mobileTableRef}
                                    setTableIsOpen={setMobileTableIsOpen}
                                    sqlRef={mobileSqlRef}
                                    setSqlIsOpen={setMobileSqlIsOpen}
                                    viewsCanOpen={sql.length}
                                />
                            </div>
                            <div className="overflow-hidden rounded-lg shadow flex-grow-[2] min-h-[70vh] w-full h-full relative">
                                {visualization == 'map' ? (
                                    <Map
                                        ref={mapRef}
                                        mapboxAccessToken="pk.eyJ1IjoicmFodWwtY2Flc2FyaHEiLCJhIjoiY2xlb2w0OG85MDNoNzNzcG5kc2VqaGR3dCJ9.mhsdkiyqyI5jLgy8TKYavg"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                        }}
                                        mapStyle="mapbox://styles/mapbox/dark-v11"
                                        initialViewState={initialView}
                                        minZoom={
                                            props.version === 'San Francisco'
                                                ? 11.5
                                                : 0
                                        }
                                    >
                                        <Source
                                            id="zips-kml"
                                            type="vector"
                                            url="mapbox://darsh99137.4nf1q4ec"
                                        >
                                            <Layer
                                                {...zipcodeLayerLow(
                                                    zipcodesFormatted
                                                )}
                                            />
                                        </Source>
                                        <Source
                                            id="zip-zoomed-out"
                                            type="geojson"
                                            data={{
                                                type: 'FeatureCollection',
                                                features:
                                                    zipcodeFeatures(zipcodes),
                                            }}
                                        >
                                            <Layer {...zipcodeLayerHigh} />
                                        </Source>
                                        <Source
                                            id="cities"
                                            type="geojson"
                                            data={{
                                                type: 'FeatureCollection',
                                                features:
                                                    citiesFeatures(cities),
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
                                        <Source
                                            id="points"
                                            type="geojson"
                                            data={{
                                                type: 'FeatureCollection',
                                                features:
                                                    pointsFeatures(points),
                                            }}
                                        >
                                            <Layer {...pointsLayer} />
                                        </Source>
                                    </Map>
                                ) : (
                                    // following <div> helps plot better scale bar widths for responsiveness
                                    <div className="overflow-x-auto flex w-full overflow-hidden mb-32">
                                        <DataPlot
                                            cols={tableInfo.columns}
                                            rows={tableInfo.rows}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="mb-5">
                    <Disclaimer version={props.version} />
                </div>
            </div>
        </main>
    )
}

App.defaultProps = {
    version: 'Census',
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
