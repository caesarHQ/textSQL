import { useState, useEffect } from "react";
import { fetchPlayerData } from "@/apis/sports_apis";
import { PlayerStats } from "./player_stats";

export const PlayerPage = ({ id }) => {
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    const getPlayerData = async () => {
      const playerData = await fetchPlayerData({ id });
      if (playerData.status === "success") {
        setPlayer(playerData.stats);
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
      <h1>Player Page</h1>
      <p>Player ID: {id}</p>
      {player && <PlayerStats playerData={player} />}
    </div>
  );
};
