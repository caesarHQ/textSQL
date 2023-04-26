let api_endpoint = "http://localhost:9000";

export const getGames = async ({ month, year }) => {
  let url = api_endpoint + "/games/list";
  if (month && year) {
    url += `?date=${year}-${month}`;
  }
  const resp = await fetch(url)
    .then((response) => response.json())
    .catch((error) => {
      return { error: error };
    });
  return resp;
};

export const getGameById = async ({ game_id }) => {
  const resp = await fetch(api_endpoint + `/games/${game_id}`)
    .then((response) => response.json())
    .catch((error) => {
      return { error: error };
    });
  return resp;
};

export const getGameStatsById = async ({ game_id }) => {
  console.log("getting stas!");
  const resp = await fetch(api_endpoint + `/games/stats/${game_id}`)
    .then((response) => response.json())
    .catch((error) => {
      console.log("error getting stats");
      return { error: error };
    });
  console.log("woo stats", resp);
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
