import { createContext, useState } from "react";

export const NbaContext = createContext();

export const NbaProvider = ({ children }) => {
  const [teamLookup, setTeamLookup] = useState({});
  const [currentGames, setCurrentGames] = useState([]);

  return (
    <NbaContext.Provider
      value={{ teamLookup, setTeamLookup, currentGames, setCurrentGames }}
    >
      {children}
    </NbaContext.Provider>
  );
};
