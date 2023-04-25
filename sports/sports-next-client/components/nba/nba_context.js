import { createContext, useState, useEffect } from "react";
import { getTeamDict, getBoxScore } from "@/apis/sports_apis";

export const NbaContext = createContext();

export const NbaProvider = ({ children }) => {
  const [teamLookup, setTeamLookup] = useState({});
  const [currentGames, setCurrentGames] = useState([]);
  const [boxScores, setBoxScores] = useState({});

  const updateTeamLookup = async () => {
    const newTeamLookup = await getTeamDict();
    if (newTeamLookup.status === "success") {
      setTeamLookup(newTeamLookup.teams);
    }
  };

  const updateBoxScores = async () => {
    const newBoxScores = await getBoxScore({
      game_ids: currentGames.map((game) => game.game_id),
    });
    if (newBoxScores.status === "success") {
      setBoxScores(newBoxScores.boxscores);
    }
  };

  useEffect(() => {
    updateBoxScores();
  }, [currentGames]);

  useEffect(() => {
    updateTeamLookup();
  }, []);

  return (
    <NbaContext.Provider
      value={{
        teamLookup,
        setTeamLookup,
        currentGames,
        setCurrentGames,
        boxScores,
        setBoxScores,
      }}
    >
      {children}
    </NbaContext.Provider>
  );
};
