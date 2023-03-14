export const VizSelector = (props) => {
  let selected = props.selected

  let mapClassName = "relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 hover:bg-gray-100 focus:z-10 " + (selected == 'map' ? 'bg-gray-100 dark:bg-neutral-700' : 'bg-white dark:bg-neutral-600 hover:bg-gray-100 hover:dark:bg-neutral-700')

  let chartClassName = "relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 hover:bg-gray-100 focus:z-10 " + (selected == 'chart' ? 'bg-gray-100 dark:bg-neutral-700' : 'bg-white dark:bg-neutral-600 hover:bg-gray-100 hover:dark:bg-neutral-700')

  console.log("VIZ =>", chartClassName)
  return (
    <div className="absolute top-0 right-0 m-1">
      <span className="isolate inline-flex rounded-sm shadow-sm ">
        <button
          type="button"
          className={mapClassName}
          onClick={() => {
            console.log("Map clicked")
            props.setSelected('map')
          }}
        >
          Map
        </button>
        <button
          type="button"
          className={chartClassName}
          onClick={() => {
            console.log("Chart clicked")
            props.setSelected('chart')
          }}
        >
          Chart
        </button>
      </span>
    </div>
  )
}