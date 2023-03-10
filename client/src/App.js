import React, { useState, useRef, useEffect } from 'react';
import Map, {Layer, Source} from 'react-map-gl';
import GitHubButton from 'react-github-btn'
import mapboxgl from 'mapbox-gl';
import bbox from '@turf/bbox';
import posthog from 'posthog-js'
import * as turf from '@turf/turf'

// Components
import Table from './components/table'
import LoadingSpinner from './components/loadingSpinner'
import Examples from './components/examples'
import ErrorMessage from './components/error'
import * as Sentry from "@sentry/react";
// Utils
import { cleanupQuery, getCities, getZipcodes, getZipcodesMapboxFormatted } from './utils'

// Mapbox UI configuration
import { zipcodeFeatures, citiesFeatures, zipcodeLayerHigh, zipcodeLayerLow, citiesLayer } from './mapbox-ui-config'

import './css/App.css';

// Init posthog
posthog.init('phc_iLMBZqxwjAjaKtgz29r4EWv18El2qg3BIJoOOpw7s2e', { api_host: 'https://app.posthog.com' })

// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

let api_endpoint = 'https://ama-api.onrender.com'

if (process.env.REACT_APP_HOST_ENV === 'dev') {
  api_endpoint = 'http://localhost:9000'
}

function App(props) {
  const [query, setQuery] =  useState('');
  const [sql, setSQL] = useState('');
  const [zipcodesFormatted, setZipcodesFormatted] = useState([])
  const [zipcodes, setZipcodes] = useState([])
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [statusCode, setStatusCode] = useState(0)
  const [errorMessage, setErrorMessage] = useState('');
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  
  useEffect(() => {
    document.title = query || 'Census GPT';
  }, [query]);
  
  const queryParameters = new URLSearchParams(window.location.search)
  const urlSearch = queryParameters.get("s")

  useEffect(() => {
    if (urlSearch && urlSearch.length > 0) {
      posthog.capture('search_clicked', { natural_language_query: urlSearch })
      setQuery(urlSearch)
    }
  }, [urlSearch])

  const clearMapLayers = () => {
    setCities([])
    setZipcodes([])
    setZipcodesFormatted([])
  }

  const mapRef = useRef();

  const handleSearchChange = (event) => {
    const { value } = event.target;
    setQuery(value);
    setTitle('');
  }

  const fetchBackend = (natural_language_query) => {
    
    // Don't send a request if the query is empty!
    natural_language_query = natural_language_query.trim()
    if (natural_language_query.length == 0) return;

    // Set the loading state
    setIsLoading(true)

    // clear previous layers
    clearMapLayers()

    // Sanitize the query
    natural_language_query = cleanupQuery(natural_language_query)
    
    // Set the options for the fetch request
    const options = {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: '{"natural_language_query":"' + natural_language_query + '"}'
    };

    let responseOuter = null;
    // Send the request
    fetch(api_endpoint + '/api/text_to_sql', options)
      .then(response => response.json())
      .then(response => {

        // Set the loading state to false
        setIsLoading(false)

        // Handle errors
        if (!response || !response.sql_query || !response.result) {
          posthog.capture('backend_error', response)
          setErrorMessage("Something went wrong. Please try again or try a different query")
          return
        }

        // Capture the response in posthog
        posthog.capture('backend_response', response)

        // Set the state for SQL and Status Code
        setStatusCode(response.status)
          responseOuter = response
        setSQL(response.sql_query)

        console.log("Backend Response ==>", response)

        // Filter out lat and long columns
        let filteredColumns = response.result.column_names.filter(c => c != "lat" && c != "long")
        setColumns(filteredColumns)

        // Fit the order of columns and filter out lat and long row values
        let rows = response.result.results.map((value) => {
          let row = []
          // Find each of the filtered column value in the object and push it into the row
          filteredColumns.map(c => row.push(value[c]))
          return row
        })
        setRows(rows)

        // render cities layer on the map
        if (filteredColumns.indexOf("zip_code") == -1 && filteredColumns.indexOf("city") >= 0) {
          // Get the cities
          let responseCities = getCities(response.result)
          console.log(responseCities)
          if (responseCities.length == 0) {
              setErrorMessage("No results were returned")
              setCities([])
              setZipcodes([]) // reset cities rendering
          } else if (responseCities.length < 2) {
            // Focus the map to relevant parts
            // Fitbounds needs at least two geo coordinates. 
            // If less that 2 co-ordinates then use fly to.
            mapRef.current.flyTo({
              center: [responseCities[0].long, responseCities[0].lat],
              essential: true // this animation is considered essential with respect to prefers-reduced-motion
            });
          } else {
            let [minLng, minLat, maxLng, maxLat] = bbox(turf.lineString(responseCities.map(c => [c.long, c.lat])));
            mapRef.current.fitBounds(
              [
                [minLng, minLat],
                [maxLng, maxLat]
              ],
              {padding: '100', duration: 1000}
            );
          }
          
          // Set the cities into the state
          setCities(responseCities)

          // reset zipcode rendering
          setZipcodes([])

        } else if (filteredColumns.indexOf("zip_code") >= 0 ){

          // Render zipcodes layer on the map
          let responseZipcodes = getZipcodes(response.result)
          setZipcodesFormatted(getZipcodesMapboxFormatted(responseZipcodes))
  
          // Fitbounds needs at least two geo coordinates.
          if (responseZipcodes.length == 0) {
            setErrorMessage("No results were returned")
            setZipcodes([])
            setCities([]) // reset cities rendering
          } else if (responseZipcodes.length < 2) {
            // Fitbounds needs at least two geo coordinates. 
            // If less that 2 co-ordinates then use fly to.
            mapRef.current.flyTo({
              center: [responseZipcodes[0].long, responseZipcodes[0].lat],
              essential: true // this animation is considered essential with respect to prefers-reduced-motion
            });
          } else {
            let [minLng, minLat, maxLng, maxLat] = bbox(turf.lineString(responseZipcodes.map(z => [z.long, z.lat])));
            mapRef.current.fitBounds(
              [
                [minLng, minLat],
                [maxLng, maxLat]
              ],
              {padding: '100', duration: 1000}
            );
          }
          setZipcodes(responseZipcodes)
          setCities([]) // reset cities rendering
        }
      })
      .catch(err => {
          Sentry.setContext("queryContext", {
                query: query,
              ...responseOuter.results,
              ...responseOuter.sql_query,
            });
          Sentry.captureException(err)
        setIsLoading(false)
        posthog.capture('backend_error', {
            error: err,
        })
        setStatusCode(500)
        setErrorMessage(err)
        console.error(err)
      });

  }

  const handleSearchClick = (event) => {
    window.history.replaceState(null, "Census GPT", "/?s="  + encodeURIComponent(query))
    setTitle(query)
    posthog.capture('search_clicked', { natural_language_query: query })
    fetchBackend(query)
  }

  return (
    <div className="App">
      <link href="https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css" rel="stylesheet" />
      <div className="overflow-hidden rounded-lg bg-white shadow md:h-screen">
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-4xl font-bold mb-8">Census GPT</h1>
        <GitHubButton href="https://github.com/caesarhq/textSQL" data-size="large" aria-label="Star caesarhq/textSQL on GitHub">Github</GitHubButton>
        <div>
          <form autoComplete={"off"} className="relative mt-1 flex justify-center" onSubmit={(event) => {
          event.preventDefault()
              handleSearchClick(event)
          }}>
            <input
              type="text"
              name="search"
              id="search"
              placeholder="Ask anything about US Demographics..."
              className="block w-full md:w-1/2 rounded-md border-gray-300 pr-12 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={query}
              onChange={handleSearchChange}
            />
            <button
              type="submit"
              className="text-white bg-blue-600 focus:ring-4 focus:ring-blue-300 focus:outline-none inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-blue-700 ml-3"
            >
              Search
            </button>
          </form>
        </div>
      </div>
      <div className="bg-gray-50 px-4 h-full sm:p-6 flex flex-col md:flex-row md:pb-[200px]">
          <div className="rounded-lg overflow-y-scroll max-h-[60vh] h-full md:h-full md:max-h-full bg-white shadow flex-grow-[0] w-full mr-8 mb-8">
              {/*spinner*/}
            <LoadingSpinner isLoading={isLoading}/>
            {sql.length == 0 && !isLoading? <Examples postHogInstance={posthog} setQuery={setQuery} handleClick={fetchBackend}/> : isLoading ? <> </> : <>
              <p class="my-2 font-medium"> {title} </p>
              <div className="p-4">
                <pre align="left" className="bg-gray-100 rounded-md p-2 overflow-auto"><code className="text-sm text-gray-800 language-sql">{sql}</code></pre>
              </div>
              {statusCode == 500 ? <ErrorMessage errorMessage={errorMessage}/> : <></>}
              <Table columns={columns} values={rows}/>
            </> }
          </div>
          <div className="overflow-hidden rounded-lg bg-white shadow flex-grow-[2] h-[70vh] md:h-full w-full">
            <Map
              ref={mapRef}
              mapboxAccessToken="pk.eyJ1IjoicmFodWwtY2Flc2FyaHEiLCJhIjoiY2xlb2w0OG85MDNoNzNzcG5kc2VqaGR3dCJ9.mhsdkiyqyI5jLgy8TKYavg"
              style={{width: '100%', height:'100%'}}
              mapStyle="mapbox://styles/mapbox/dark-v11"
              initialViewState={{
                longitude: -100,
                latitude: 40,
                zoom: 3.5
              }}
            >
              <Source id="zips-kml" type="vector" url="mapbox://darsh99137.4nf1q4ec">
                <Layer {...zipcodeLayerLow(zipcodesFormatted)} />
              </Source>
              <Source id="zip-zoomed-out" type="geojson" data={{type: 'FeatureCollection', features: zipcodeFeatures(zipcodes) }}>
                <Layer {...zipcodeLayerHigh} />
              </Source>
              <Source id="cities" type="geojson" data={{type: 'FeatureCollection', features: citiesFeatures(cities)}}>
                <Layer {...citiesLayer} />
              </Source>
            </Map>;
          </div>
      </div>
    </div>
  </div>
  );
}

export default App;

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
