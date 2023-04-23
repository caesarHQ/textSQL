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
    <div>
      {tables?.map((table, idx) => {
        return (
          <SingleTableSelection
            table={table}
            setTable={(newTable) => updateTable(idx, newTable)}
            key={idx}
          />
        );
      })}
    </div>
  );
};

const SingleTableSelection = ({ table, setTable }) => {
  return (
    <div className="flex flex-row items-center justify-between w-200px">
      <div onClick={() => setTable({ ...table, active: !table.active })}>
        <input
          type="checkbox"
          name="table"
          checked={table.active}
          onChange={(event) =>
            setTable({ ...table, active: event.target.checked })
          }
        />
        <label className="ml-2" htmlFor="table">
          {table.name}
        </label>
      </div>
    </div>
  );
};
