const ADMIN_BASE_API =
  (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:9000") + "/admin";
export const IS_LOCALHOST = ADMIN_BASE_API.includes("localhost");

export const fetchCurrentDatabaseCredentials = async () => {
  const response = await fetch(`${ADMIN_BASE_API}/db_auth`);
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
  const response = await fetch(`${ADMIN_BASE_API}/db_auth`, {
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
  const response = await fetch(`${ADMIN_BASE_API}/openai_auth`);
  const data = await response.json();
  return data;
};

export const verifyOpenaiCredentials = async (openai_key) => {
  const response = await fetch(`${ADMIN_BASE_API}/openai_auth`, {
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
  const response = await fetch(`${ADMIN_BASE_API}/pinecone_auth`);
  const data = await response.json();
  return data;
};

export const verifyPineconeCredentials = async ({ key, index, env }) => {
  const response = await fetch(`${ADMIN_BASE_API}/pinecone_auth`, {
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
  const response = await fetch(`${ADMIN_BASE_API}/tables`);
  const data = await response.json();
  return data;
};

export const handleSaveTables = async (tables) => {
  const response = await fetch(`${ADMIN_BASE_API}/tables`, {
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

export const checkForNewTables = async () => {
  const response = await fetch(`${ADMIN_BASE_API}/refresh_available_tables`);
  const data = await response.json();
  return data;
};

export const checkForNewColumns = async ({ table }) => {
  const response = await fetch(
    `${ADMIN_BASE_API}/refresh_available_columns/${table.name}`
  );
  const data = await response.json();
  return data;
};

export const generateSchema = async ({ table }) => {
  const response = await fetch(`${ADMIN_BASE_API}/generate_schema`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(table),
  });
  const data = await response.json();
  return data;
};

export const saveExample = async ({ example }) => {
  const response = await fetch(`${ADMIN_BASE_API}/examples`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ example }),
  });
  const data = await response.json();
  return data;
};

export const listExamples = async () => {
  const response = await fetch(`${ADMIN_BASE_API}/examples`);
  const data = await response.json();
  return data;
};
