import { useState, useEffect, useContext, useMemo } from "react";
import { getGames } from "@/apis/sports_apis";
import { NbaContext } from "./nba_context";
import { NBAGameRowDisplay } from "./cards/nba_game_row_display";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export const NbaDisplay = () => {
  const { currentGames, setCurrentGames, teamLookup } = useContext(NbaContext);
  //start on March 1st, 2021
  const [currentDate, setCurrentDate] = useState(new Date(2021, 2, 1));

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const todaysGames = useMemo(() => {
    return currentGames.filter((game) => {
      //check if the currentGame date is the same as the currentDate. game_et is in the format of "Fri, 02 Apr 2021 19:30:00 GMT"
      const gameDate = new Date(game.game_et);
      return (
        gameDate.getFullYear() === currentYear &&
        gameDate.getMonth() + 1 === currentMonth &&
        gameDate.getDate() === currentDate.getDate()
      );
    });
  }, [currentGames, currentDate, currentYear, currentMonth]);

  const updateCurrentGames = async () => {
    const dateDict = {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
    };

    const newGames = await getGames({ ...dateDict });

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
  }, [currentYear, currentMonth]);

  return (
    <div className="flex flex-col items-center justify-center">
      <h1>Sports</h1>
      <div className="flex flex-row items-center justify-center">
        <DatePicker
          selected={currentDate}
          onChange={(date) => setCurrentDate(date)}
        />
      </div>
      <div className="flex flex-col items-center justify-center">
        {todaysGames?.map((game) => {
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
