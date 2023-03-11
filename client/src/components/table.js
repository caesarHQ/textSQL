// Path: client/src/components/table.js
// Custom components for Table

/**
 * Generates the table header
 * @param {object} props - The table columns data
 * @returns {JSX.Element} – The table header component
 */
const TableHeader = (props) => {
    return (
        <thead>
            <tr>
                {props.columns.map((x) => (
                    <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                    >
                        {x}
                    </th>
                ))}
            </tr>
        </thead>
    )
}

/**
 * Generates the table rows
 * @param {object} props - The table rows data
 * @returns {JSX.Element} – The table rows component
 */
const TableRows = (props) => {
    return (
        <tbody key={Math.random()} className="divide-y divide-gray-200">
            {props.values.map((row, i) => (
                <tr key={'row' + i}>
                    {row.map((rowValue) => (
                        <td
                            key={Math.random()}
                            className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-left font-medium text-gray-900 sm:pl-0"
                        >
                            {rowValue}
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    )
}

/**
 * Generates the Table component
 * @param {*} props - The table columns and rows data
 * @returns {JSX.Element} – The table component
 */
const Table = (props) => {
    let columns = props.columns
    let values = props.values

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="mt-8 flow-root">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-300">
                            <TableHeader
                                key={Math.random()}
                                columns={columns}
                            />
                            <TableRows key={Math.random()} values={values} />
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Table
