import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import Map, {Layer, Source} from 'react-map-gl';

import { XCircleIcon } from '@heroicons/react/20/solid'
import mapboxgl from 'mapbox-gl';
import bbox from '@turf/bbox';
import * as turf from '@turf/turf'
import posthog from 'posthog-js'

posthog.init('phc_iLMBZqxwjAjaKtgz29r4EWv18El2qg3BIJoOOpw7s2e', { api_host: 'https://app.posthog.com' })

// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

// mapboxgl.accessToken = 'pk.eyJ1IjoicmFodWwtY2Flc2FyaHEiLCJhIjoiY2xlb2w0OG85MDNoNzNzcG5kc2VqaGR3dCJ9.mhsdkiyqyI5jLgy8TKYavg';
// mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;

function TableHeader(props) {
  return (
    <thead>
      <tr>
        {props.columns.map((x) => ( <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">{x}</th>))}
      </tr>
    </thead>
  );
}

function TableRows(props) {
  return (
    <tbody className="divide-y divide-gray-200">
      {props.values.map((row, i) => (
        <tr key={"row"+i}>
          {row.map((rowValue) => (
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
            {rowValue}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

function LoadingSpinner(props) {
  return props.isLoading ? <div role="status" className="my-4 flex justify-center items-center">
  <svg aria-hidden="true" class="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
  </svg>
  <span class="sr-only">Loading...</span>
</div> : <></>
}

function Examples(props) {
  const basic_example_queries = [
    "Five cities in Florida with the highest crime",
    "Richest neighborhood in Houston, TX"
  ]
  const advanced_example_queries = [
    "3 neighborhoods in San Francisco that have the highest female to male ratio",
    "Which area in San Francisco has the highest of racial and what is the percentage population of each race in that area",
    "Which 5 areas have the median income closest to the national median income?"
  ]
  return (
    <div> 
      <p class="my-2 font-medium"> Try these: </p>
      <div >
        <p className="my-4"> Basic </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {basic_example_queries.map((q) => (
          <div
            key={q}
            className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400"
          >
            <div className="min-w-0 flex-1">
              <a className="focus:outline-none" onClick={() => {
                  posthog.capture('example_clicked', { natural_language_query: q })
                  props.setQuery(q)
                  props.handleClick(q)
                }}>
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">{q}</p>
              </a>
            </div>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
              </svg>
          </div>
        ))}
        </div>
      </div>
      <div >
        <p className="my-4"> Advanced </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {advanced_example_queries.map((q) => (
          <div
            key={q}
            className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400"
          >
            <div className="min-w-0 flex-1">
              <a className="focus:outline-none" onClick={() => {
                  posthog.capture('example_clicked', { natural_language_query: q })
                  props.setQuery(q)
                  props.handleClick(q)
                }}>
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">{q}</p>
              </a>
            </div>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
              </svg>
          </div>
        ))}
        </div>
      </div>
    </div>
  )
}

function ErrorMessage(props) {
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">There were errors with your submission</h3>
          <div className="mt-2 text-sm text-red-700">
            <ul role="list" className="list-disc space-y-1 pl-5">
              <li>{props.errorMessage.toString()}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Table(props) {
  let columns = props.columns
  let values = props.values

  return (
<div className="px-4 sm:px-6 lg:px-8">
      <div className="mt-8 flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <TableHeader columns={columns} />
              <TableRows values={values} />
            </table>
          </div>
        </div>
      </div>
    </div>
  );
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

  const queryParameters = new URLSearchParams(window.location.search)
  const urlSearch = queryParameters.get("s")

  useEffect(() => {
    if (urlSearch && urlSearch.length > 0) {
      posthog.capture('search_clicked', { natural_language_query: urlSearch })
      setQuery(urlSearch)
      fetchBackend(urlSearch)
    }
  }, [urlSearch])

  const clearMapLayers = () => {
    setCities([])
    setZipcodes([])
    setZipcodesFormatted([])
  }

  const mapRef = useRef();

  // Test data. Schema for response.result from fetch
  // const test_table = {
  //   'column_names': ['zip_code', 'median_income_for_workers'],
  //   'values': [
  //         {
  //           "female_pop": 42367,
  //           "zip_code": "94112",
  //           "zip_code_lat": 37.720375,
  //           "zip_code_lon": -122.44295
  //       },
  //       {
  //           "female_pop": 33067,
  //           "zip_code": "94110",
  //           "zip_code_lat": 37.750021,
  //           "zip_code_lon": -122.415201
  //       },
  //       {
  //           "female_pop": 30826,
  //           "zip_code": "94122",
  //           "zip_code_lat": 37.758797,
  //           "zip_code_lon": -122.485128
  //       }
  //     ]
  // }

  const handleSearchChange = (event) => {
    const { value } = event.target;
    setQuery(value);
  }

  const getZipcodesMapboxFormatted = (zips) => {
    return zips.map(x => "<at><openparen>" + x['zipcode'] + "<closeparen>")
  }

  const getZipcodes = (result) => { 

      let zipcode_index = result.column_names.indexOf("zip_code")
      if (zipcode_index == -1 || !result.results) return []

      return result.results.map(x => { return {'zipcode': x["zip_code"], 'lat': x["lat"], 'long': x["long"] }})
  }
  
  const getCities = (result) => { 
    let city_index = result.column_names.indexOf("city")
    if (city_index == -1 || !result.results) return []

    return result.results.map(x => { return {'city': x["city"], 'lat': x["lat"], 'long': x["long"] }})
  }

  const cleanupQuery = (q) => {
    let cleanedQuery = q.replaceAll("area", "zipcode")
    cleanedQuery = cleanedQuery.replaceAll("areas", "zipcodes")
    cleanedQuery = cleanedQuery.replaceAll("neighborhood", "zipcode")
    cleanedQuery = cleanedQuery.replace("neighborhoods", "zipcodes")
    cleanedQuery = cleanedQuery.replace("part of", "zipcode of")
    cleanedQuery = cleanedQuery.replace("parts of", "zipcodes of")
    return cleanedQuery
  }

  const fetchBackend = (natural_language_query) => {
    setIsLoading(true)
    clearMapLayers() // clear previous layers

    natural_language_query = cleanupQuery(natural_language_query)
    
    const options = {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: '{"natural_language_query":"' + natural_language_query + '"}'
    };

  let res = {
      "result": {
          "column_names": [
              "zip_code",
              "difference",
              "lat",
              "long"
          ],
          "results": [
              {
                  "difference": 0,
                  "lat": 45.925286,
                  "long": -89.499516,
                  "zip_code": "54558"
              },
              {
                "difference": 0,
                "lat": 45.925286,
                "long": -89.499516,
                "zip_code": "54558"
            }
          ]
      },
      "sql_query": "SELECT zip_code, ABS(median_income_for_workers - (SELECT median_income_for_workers FROM acs_census_data ORDER BY ABS(median_income_for_workers - (SELECT AVG(median_income_for_workers) FROM acs_census_data)) LIMIT 1)) AS difference\nFROM acs_census_data\nWHERE median_income_for_workers IS NOT NULL\nORDER BY difference\nLIMIT 1"
  }

    fetch('https://ama-api.onrender.com/api/text_to_sql', options)
      .then(response => response.json())
      .then(response => {
        setIsLoading(false)
        if (!response || !response.sql_query || !response.result) {
          posthog.capture('backend_error', response)
          setErrorMessage("Something went wrong. Please try again or try a different query")
          return
        }

        posthog.capture('backend_response', response)
        setStatusCode(response.status)
        setSQL(response.sql_query)

        console.log("Backend Response ==>", response)

        // filter out lat and long columns
        let filteredColumns = response.result.column_names.filter(c => c != "lat" && c != "long")
        setColumns(filteredColumns)

        // fit the order of columns and filter out lat and long row values
        let rows = response.result.results.map((value) => {
          let row = []
          // find each of the filtered column value in the object and push it into the row
          filteredColumns.map(c => row.push(value[c]))
          return row
        })
        setRows(rows)

        // render cities layer on the map
        if (filteredColumns.indexOf("zip_code") == -1 && filteredColumns.indexOf("city") >= 0) {
          let responseCities = getCities(response.result)

          // Focus the map to relevant parts

          if (responseCities.length < 2) {
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
  
          setCities(responseCities)
          setZipcodes([]) // reset zipcode rendering
        } else if (filteredColumns.indexOf("zip_code") >= 0 ){
          // render zipcodes layer on the map
          
          let responseZipcodes = getZipcodes(response.result)

          setZipcodesFormatted(getZipcodesMapboxFormatted(responseZipcodes))
  
          // Fitbounds needs at least two geo coordinates. 
          // if (responseZipcodes.length < 2) {
          //   responseZipcodes.push({
          //     'zipcode': responseZipcodes[0].zipcode,
          //     'lat': responseZipcodes[0].lat+0.1,
          //     'long': responseZipcodes[0].long,
          //   })
          // }
  
          // Fitbounds needs at least two geo coordinates. 
          if (responseZipcodes.length < 2) {
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
      setIsLoading(false)
      posthog.capture('backend_error', err)
      setStatusCode(500)
      setErrorMessage(err)
      console.error(err)
    });
  }

  const handleSearchClick = (event) => {
    window.history.replaceState(null, "Census GPT", "/?s="  + encodeURIComponent(query))
    posthog.capture('search_clicked', { natural_language_query: query })
    fetchBackend(query)
  }

  const zipcodeFeatures = zipcodes.map((z) => {
    return {
      "type": "Feature",
      "geometry": {
          "type": "Point",
          "coordinates": [z.long, z.lat]
      }
    }
  })

  const citiesFeatures = cities.map((c) => {
    return {
      "type": "Feature",
      "geometry": {
          "type": "Point",
          "coordinates": [c.long, c.lat]
      }
    }
  })

const zipcodeLayerLow =   {
    'id': 'zips-kml',
    'type': 'fill',
    'source': 'zips-kml',
    'minzoom': 5,
    'layout': {
        'visibility': 'visible'
    },
    'paint': {
        'fill-outline-color': 'black',
        'fill-opacity': 0.9,
        'fill-color': "#006AF9"
    },
    'source-layer': 'Layer_0',
    'filter': [
      'in',
      ['get', 'Name'],
      ['literal', zipcodesFormatted],     // Zip code in the feature is formatted like this:  <at><openparen>94105<closeparen>
    ] 
   };

 const zipcodeLayerHigh = {
    'id': 'Zip',
    'type': 'circle',
    'layout': {
        'visibility': 'visible'
    },
    'maxzoom': 8,
    'paint': {
      'circle-radius': 10,
      'circle-color': "#006AF9",
      'circle-opacity': 1,
    }
};

const citiesLayer = {
  'id': 'cities',
  'type': 'circle',
  'layout': {
      'visibility': 'visible'
  },
  'paint': {
    'circle-radius': 18,
    'circle-color': "#006AF9",
    'circle-opacity': 0.8,
  }
};

  return (
    <div className="App">
      <link href="https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css" rel="stylesheet" />
      <div className="overflow-hidden rounded-lg bg-white shadow md:h-screen">
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-4xl font-bold mb-8">Census GPT</h1>
        <div>
          <div className="relative mt-1 flex justify-center">
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
              type="button"
              className="text-white bg-blue-600 focus:ring-4 focus:ring-blue-300 focus:outline-none inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-blue-700 ml-3"
              onClick={handleSearchClick}
            >
              Search
            </button>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 h-full sm:p-6 flex flex-col md:flex-row md:pb-[200px]">
          <div className="rounded-lg overflow-y-scroll max-h-[60vh] md:h-full bg-white shadow flex-grow-[0] w-full mr-8 mb-8">
            <LoadingSpinner isLoading={isLoading}/>
            {sql.length == 0 ? <Examples setQuery={setQuery} handleClick={fetchBackend}/> : <>
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
                <Layer {...zipcodeLayerLow} />
              </Source>
              <Source id="zip-zoomed-out" type="geojson" data={{type: 'FeatureCollection', features: zipcodeFeatures}}>
                <Layer {...zipcodeLayerHigh} />
              </Source>
              <Source id="cities" type="geojson" data={{type: 'FeatureCollection', features: citiesFeatures}}>
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
