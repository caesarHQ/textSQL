// Path: client/src/components/table.js
// Custom components for Table

/**
 * Converts the value to title case
 * @param {string} value – Value to be converted to title case
 * @returns {string} - The converted value
 */
const convertToTitleCase = (value) => {
    // Convert the table header values to title case
    return value
        .split('_')
        .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
        .join(' ')
}

const formatNumber = (value, col) => {
    // Format the number to have commas
    if (col == 'zip_code') {
        // Don't format the zip code
        return value
    }
    if (col.includes('date')) {
        // Don't format the date
        return value
    }
    if (col.includes('time')) {
        // Don't format the time
        return value
    }
    if (col.includes('percentage')) {
        let newValue = value.toString()
        if (newValue.includes('.')) {
            // Round to 2 decimal places
            newValue = newValue.slice(0, newValue.indexOf('.') + 3)
        } else {
            // Add commas if no decimal places
            newValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        }
        newValue = newValue + '%' // Add the percentage sign
        return newValue
    }

    if (!value.toString().includes('.')) {
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    return value
}

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
                        className="py-3.5 pr-3 text-left text-sm font-semibold sticky top-0"
                    >
                        {convertToTitleCase(x)}
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
        <tbody key={Math.random()}>
            {props.values.map((row, i) => (
                <tr key={'row' + i}>
                    {row.map((rowValue, columnIndex) => (
                        <td
                            key={Math.random()}
                            className="whitespace-nowrap py-4 pr-3 text-sm text-left font-medium"
                        >
                            {formatNumber(rowValue, props.columns[columnIndex])}
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
        <div className="dark:bg-dark-800 dark:text-white rounded-lg w-full h-full">
            <div className="flow-root">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle px-6">
                        <table className="min-w-full divide-y divide-dark-300">
                            <TableHeader
                                key={Math.random()}
                                columns={columns}
                            />
                            <TableRows
                                key={Math.random()}
                                columns={columns}
                                values={values}
                            />
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Table
