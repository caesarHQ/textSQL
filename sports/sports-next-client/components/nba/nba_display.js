import { useState, useEffect, useContext, useMemo } from "react";
import { getGames } from "@/apis/sports_apis";
import { NbaContext } from "./nba_context";

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
            <GameRowDisplay
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

const GameRowDisplay = ({ game, teamLookup }) => {
  const homeTeamId = game.home_team_id;
  const awayTeamId = game.away_team_id;
  const homeTeamName = useMemo(() => {
    return teamLookup[homeTeamId].city + " " + teamLookup[homeTeamId].name;
  }, [homeTeamId, teamLookup]);

  const awayTeamName = useMemo(() => {
    return teamLookup[awayTeamId].city + " " + teamLookup[awayTeamId].name;
  }, [awayTeamId, teamLookup]);

  return (
    <div className="flex flex-row items-center justify-center w-full border-2 border-black m-1">
      <div className="flex flex-row items-center justify-center p-1">
        <div className="flex flex-col items-center justify-center w-64 h-32 m-1">
          <div>{game.game_et}</div>
        </div>
        <div className="flex flex-col items-center justify-center w-64 h-32 m-1">
          <div>Home Team: {homeTeamName}</div>
          <div>Away Team: {awayTeamName}</div>
        </div>
      </div>
    </div>
  );
};
