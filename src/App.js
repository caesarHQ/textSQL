import React, { useState, useRef, useEffect } from 'react';
// eslint-disable-next-line import/no-webpack-loader-syntax
import mapboxgl from '!mapbox-gl';
import './App.css';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoicmFodWwtY2Flc2FyaHEiLCJhIjoiY2xlb2w0OG85MDNoNzNzcG5kc2VqaGR3dCJ9.mhsdkiyqyI5jLgy8TKYavg';
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-122.431297);
  const [lat, setLat] = useState(37.773972);
  const [zoom, setZoom] = useState(3.5);
  const [query, setQuery] =  useState('');
  const [sql, setSQL] = useState('');
  const [zipcodesFormatted, setZipcodesFormatted] = useState([]);

  const handleSearchChange = (event) => {
    const { value } = event.target;
    console.log(value);
    setQuery(value);
  }

  const getZipcodesMapboxFormatted = (result) => {
    let a = result.map(x => "<at><openparen>" + x[0] + "<closeparen>")

    console.log("A", a)

    return a
  }

  const handleSearchClick = (event) => {
    console.log("Search is clicked")
    const options = {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: '{"natural_language_query":"' + query + '"}'
    };
    
    fetch('https://ama-api.onrender.com/api/text_to_sql', options)
      .then(response => response.json())
      .then(response => {
        setSQL(response.sql_query)
        console.log(response)
       
        setZipcodesFormatted(x => [...x, getZipcodesMapboxFormatted(response.result)])
        setTimeout( () => console.log("NEW FORMATTED ZIPS", zipcodesFormatted), 2000)
      })
      .catch(err => console.error(err));
  }

  let zipcodes_to_render_str = ["<at><openparen>94102<closeparen>", "<at><openparen>94103<closeparen>", "<at><openparen>94105<closeparen>", "<at><openparen>94107<closeparen>", "<at><openparen>94108<closeparen>", "<at><openparen>94109<closeparen>", "<at><openparen>94111<closeparen>"];
   

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [lng, lat],
      zoom: zoom,
      minZoom: 3,
      projection: 'albers'
    });

    // DO NOT REMOVE

    // let zipcodes_to_render_int = [94102, 94103, 94105, 94107, 94108, 94109, 94111];

    // let zipcodes_to_render_str = ["94102", "94103", "94105", "94107", "94108", "94109", "94111"];


    // Zipcode in the feature are formatting like  "<at><openparen>94102<closeparen>"
   
   // let zipcodes_to_render_str_2 = ["<at><openparen>94102<closeparen>", "<at><openparen>94103<closeparen>", "<at><openparen>94105<closeparen>", "<at><openparen>94107<closeparen>", "<at><openparen>94108<closeparen>", "<at><openparen>94109<closeparen>", "<at><openparen>94111<closeparen>"];

    map.current.on('load', function () {
      console.log("LOAD is called!")

      map.current.addSource('zips-kml', {
        type: 'vector',
        url: 'mapbox://darsh99137.4nf1q4ec'
      });

      map.current.addLayer({
        'id': 'zips-kml',
        'type': 'fill',
        'source': 'zips-kml',
        'minzoom': 3,
        'layout': {
            'visibility': 'visible'
        },
        'paint': {
            'fill-outline-color': 'black',
            'fill-opacity': 0.65,
            'fill-color': "#F00"
        },
        'source-layer': 'Layer_0',
        'filter': [
          'in',
          ['get', 'Name'],
          ['literal', zipcodesFormatted],     // Zip code in the feature is formatted like this:  <at><openparen>94105<closeparen>
        ] 
       });



      /*   DO NOT REMOVE

     //  Use this for overlaying zipcode numbers on each of the zip codes



      var zips_tiles = {
        'ac-zips': {
            'source-layer': 'ac-b0n2k5',
            'url': 'darsh99137.67h8ttal',
        },
        'nopr-zips': {
            'source-layer': 'nopr-aab0hu',
            'url': 'darsh99137.4a95ht04',
        },
        'stuv-zips': {
            'source-layer': 'stuv-bdvekc',
            'url': 'darsh99137.4qk2dlxt',
        },
        'klm-zips': {
            'source-layer': 'klm-1cyylf',
            'url': 'darsh99137.c10a4dg9',
        },
        'dfghi-zips': {
            'source-layer': 'dfghi-9jmprs',
            'url': 'darsh99137.45692mm0',
        },
        'w-zips': {
            'source-layer': 'w-6rljid',
            'url': 'darsh99137.4c878s8r',
        }
    };
    var zip_labels = [];
    Object.keys(zips_tiles).map(function (key) {
      map.current.addSource(key, {
          type: 'vector',
          url: 'mapbox://' + zips_tiles[key]['url']
      });
      map.current.addLayer({
          'id': key + '-label',
          'type': 'symbol',
          'source': key,
          'minzoom': 5,
          'layout': {
              'visibility': 'visible',
              'text-field': '{ZCTA5CE10}'
          },
          'source-layer': zips_tiles[key]['source-layer']
      });
      zip_labels.push(key + '-label');
  });

  */

  /*    DO NOT REMOVE

       // Use this for hella zoomed coloring of zipcodes

      // Might need to check the filter againg


      map.current.addSource('zips', {
        type: 'vector',
        url: 'mapbox://jn1532.2z2q31r2'
      });

       map.current.addLayer({
        'id': 'Zip',
        'type': 'fill',
        'source': 'zips',
        'layout': {
            'visibility': 'visible'
        },
        'minzoom': 2,
        'maxzoom': 8,
        'paint': {
            'fill-outline-color': '#696969',
            'fill-color': "#F00",
            'fill-opacity': .65
        },
        'source-layer': 'zip5_topo_color-2bf335'
    },
    'water' /// 'water'   helps the transparency
    );
    */

    })



