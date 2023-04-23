import { useContext } from "react";
import { AdminContext } from "@/contexts/admin_context";

export const TableSelector = () => {
  const { tables } = useContext(AdminContext);

  return <div>{JSON.stringify(tables)}</div>;
};
