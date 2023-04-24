import { useContext, useState, useMemo } from "react";
import { AdminContext } from "@/contexts/admin_context";

import { handleSaveTables } from "@/apis/admin_apis";
import { ColumnSelector } from "./column_selector";
import { generateSchema } from "@/apis/admin_apis";

export const TableEditor = () => {
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

  const missingSchemaCount = useMemo(() => {
    return tables.filter((t) => t.active && !t.schema).length;
  }, [tables]);

  const generateRemainingSchemas = async () => {
    const newTables = [...tables];
    for (let i = 0; i < newTables.length; i++) {
      const table = newTables[i];
      console.log("checking table: ", table.name);
      if (table.active) {
        console.log("table is active");
        if (!table.schema) {
          console.log("table has no schema, generating!");
          const newSchemaData = await generateSchema({ table });
          console.log("newSchemaData: ", newSchemaData);
          if (newSchemaData.status === "success") {
            newTables[i].schema = newSchemaData.message;
            setTables([...newTables]);
          }
        }
      }
    }
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
        {missingSchemaCount > 0 && (
          <div className="flex flex-row ml-4">
            <button
              onClick={generateRemainingSchemas}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded active:bg-blue-900"
            >
              Generate Remaining {missingSchemaCount} Schemas:
            </button>
          </div>
        )}
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
