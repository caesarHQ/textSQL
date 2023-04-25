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

export const getTeamDict = async () => {
  const resp = await fetch(api_endpoint + "/games/teams")
    .then((response) => response.json())
    .catch((error) => {
      return { error: error };
    });
  return resp;
};

export const getBoxScore = async ({ game_ids }) => {
  const resp = await fetch(api_endpoint + "/games/boxscores", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      game_ids: game_ids,
    }),
  })
    .then((response) => response.json())
    .catch((error) => {
      return { error: error };
    });
  return resp;
};
