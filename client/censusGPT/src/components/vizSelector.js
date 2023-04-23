export const VizSelector = (props) => {
    let selected = props.selected
    let mapClassName =
        'relative mt-px inline-flex items-center rounded-t-md rounded-tr-none rounded-l-md px-3 py-2 text-sm font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 hover:bg-gray-100 focus:z-10 ' +
        (selected == 'map'
            ? 'bg-gray-100 dark:bg-neutral-700'
            : 'bg-white dark:bg-neutral-600 hover:bg-gray-100 hover:dark:bg-neutral-700')
    let chartClassName =
        'relative mt-px -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 hover:bg-gray-100 focus:z-10 ' +
        (selected == 'chart'
            ? 'bg-gray-100 dark:bg-neutral-700'
            : 'bg-white dark:bg-neutral-600 hover:bg-gray-100 hover:dark:bg-neutral-700')

    return (
        <>
            <div className="block relative right-0 top-0">
                <span className="isolate inline-flex rounded-sm shadow-sm ">
                    <button
                        type="button"
                        className={mapClassName}
                        onClick={() => {
                            props.setSelected('map')
                        }}
                    >
                        <span>Map</span>
                    </button>

                    <button
                        type="button"
                        className={chartClassName}
                        onClick={() => {
                            props.setSelected('chart')
                        }}
                    >
                        <span>Chart</span>
                    </button>
                </span>
            </div>
        </>
    )
}
