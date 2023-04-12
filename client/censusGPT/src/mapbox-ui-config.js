/**
 * This file contains the UI configuration for the mapbox UI.
 */

export const zipcodeFeatures = (zipcodes) => {
    return zipcodes.map((z) => {
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [z.long, z.lat],
            },
        }
    })
}

export const citiesFeatures = (cities) => {
    return cities.map((c) => {
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [c.long, c.lat],
            },
        }
    })
}

export const zipcodeLayerLow = (zipcodesFormatted) => {
    return {
        id: 'zips-kml',
        type: 'fill',
        source: 'zips-kml',
        minzoom: 5,
        layout: {
            visibility: 'visible',
        },
        paint: {
            'fill-outline-color': 'black',
            'fill-opacity': 0.9,
            'fill-color': '#006AF9',
        },
        'source-layer': 'Layer_0',
        filter: [
            'in',
            ['get', 'Name'],
            ['literal', zipcodesFormatted], // Zip code in the feature is formatted like this:  <at><openparen>94105<closeparen>
        ],
    }
}

export const zipcodeLayerHigh = {
    id: 'Zip',
    type: 'circle',
    layout: {
        visibility: 'visible',
    },
    maxzoom: 8,
    paint: {
        'circle-radius': 10,
        'circle-color': '#006AF9',
        'circle-opacity': 1,
    },
}

export const citiesLayer = {
    id: 'cities',
    type: 'circle',
    layout: {
        visibility: 'visible',
    },
    paint: {
        'circle-radius': 18,
        'circle-color': '#006AF9',
        'circle-opacity': 0.8,
    },
}

export const polygonsLayer = {
    id: 'polygons',
    type: 'fill',
    source: "polygons",
    layout: {
        visibility: 'visible',
    },
    paint: {
        'fill-outline-color': 'black',
        'fill-color': '#006AF9',
        'fill-opacity': 0.8,
    },
}

export const pointsFeatures = (points) => {
    return points.map((p) => {
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [p.long, p.lat],
            },
        }
    })
}

export const pointsLayer = {
    id: 'points',
    type: 'circle',
    layout: {
        visibility: 'visible',
    },
    paint: {
        'circle-radius': 5,
        'circle-color': '#006AF9',
        'circle-opacity': 0.8,
    },
}