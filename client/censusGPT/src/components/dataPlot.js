import Plot from 'react-plotly.js'
import { getPlotConfig } from '../utils/plotly-ui-config'


const DataPlot = (props) => {
    let config = getPlotConfig(props.rows, props.cols)

    return (
        <Plot
            data={config.data}
            layout={{ ...config.layout, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent' }}
            style={{ width: '100%', height: '100%' }}
            config={{ responsive: true, displayModeBar: false }}
        />
    );
}

export default DataPlot