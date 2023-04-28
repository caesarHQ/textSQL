let api_endpoint = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:9000";

export const textToSql = async (natural_language_query) => {
  let requestBody = {
    natural_language_query,
    scope: "sports",
  };

  // Set the options for the fetch request
  const options = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody),
  };

  const resp = await fetch(api_endpoint + "/text_to_sql_streaming", options)
    .then((response) => {
      if (response.ok) {
        return { body: response.body, status: "success" };
      }
    })
    .catch((error) => {
      return { error: error, status: "failure" };
    });

  return resp;
};
