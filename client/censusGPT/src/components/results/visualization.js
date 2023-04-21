import mapboxgl from 'mapbox-gl'
import Map, { Layer, Source } from 'react-map-gl'

import DataPlot from '../dataPlot'
import { VizSelector } from '../vizSelector'

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
} from '../../utils/mapbox-ui-config'

// The following is required to stop "npm build" from transpiling mapbox code.
// notice the exclamation point in the import.
// @ts-ignore
// prettier-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax, import/no-unresolved
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

export const ResultsContainer = ({
    visualization,
    setVisualization,
    mobileTableRef,
    setMobileTableIsOpen,
    mobileSqlRef,
    setMobileSqlIsOpen,
    mapRef,
    initialView,
    zipcodes,
    zipcodesFormatted,
    cities,
    polygonsGeoJSON,
    tableInfo,
    points,
    sql,
    props,
}) => {
    return (
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
                        minZoom={props.version === 'San Francisco' ? 11.5 : 0}
                    >
                        <Source
                            id="zips-kml"
                            type="vector"
                            url="mapbox://darsh99137.4nf1q4ec"
                        >
                            <Layer {...zipcodeLayerLow(zipcodesFormatted)} />
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
                        <Source
                            id="points"
                            type="geojson"
                            data={{
                                type: 'FeatureCollection',
                                features: pointsFeatures(points),
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
    )
}
