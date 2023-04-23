import { useContext } from "react";
import { AdminContext } from "@/contexts/admin_context";

export const TableSelector = () => {
  const { tables, setTables } = useContext(AdminContext);

  const updateTable = (idx, newTable) => {
    const newTables = [...tables];
    newTables[idx] = newTable;
    setTables(newTables);
  };

  return (
    <div
      //this can be multiple columns/rows, max width is 100%, even columns of 230px
      className="flex flex-row flex-wrap"
    >
      {tables?.map((table, idx) => {
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
