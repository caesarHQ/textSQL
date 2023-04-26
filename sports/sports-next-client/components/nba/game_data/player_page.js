import { useState, useEffect } from "react";
import { fetchPlayerData } from "@/apis/admin_apis";

export const PlayerPage = ({ id }) => {
  const [player, setPlayer] = useState({});

  useEffect(() => {
    const getPlayerData = async () => {
      const playerData = await fetchPlayerData({ id });
      if (playerData.status === "success") {
        setPlayer(playerData.player);
      }
    };
    getPlayerData();
  }, []);

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
      {JSON.stringify(player)}
    </div>
  );
};