/* DO NOT REMOVE

Use this to find out what feature info is pulled for each zipcode from the vector tiles

    map.current.on('mousemove', function (e) {
      var features = map.current.queryRenderedFeatures(e.point, {
          layers:  ['Zip', 'zips-kml']
      });
      if (features.length > 0) {
        console.log("\n\nFEATURES => ", features)
          if (features[0].layer.id == 'Zip') {
            console.log("ZIP5", features[0].properties.ZIP5)
          } else if (features[0].layer.id == 'zips-kml') {
            console.log("ZIPS-KMLLLL", features[0].properties.Name)
            console.log("ZIPS-KML", features[0].properties.Name.replace(/^\D+/g, '').split("<closeparen>")[0])
            console.log("TYYPE>>>", typeof features[0].properties.Name.replace(/^\D+/g, ''));
            
          } else {
            console.log("ZCTAE10", features[0].properties.ZCTA5CE10)
          }

      } else {
          // document.getElementById('pd').innerHTML = '<p>Hover over a state!</p>';
      }
  });

  */

  });

  return (
    <div className="App">
      <link href="https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css" rel="stylesheet" />
      <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-4xl font-bold mb-8">Census GPT</h1>
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <div className="relative mt-1 flex items-center">
            <input
              type="text"
              name="search"
              id="search"
              className="block w-1/2 rounded-md border-gray-300 pr-12 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={query}
              onChange={handleSearchChange}
            />
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ml-2"
              onClick={handleSearchClick}
            >
              Search
            </button>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-5 sm:p-6 flex">
          <div className="overflow-hidden rounded-lg bg-white shadow w-2/5">
          <div className="p-4">
            <pre className="bg-gray-100 rounded-md p-2 overflow-auto"><code className="text-sm text-gray-800 language-sql">{sql}</code></pre>
          </div>
          </div>
          <div className="overflow-hidden rounded-lg bg-white shadow w-3/5">
            <div className="px-4 py-5 sm:p-6"><div ref={mapContainer} className="map-container" /></div>
          </div>
      </div>
    </div>
  </div>
  );
}

export default App;
