const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:9000";
const IS_LOCALHOST = API_BASE.includes("localhost");

export const fetchCurrentDatabaseCredentials = async () => {
  const response = await fetch(`${API_BASE}/db_auth`);
  const data = await response.json();
  return data;
};

export const fetchCurrentOpenaiCredentials = async () => {
  const response = await fetch(`${API_BASE}/openai_auth`);
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
