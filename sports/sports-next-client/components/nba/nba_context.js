import { createContext, useState, useEffect } from "react";
import { getTeamDict } from "@/apis/sports_apis";

export const NbaContext = createContext();

export const NbaProvider = ({ children }) => {
  const [teamLookup, setTeamLookup] = useState({});
  const [currentGames, setCurrentGames] = useState([]);

  useEffect(() => {
    const updateTeamLookup = async () => {
      const newTeamLookup = await getTeamDict();
      if (newTeamLookup.status === "success") {
        setTeamLookup(newTeamLookup.teams);
      }
    };
    updateTeamLookup();
  }, []);

  return (
    <NbaContext.Provider
      value={{ teamLookup, setTeamLookup, currentGames, setCurrentGames }}
    >
      {children}
    </NbaContext.Provider>
  );
};
