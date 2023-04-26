import React, { useState, useRef, useEffect, useContext } from 'react'
import bbox from '@turf/bbox'
import * as turf from '@turf/turf'

import { Toaster } from 'react-hot-toast'
import Disclaimer from './components/disclaimer'
import { ExplanationModal } from './components/explanationModal'
import { FeedContext } from './contexts/feedContext'
import LoadingSpinner from './components/loadingSpinner'
import ExamplesFeed from './components/examplesFeed'
import Examples from './components/examples'

import { ResultsContainer } from './components/results/resultsContainer'

import { logSentryError } from './utils/loggers/sentry'
import { capturePosthog } from './utils/loggers/posthog'
import { getUserId } from './utils/user'

// Utils
import {
    getCities,
    getZipcodes,
    getZipcodesMapboxFormatted,
} from './utils/utils'

import NeighborhoodGeoData from './utils/sf_analysis_neighborhoods.js'

import './css/App.css'
import {
    DarkModeButton,
    DiscordButton,
    GithubButton,
} from './components/headerButtons'
import SearchBar from './components/searchBar'
import { notify } from './components/toast'
import { useDebouncedCallback } from 'use-debounce'
import { useSearchParams } from 'react-router-dom'

// Add system dark mode
localStorage.theme === 'dark' ||
(!('theme' in localStorage) &&
    window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? document.documentElement.classList.add('dark')
    : document.documentElement.classList.remove('dark')

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
    const mobileTableRef = useRef()
    const mobileSqlRef = useRef()
    const mapRef = useRef()
    const [polygons, setPolygons] = useState([])
    const [points, setPoints] = useState([])
    const [sqlExplanationIsOpen, setSqlExplanationIsOpen] = useState(false)
    const [sqlExplanation, setSqlExplanation] = useState()
    const [isExplainSqlLoading, setIsExplainSqlLoading] = useState(false)
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
        setSqlExplanationIsOpen(false)
        setSqlExplanation()
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
        setSqlExplanationIsOpen(false)
        setSqlExplanation()
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

    const handleClickExample = async (natural_language_query) => {
        setSearchParams(
            `?${new URLSearchParams({ s: natural_language_query })}`
        )
        await fetchBackend(natural_language_query)
    }

    const fetchBackend = async (natural_language_query) => {
        if (natural_language_query == null) {
            return
        }
        // Don't send a request if the query is empty!
        natural_language_query = natural_language_query.trim()
        if (!natural_language_query.length) return

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

    const handleSearchClick = () => {
        currentGenerationId = null
        setSearchParams(`?${new URLSearchParams({ s: query })}`)
        setTitle(query)
        capturePosthog('search_clicked', {
            natural_language_query: query,
            trigger: 'button',
        })
        fetchBackend(query)
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
            <div className="App flex flex-col h-full">
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
                <LoadingSpinner isLoading={isLoading || isGetTablesLoading} />
                {sql.length === 0 && !isLoading && !isGetTablesLoading ? (
                    <div className="gap-3 flex flex-col w-full items-center">
                        {useServerFeed ? (
                            <ExamplesFeed
                                setQuery={setQuery}
                                handleClick={handleClickExample}
                                version={props.version}
                            />
                        ) : (
                            <Examples
                                setQuery={setQuery}
                                handleClick={fetchBackend}
                                version={props.version}
                            />
                        )}
                    </div>
                ) : (
                    isLoading && <> </>
                )}

                <ResultsContainer
                    visualization={visualization}
                    setVisualization={setVisualization}
                    mobileTableRef={mobileTableRef}
                    mobileSqlRef={mobileSqlRef}
                    mapRef={mapRef}
                    initialView={initialView}
                    zipcodes={zipcodes}
                    zipcodesFormatted={zipcodesFormatted}
                    cities={cities}
                    polygonsGeoJSON={polygonsGeoJSON}
                    tableInfo={tableInfo}
                    points={points}
                    sql={sql}
                    props={props}
                    isStartingState={isStartingState}
                    isLoading={isLoading}
                    isGetTablesLoading={isGetTablesLoading}
                    setQuery={setQuery}
                    fetchBackend={fetchBackend}
                    useServerFeed={useServerFeed}
                    tableColumns={tableColumns}
                    tableRows={tableRows}
                    tableNames={tableNames}
                    sqlExplanationIsOpen={sqlExplanationIsOpen}
                    setSqlExplanationIsOpen={setSqlExplanationIsOpen}
                    isExplainSqlLoading={isExplainSqlLoading}
                    sqlExplanation={sqlExplanation}
                    explainSql={explainSql}
                    executeSql={executeSql}
                    setSQL={setSQL}
                    title={title}
                />

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
