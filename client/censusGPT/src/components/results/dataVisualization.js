import mapboxgl from 'mapbox-gl'
import Map, { Layer, Source } from 'react-map-gl'

import DataPlot from '../dataPlot'
import { VizSelector } from '../vizSelector'
import { FEATURE_FLAGS } from '../../featureFlags'

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

mapboxgl.Map.prototype.toImage = function (width, height, callback) {
    const originalWidth = this.getCanvas().width
    const originalHeight = this.getCanvas().height

    const originalStyleWidth = this.getCanvas().style.width
    const originalStyleHeight = this.getCanvas().style.height

    this.getCanvas().width = width
    this.getCanvas().height = height
    this.getCanvas().style.width = `${width}px`
    this.getCanvas().style.height = `${height}px`

    this.once('render', () => {
        setTimeout(() => {
            const imgData = this.getCanvas().toDataURL('image/png')
            this.getCanvas().width = originalWidth
            this.getCanvas().height = originalHeight
            this.getCanvas().style.width = originalStyleWidth
            this.getCanvas().style.height = originalStyleHeight
            this.resize()
            callback(imgData)
        }, 100)
    })

    this.resize()
    this._renderTaskQueue.run()
}

export const DataVisualization = ({
    visualization,
    setVisualization,
    mobileTableRef,
    mobileSqlRef,
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
    const handleDownloadMap = async () => {
        const downloadButton = document.querySelector('#downloadButton')
        downloadButton.disabled = true

        const map = mapRef.current.getMap()
        map.toImage(250, 250, (imgData) => {
            const link = document.createElement('a')
            link.href = imgData
            link.download = 'map.png'
            link.click()

            // Re-enable the download button after the download has finished.
            downloadButton.disabled = false
        })
    }

    return (
        <div className="flex flex-grow h-full w-full relative rounded-lg shadow overflow-hidden">
            <div className="absolute top-0 right-0 z-10 p-1">
                <VizSelector
                    selected={visualization}
                    setSelected={setVisualization}
                    tableRef={mobileTableRef}
                    sqlRef={mobileSqlRef}
                    viewsCanOpen={sql.length}
                />
            </div>
            <div className="overflow-hidden rounded-lg shadow flex-grow-[2] min-h-[70vh] w-full h-full relative">
                {visualization == 'map' ? (
                    <>
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
                                props.version === 'San Francisco' ? 11.5 : 0
                            }
                            preserveDrawingBuffer={true}
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
                        {FEATURE_FLAGS.downloadButton && (
                            <div className="absolute bottom-0 right-0 p-2">
                                <button
                                    id="downloadButton"
                                    className="px-3 py-2 text-white bg-blue-500 rounded-md shadow hover:bg-blue-600"
                                    onClick={handleDownloadMap}
                                >
                                    Download Map as PNG
                                </button>
                            </div>
                        )}
                    </>
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
