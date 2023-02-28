import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import './App.css';

mapboxgl.accessToken = 'pk.eyJ1IjoicmFodWwtY2Flc2FyaHEiLCJhIjoiY2xlb2w0OG85MDNoNzNzcG5kc2VqaGR3dCJ9.mhsdkiyqyI5jLgy8TKYavg';

function SearchForm() {
  const [query, setQuery] =  useState('');

  return (
    <form onSubmit={() => {}} style={{'paddingTop': 300}}>
      <label>
        Query:
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} />
      </label>
      <input type="submit" value="Submit" />
    </form>
  );
}

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [zoom, setZoom] = useState(9);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [lng, lat],
      zoom: zoom
    });
  });

  return (
    <div className="App">
      <h2 style={{'paddingTop': 200}}> Census GPT </h2>
      <SearchForm />
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default App;
