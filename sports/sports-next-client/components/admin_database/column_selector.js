import { useState, useMemo, useRef, useEffect } from "react";
import { ClosableRow } from "../closable_row";
import { generateSchema } from "@/apis/admin_apis";
import { checkForNewColumns } from "@/apis/admin_apis";

export const ColumnSelector = ({ table, setTable }) => {
  const [columnFilterTerm, setColumnFilterTerm] = useState("");

  const tableColumns = table?.columns || [];

  const getUpdatedSchema = async () => {
    const data = await checkForNewColumns({ table });
    if (data?.status === "success") {
      console.log("new columns ", table);
      // setTable(data.table);
    }
  };

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

  const handleGenerateSchema = async () => {
    const data = await generateSchema({ table });
    if (data.status == "success") {
      setTable({ ...table, schema: data.message });
    }
  };

  const schemaRef = useRef(null);
  const schemaText = table?.schema || "";
  useEffect(() => {
    if (schemaRef.current) {
      schemaRef.current.style.height = "auto";
      schemaRef.current.style.height = schemaRef.current.scrollHeight + "px";
      schemaRef.current.style.width = "100%";
    }
  }, [schemaText]);

  return (
    <div className="bg-gray-200 p-4 rounded">
      <ClosableRow title={table.name} startOpen={false} isGood={!!table.schema}>
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
            <div className="flex flex-row ml-4">
              <button
                onClick={getUpdatedSchema}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded active:bg-blue-900"
              >
                Check for updated schema
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

          <div className="flex flex-row">
            <label
              htmlFor="schema"
              className="mr-2 font-bold text-right self-center"
            >
              Table Creation Query
            </label>
            <textarea
              id="schema"
              className="border border-gray-400 p-2 rounded w-64"
              value={table.schema}
              ref={schemaRef}
              onChange={(event) =>
                setTable({ ...table, schema: event.target.value })
              }
              style={{ width: "100%" }}
            />

            {!table.schema && (
              <button
                onClick={() => handleGenerateSchema()}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded active:bg-blue-900 ml-2"
              >
                Generate Schema
              </button>
            )}
          </div>
        </div>
      </ClosableRow>
    </div>
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
