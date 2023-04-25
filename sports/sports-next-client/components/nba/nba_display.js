import { useState, useEffect, useContext } from "react";
import { getGames } from "@/apis/sports_apis";
import { NbaContext } from "./nba_context";
import { NBAGameRowDisplay } from "./cards/nba_game_row_display";

export const NbaDisplay = () => {
  const { currentGames, setCurrentGames, teamLookup } = useContext(NbaContext);
  const [currentDate, setCurrentDate] = useState({
    month: 3,
    year: 2021,
  });

  const updateCurrentGames = async () => {
    const newGames = await getGames({ ...currentDate });

    if (newGames.status === "success") {
      let resultant_games = newGames.games;
      //order by game_et
      resultant_games.sort((a, b) => {
        if (a.game_et < b.game_et) {
          return -1;
        }
        if (a.game_et > b.game_et) {
          return 1;
        }
        return 0;
      });
      setCurrentGames(resultant_games);
    }
  };

  useEffect(() => {
    updateCurrentGames();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <h1>Sports</h1>
      <div className="flex flex-col items-center justify-center">
        {currentGames?.map((game) => {
          return (
            <NBAGameRowDisplay
              game={game}
              key={game.game_id}
              teamLookup={teamLookup}
            />
          );
        })}
      </div>
    </div>
  );
};
