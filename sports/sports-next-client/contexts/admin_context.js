import { createContext, useState, useEffect } from "react";

import {
  fetchCurrentDatabaseCredentials,
  fetchCurrentOpenaiCredentials,
  fetchAllTables,
  fetchCurrentPineconeCredentials,
} from "@/apis/admin_apis";

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [tableNames, setTableNames] = useState([]);
  const [tables, setTables] = useState([]);
  const [enums, setEnums] = useState([]);
  const [dbInfo, setDbInfo] = useState({});
  const [openaiKey, setOpenaiKey] = useState({});
  const [pineconeKey, setPineconeKey] = useState({});

  const adminEnabled = process.env.NEXT_PUBLIC_ADMIN === "enabled";

  const loadOpenaiInfo = async () => {
    const data = await fetchCurrentOpenaiCredentials();
    if (data.status === "success") {
      setOpenaiKey({ key: data.OPENAI_API_KEY, added: true });
    }
  };

  const loadPineconeInfo = async () => {
    const data = await fetchCurrentPineconeCredentials();
    console.log("pinecone: ", data);
    if (data.status === "success") {
      setPineconeKey({
        key: data.PINECONE_KEY,
        index: data.PINECONE_INDEX,
        env: data.PINECONE_ENV,
        added: true,
      });
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
    loadPineconeInfo();
  }, []);

  return (
    <AdminContext.Provider
      value={{
        adminEnabled,
        tables,
        setTables,
        enums,
        setEnums,
        dbInfo,
        setDbInfo,
        openaiKey,
        setOpenaiKey,
        tableNames,
        setTableNames,
        pineconeKey,
        setPineconeKey,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
