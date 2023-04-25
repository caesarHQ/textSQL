let api_endpoint = "http://localhost:9000";

export const getGames = async ({ month, year }) => {
  //get request that takes optional YYYY-MM date arg for a 1 month range
  let url = api_endpoint + "/games/list";
  if (month && year) {
    url += `?date=${year}-${month}`;
  }
  const resp = await fetch(url)
    .then((response) => response.json())
    .catch((error) => {
      return { error: error };
    });
  console.log("resp: ", resp);
  return resp;
};
