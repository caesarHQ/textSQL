import DataPlot from "./data_plot";

const DataVisualization = ({ tableInfo }) => {
  return (
    <div className="flex flex-grow h-full w-full relative rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto flex w-full overflow-hidden mb-32">
        <DataPlot cols={tableInfo.columns} rows={tableInfo.rows} />
      </div>
    </div>
  );
};

export default DataVisualization;
