import { useMemo } from "react";

export const NBAGameRowDisplay = ({ game, teamLookup }) => {
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
