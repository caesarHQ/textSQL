import { useState, useEffect } from "react";
import { fetchPlayerData } from "@/apis/sports_apis";
import { PlayerStats } from "./player_stats";
import { PlayerGameTable } from "./player_game_table";

export const PlayerPage = ({ id }) => {
  const [player, setPlayer] = useState(null);
  const [games, setGames] = useState(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    const getPlayerData = async () => {
      const playerData = await fetchPlayerData({ id });
      if (playerData.status === "success") {
        console.log("player data: ", playerData);
        setPlayer(playerData.stats);
        setGames(playerData.recent_games);
      }
    };
    getPlayerData();
  }, [id]);

  return (
    <div
      className="flex flex-col"
      style={{
        height: "100vh",
        justifyContent: "flex-start",
      }}
    >
      <div className="flex w-full">
        <div className="flex flex-col items-center justify-center w-full h-9 text-white bg-blue-500">
          {player && player.name}
        </div>
      </div>
      {player && <PlayerStats playerData={player} />}
      {games && <PlayerGameTable games={games} />}
    </div>
  );
};
