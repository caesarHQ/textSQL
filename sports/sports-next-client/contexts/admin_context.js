import { createContext, useState, useEffect } from "react";

import {
  fetchCurrentDatabaseCredentials,
  fetchCurrentOpenaiCredentials,
  fetchAllTables,
} from "@/apis/admin_apis";

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [tables, setTables] = useState([]);
  const [enums, setEnums] = useState([]);
  const [dbInfo, setDbInfo] = useState({});
  const [openaiKey, setOpenaiKey] = useState({});

  const loadOpenaiInfo = async () => {
    const data = await fetchCurrentOpenaiCredentials();
    if (data.status === "success") {
      setOpenaiKey({ key: data.OPENAI_API_KEY, added: true });
    }
  };

  const loadDbInfo = async () => {
    const data = await fetchCurrentDatabaseCredentials();
    if (data.status === "success") {
      setDbInfo({ urlString: data.DB_URL });
    }
  };

  const loadTableInfo = async () => {
    const data = await fetchAllTables();
    console.log("tables: ", data);
    if (data.status === "success") {
      setTables(data.tables);
    }
  };

  useEffect(() => {
    loadOpenaiInfo();
    loadDbInfo();
    loadTableInfo();
  }, []);

  return (
    <AdminContext.Provider
      value={{
        tables,
        setTables,
        enums,
        setEnums,
        dbInfo,
        setDbInfo,
        openaiKey,
        setOpenaiKey,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
