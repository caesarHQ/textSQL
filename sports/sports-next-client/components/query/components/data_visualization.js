import DataPlot from "./data_plot";
import ShotChart from "../../nba/shot_chart";

const DataVisualization = ({ tableInfo }) => {

  const xLegacyIndex = tableInfo.columns.indexOf("x_legacy");
  const yLegacyIndex = tableInfo.columns.indexOf("y_legacy");
  const descriptionIndex = tableInfo.columns.indexOf("description");
  const shotResultIndex = tableInfo.columns.indexOf("shot_result");
  const shotsData = [];
  if (xLegacyIndex !== -1 && yLegacyIndex !== -1 && descriptionIndex !== -1 && shotResultIndex !== -1) {
    for (const row of tableInfo.rows) {
      shotsData.push({
        x_legacy: row[xLegacyIndex],
        y_legacy: row[yLegacyIndex],
        description: row[descriptionIndex],
        shot_result: row[shotResultIndex],
      })
    }
  }

  return (
    <>
      <div className="flex flex-grow h-full w-full relative rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto flex w-full overflow-hidden mb-32">
          <DataPlot cols={tableInfo.columns} rows={tableInfo.rows} />
        </div>
      </div>
      {
        shotsData.length ?
        (
          <div className="flex flex-grow h-full w-full relative rounded-lg shadow overflow-hidden">
            <ShotChart shotsData={shotsData}/>
          </div>
        )
        :
        null
      }
    </>
  );
};

export default DataVisualization;
