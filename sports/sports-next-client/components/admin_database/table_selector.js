import { useContext, useState, useMemo } from "react";
import { AdminContext } from "@/contexts/admin_context";

import { handleSaveTables } from "@/apis/admin_apis";

export const TableSelector = () => {
  const [tableFilterTerm, setTableFilterTerm] = useState("");

  const { tables, setTables } = useContext(AdminContext);

  const filteredTables = useMemo(() => {
    if (tableFilterTerm === "") {
      return tables;
    }
    return tables?.filter((table) => {
      return table.name.toLowerCase().includes(tableFilterTerm.toLowerCase());
    });
  }, [tables, tableFilterTerm]);

  const massChangeSelection = (action) => {
    //action is either "select" or "deselect" and it should be over the tables in the filteredTables state
    const newTables = [...tables];
    filteredTables.forEach((table) => {
      const idx = newTables.findIndex((t) => t.name === table.name);
      newTables[idx].active = action === "select";
    });
    setTables(newTables);
  };

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
        {filteredTables?.map((table, idx) => {
          return (
            <div className="pl-0" key={idx}>
              <SingleTableSelection
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

const SingleTableSelection = ({ table, setTable }) => {
  return (
    <div
      onClick={() => setTable({ ...table, active: !table.active })}
      className="flex flex-row cursor-pointer w-80 overflow-x-auto p-2 rounded-md border-2 border-gray-300 h-12 m-2"
    >
      <input
        className="cursor-pointer"
        type="checkbox"
        name="table"
        checked={table.active}
        onChange={(event) =>
          setTable({ ...table, active: event.target.checked })
        }
      />
      <label
        className="ml-2 cursor-pointer whitespace-nowrap overflow-x-auto"
        htmlFor="table"
      >
        {table.name}
      </label>
    </div>
  );
};
