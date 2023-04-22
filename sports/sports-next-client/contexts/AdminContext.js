import { createContext, useState } from "react";

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [tables, setTables] = useState([]);
  const [enums, setEnums] = useState([]);
  const [dbInfo, setDbInfo] = useState({});
  const [openaiInfo, setOpenaiInfo] = useState({});

  return (
    <AdminContext.Provider
      value={{
        tables,
        setTables,
        enums,
        setEnums,
        dbInfo,
        setDbInfo,
        openaiInfo,
        setOpenaiInfo,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
