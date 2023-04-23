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
