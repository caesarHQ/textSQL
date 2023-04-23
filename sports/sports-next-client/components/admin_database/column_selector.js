import { useContext, useState, useMemo } from "react";
import { AdminContext } from "@/contexts/admin_context";
import { ClosableRow } from "../closable_row";

import { handleSaveTables } from "@/apis/admin_apis";

export const TableColumnSelector = () => {
  const [tableFilterTerm, setTableFilterTerm] = useState("");

  const { tables, setTables } = useContext(AdminContext);

  const filteredTables = useMemo(() => {
    let allowedTables = [];
    if (tableFilterTerm === "") {
      allowedTables = tables;
    } else {
      allowedTables = tables?.filter((table) => {
        return table.name.toLowerCase().includes(tableFilterTerm.toLowerCase());
      });
    }
    //return the tables in alphabetical order
    allowedTables = allowedTables.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    return allowedTables;
  }, [tables, tableFilterTerm]);

  const tableNameLookup = useMemo(() => {
    const lookup = {};
    tables.forEach((table, idx) => {
      lookup[table.name] = idx;
    });
    return lookup;
  }, [tables]);

  const updateTable = (tableName, newTable) => {
    const newTables = [...tables];
    newTables[tableNameLookup[tableName]] = newTable;
    setTables(newTables);
  };

  const handleSave = async () => {
    await handleSaveTables(tables);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-row">
        <div className="flex flex-row">
          <button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded active:bg-blue-900"
          >
            Save
          </button>
        </div>
        <div className="flex flex-row ml-4">
          <label
            htmlFor="tableFilter"
            className="mr-2 font-bold text-right self-center
            "
          >
            Filter:
          </label>
          <input
            type="text"
            id="tableFilter"
            className="border border-gray-400 p-2 rounded w-64"
            value={tableFilterTerm}
            onChange={(event) => setTableFilterTerm(event.target.value)}
          />
        </div>
      </div>
      <div //each table is a row, should be 100% width
        className="flex flex-col space-y-4"
      >
        {filteredTables
          ?.filter((t) => t.active)
          ?.map((table) => {
            return (
              <div className="pl-0" key={table.name}>
                <ColumnSelector
                  table={table}
                  setTable={(newTable) => updateTable(table.name, newTable)}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

const ColumnSelector = ({ table, setTable }) => {
  const [columnFilterTerm, setColumnFilterTerm] = useState("");

  const tableColumns = table?.columns || [];

  const filteredColumns = useMemo(() => {
    if (columnFilterTerm === "") {
      return tableColumns;
    }
    return tableColumns?.filter((column) => {
      return column.name.toLowerCase().includes(columnFilterTerm.toLowerCase());
    });
  }, [tableColumns, columnFilterTerm]);

  const columnLookupDict = useMemo(() => {
    const lookup = {};
    tableColumns.forEach((column, idx) => {
      lookup[column.name] = idx;
    });
    return lookup;
  }, [tableColumns]);

  const massChangeSelection = (action) => {
    //action is either "select" or "deselect" and it should be over the tables in the filteredTables state
    const newColumns = [...tableColumns];
    filteredColumns.forEach((column) => {
      const idx = newColumns.findIndex((t) => t.name === column.name);
      newColumns[idx].active = action === "select";
    });
    setTable({ ...table, columns: newColumns });
  };

  const updateColumn = (columnName, newColumn) => {
    const newTable = [...tableColumns];
    newTable[columnLookupDict[columnName]] = newColumn;
    setTable({ ...table, columns: newTable });
  };

  return (
    <ClosableRow title={table.name} startOpen={false}>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-row">
          <div className="flex flex-row ml-4">
            <label
              htmlFor="tableFilter"
              className="mr-2 font-bold text-right self-center
          "
            >
              Filter:
            </label>
            <input
              type="text"
              id="tableFilter"
              className="border border-gray-400 p-2 rounded w-64"
              value={columnFilterTerm}
              onChange={(event) => setColumnFilterTerm(event.target.value)}
            />
          </div>
          <div className="flex flex-row ml-4">
            <button
              onClick={() => massChangeSelection("select")}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded active:bg-blue-900"
            >
              Select All
            </button>
            <button
              onClick={() => massChangeSelection("deselect")}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded active:bg-blue-900 ml-2"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div
          //this can be multiple columns/rows, max width is 100%, even columns of 230px
          className="flex flex-row flex-wrap"
        >
          {filteredColumns?.map((column) => {
            return (
              <div className="pl-0" key={column.name}>
                <SingleColumnSelector
                  column={column}
                  setColumns={(newColumn) =>
                    updateColumn(column.name, newColumn)
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </ClosableRow>
  );
};

const SingleColumnSelector = ({ column, setColumns }) => {
  return (
    <div
      onClick={() => setColumns({ ...column, active: !column.active })}
      className="flex flex-row cursor-pointer w-80 overflow-x-auto p-2 rounded-md border-2 border-gray-300 h-12 m-2"
    >
      <input
        className="cursor-pointer"
        type="checkbox"
        name="table"
        checked={column.active}
        onChange={(event) =>
          setColumns({ ...column, active: event.target.checked })
        }
      />
      <label
        className="ml-2 cursor-pointer whitespace-nowrap overflow-x-auto"
        htmlFor="table"
      >
        {column.name}
      </label>
    </div>
  );
};
