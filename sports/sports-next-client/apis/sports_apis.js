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
  const resp = await fetch(api_endpoint + `/games/team_stats/${game_id}`)
    .then((response) => response.json())
    .catch((error) => {
      console.log("error getting stats");
      return { error: error };
    });
  return resp;
};

export const getPlayerGameStatsById = async ({ game_id }) => {
  const resp = await fetch(api_endpoint + `/games/player_stats/${game_id}`)
    .then((response) => response.json())
    .catch((error) => {
      console.log("error getting player stats");
      return { error: error };
    });
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

export const fetchPlayerData = async ({ id }) => {
  const response = await fetch(api_endpoint + `/games/player_data/${id}`);
  const data = await response.json();
  console.log("dat: ", data);
  return data;
};
