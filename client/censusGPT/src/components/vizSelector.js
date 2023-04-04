import { BsBarChartLine, BsCodeSquare, BsMap, BsTable } from "react-icons/bs"

export const VizSelector = (props) => {
  let selected = props.selected
  let mapClassName = "relative mt-px inline-flex items-center rounded-t-md sm:rounded-tr-none sm:rounded-l-md px-3 py-2 text-sm font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 hover:bg-gray-100 focus:z-10 " + (selected == 'map' ? 'bg-gray-100 dark:bg-neutral-700' : 'bg-white dark:bg-neutral-600 hover:bg-gray-100 hover:dark:bg-neutral-700')
  let chartClassName = "relative -mt-px sm:mt-px sm:-ml-px inline-flex items-center sm:rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 hover:bg-gray-100 focus:z-10 " + (selected == 'chart' ? 'bg-gray-100 dark:bg-neutral-700' : 'bg-white dark:bg-neutral-600 hover:bg-gray-100 hover:dark:bg-neutral-700')

  return (
    <>
      <div className="hidden sm:block relative right-0 top-0">
        <span className="isolate inline-flex rounded-sm shadow-sm ">
          <button
            type="button"
            className={mapClassName}
            onClick={() => {
              props.setSelected('map')
            }}
          >
            <span className="block sm:hidden"><BsMap /></span>
            <span className="hidden sm:block">Map</span>
          </button>

          <button
            type="button"
            className={chartClassName}
            onClick={() => {
              props.setSelected('chart')
            }}
          >
            <span className="block sm:hidden"><BsBarChartLine /></span>
            <span className="hidden sm:block">Chart</span>
          </button>
        </span>
      </div>

      {/* Mobile Version */}
      <div className="relative right-0 top-0 sm:hidden px-2">
        <span className="isolate inline-flex flex-col shadow-s">
          <button
            type="button"
            className={mapClassName}
            onClick={() => {
              props.setSelected('map')
            }}
          >
            <span className="block sm:hidden"><BsMap /></span>
          </button>

          <button
            type="button"
            className={chartClassName}
            onClick={() => {
              props.viewsCanOpen && props.setSelected('chart')
            }}
          >
            <span className="block sm:hidden"><BsBarChartLine /></span>
          </button>

          <button
            className='relative -mt-px sm:mt-px sm:-ml-px inline-flex items-center px-3 py-2 text-sm font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 focus:z-10 bg-white dark:bg-neutral-600 hover:dark:bg-neutral-700 hover:bg-gray-100'
            onClick={() => props.viewsCanOpen && props.setTableIsOpen(true)}
          >
            <BsTable />
          </button>

          <button
            className='relative -mt-px sm:mt-px sm:-ml-px inline-flex items-center rounded-b-md px-3 py-2 text-sm font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 focus:z-10 bg-white dark:bg-neutral-600 hover:dark:bg-neutral-700 hover:bg-gray-100'
            onClick={() => props.viewsCanOpen && props.setSqlIsOpen(true)}
          >
            <BsCodeSquare />
          </button>
        </span>
      </div>
    </>
  )
}