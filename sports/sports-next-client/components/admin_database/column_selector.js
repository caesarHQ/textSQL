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
    return allowedTables.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
  }, [tables, tableFilterTerm]);

  const updateTable = (idx, newTable) => {
    const newTables = [...tables];
    newTables[idx] = newTable;
    setTables(newTables);
  };

  const handleSave = async () => {
    const data = await handleSaveTables(tables);
    console.log("data: ", data);
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
          ?.map((table, idx) => {
            return (
              <div className="pl-0" key={table.name}>
                <ColumnSelector
                  table={table}
                  setTable={(newTable) => updateTable(idx, newTable)}
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

  const massChangeSelection = (action) => {
    //action is either "select" or "deselect" and it should be over the tables in the filteredTables state
    const newColumns = [...tableColumns];
    filteredColumns.forEach((column) => {
      const idx = newColumns.findIndex((t) => t.name === column.name);
      newColumns[idx].active = action === "select";
    });
    setTable({ ...table, columns: newColumns });
  };

  const updateColumn = (idx, newColumn) => {
    const newTable = [...tableColumns];
    newTable[idx] = newColumn;
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
          {filteredColumns?.map((column, idx) => {
            return (
              <div className="pl-0" key={idx}>
                <SingleColumnSelector
                  column={column}
                  setColumns={(newTable) => updateColumn(idx, newTable)}
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
