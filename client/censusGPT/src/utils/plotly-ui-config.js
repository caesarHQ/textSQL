/**
 * This file contains the UI configuration for the Plotly UI.
 */

const isGeoColumn = (columnName) => {
    if (columnName == 'zip_code' || columnName == 'city' || columnName == 'state') {
        return true
    }
    return false
}

 export const getPlotConfig = (rows, cols) => {
    let data = []
    let layout = {}

    if (rows.length == 0 || cols.length == 0) {
        return {}
    } else if (rows.length >= 0 && cols.length == 2) {
        // 2 cols, N rows ==> Bar chart
        // Col 0 is X axis, Col 1 is Y axis
        // Example query: "Top 5 cities in CA with the highest crime and what is the total crime in each of those cities"

        data = [
            {
                x: rows.map(x => '\b' + x[0]),  // convert to string. otherwise plotly treats 941002 as 94.1k 
                y: rows.map(x => x[1]),
                type: 'bar',
                marker: { color: '#006AF9' }
            }
        ];

        layout = {
            xaxis: {title: cols[0]},
            yaxis: {title: cols[1]},
        }

    } else if (rows.length == 1 && cols.length >= 1) {
        // N cols, 1 row ==> Bar chart
        // columns is X axis, row 1 is Y axis 
        // Example query: "What is the distribution of different categories of crimes in Dallas, TX"

        data = [
            {
                x: isGeoColumn(cols[0]) ? cols.slice(1) : cols,
                y: isGeoColumn(cols[0]) ? rows[0].slice(1) : rows[0],
                type: 'bar',
                marker: { color: '#006AF9' }
            }
        ];

    } else {
        // N cols, N rows ==> Stacked chart. 
        // column 0 is X axis, column 1 to N is Y axis
        // Example query: "What is the percentage population of asian, black and hispanic people in all zipcodes in san francisco"

        for (let i = 1; i < cols.length; i++) {
            
            // if the column is not a number, don't plot it
            if (typeof rows[0][i] !== 'number') {
                continue
            }

            data.push({
                x: rows.map(x => '\b' + x[0]),  // convert to string. otherwise plotly treats 941002 as 94.1k 
                y: rows.map(x => x[i]),
                name: cols[i],
                type: 'bar'
            })
        }

        layout = {
            barmode: 'stack',
            xaxis: {title: cols[0]},
        }
    }

    layout = document.documentElement.classList.contains('dark') ? {
        ...layout,
        font: { color: '#fff' },
        yaxis: { gridcolor: '#444' }      
    } : {
        ...layout,
        font: { color: '#000' }
    }

    return {data, layout}
}