const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:9000";
export const IS_LOCALHOST = API_BASE.includes("localhost");

export const fetchCurrentDatabaseCredentials = async () => {
  const response = await fetch(`${API_BASE}/db_auth`);
  const data = await response.json();
  return data;
};

export const verifyDatabaseCredentials = async ({
  host,
  database,
  username,
  password,
  port,
}) => {
  const response = await fetch(`${API_BASE}/db_auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      host,
      database,
      username,
      password,
      port,
    }),
  });
  const data = await response.json();
  return data;
};

export const fetchCurrentOpenaiCredentials = async () => {
  const response = await fetch(`${API_BASE}/openai_auth`);
  const data = await response.json();
  return data;
};

export const verifyOpenaiCredentials = async (openai_key) => {
  const response = await fetch(`${API_BASE}/openai_auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      OPENAI_API_KEY: openai_key,
    }),
  });
  const data = await response.json();
  return data;
};

export const fetchCurrentPineconeCredentials = async () => {
  const response = await fetch(`${API_BASE}/admin/pinecone_auth`);
  const data = await response.json();
  return data;
};

export const verifyPineconeCredentials = async ({ key, index, env }) => {
  const response = await fetch(`${API_BASE}/admin/pinecone_auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      index,
      env,
    }),
  });
  const data = await response.json();
  return data;
};

export const fetchAllTables = async () => {
  const response = await fetch(`${API_BASE}/admin/tables`);
  const data = await response.json();
  return data;
};

export const handleSaveTables = async (tables) => {
  const response = await fetch(`${API_BASE}/admin/tables`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tables,
    }),
  });
  const data = await response.json();
  return data;
};

export const generateSchema = async ({ table }) => {
  const response = await fetch(`${API_BASE}/admin/generate_schema`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(table),
  });
  const data = await response.json();
  return data;
};
