import { useMemo, useContext } from "react";
import { NbaContext } from "../nba_context";

export const NBAGameRowDisplay = ({ game }) => {
  const originalTime = game.game_time_utc;
  //convert to local time, using PM format
  const localTime = useMemo(() => {
    const date = new Date(originalTime);
    const local_tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: local_tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
    let local_time = formatter.format(date);
    //replace leading 0s and trailing seconds
    local_time = local_time.replace(/^0+/, "").replace(/:\d\d /, " ");

    return local_time;
  }, [originalTime]);

  return (
    <div className="flex flex-row items-center justify-center w-full border-2 border-black m-1">
      <div className="flex flex-col">
        <div className="text-sm font-bold">{localTime}</div>
        <BoxScoreDisplay game={game} />
      </div>
    </div>
  );
};

const BoxScoreDisplay = ({ game }) => {
  const { teamLookup, boxScores } = useContext(NbaContext);
  const home_team_id = game.home_team_id;
  const home_team_name = useMemo(() => {
    if (teamLookup[home_team_id]) return teamLookup[home_team_id].name;
    else return "Unknown Team";
  }, [home_team_id, teamLookup]);

  const away_team_id = game.away_team_id;
  const away_team_name = useMemo(() => {
    if (teamLookup[away_team_id]) return teamLookup[away_team_id].name;
    else return "Unknown Team";
  }, [away_team_id, teamLookup]);

  const myBoxScores = useMemo(() => {
    if (!boxScores[game.game_id]) return {};
    console.log("calling useMemo");
    const gameScores = {
      away_team_score: [],
      home_team_score: [],
    };

    const home_team_id = game.home_team_id;
    const away_team_id = game.away_team_id;

    //run thru the box score for the game, which is game_id.team_id.period.score
    const home_team_periods = boxScores[game.game_id][home_team_id];
    const away_team_periods = boxScores[game.game_id][away_team_id];

    let currentPeriod = 1;
    console.log("entering while loop for ", home_team_periods);
    while (home_team_periods?.[currentPeriod] !== undefined) {
      console.log("current period: ", currentPeriod);
      if (
        home_team_periods?.[currentPeriod]?.score &&
        away_team_periods?.[currentPeriod]?.score
      ) {
        gameScores.home_team_score.push(home_team_periods[currentPeriod].score);
        gameScores.away_team_score.push(away_team_periods[currentPeriod].score);
      } else {
        currentPeriod = null;
      }
      currentPeriod += 1;
    }

    return gameScores;
  }, [boxScores, game.game_id]);

  return (
    <div className="w-[400px] p-1 flex justify-center">
      <table className="table-auto border border-collapse">
        <thead>
          <tr>
            <th className="w-1/3 border-b border-r">Team</th>
            {myBoxScores?.away_team_score?.map((_, index) => {
              return (
                <th key={index} className="border-b border-r">
                  Q{index + 1}
                </th>
              );
            })}

            <th className="border-b">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="w-1/3 border-b border-r">{away_team_name}</td>
            {myBoxScores?.away_team_score?.map((score, index) => {
              return (
                <td key={index} className="border-b border-r">
                  {score}
                </td>
              );
            })}
            <td className="border-b">
              {myBoxScores.away_team_score?.reduce((a, b) => a + b, 0)}
            </td>
          </tr>
          <tr>
            <td className="w-2/3 border-r">(H) {home_team_name}</td>
            {myBoxScores?.home_team_score?.map((score, index) => {
              return (
                <td key={index} className="border-r">
                  {score}
                </td>
              );
            })}
            <td>{myBoxScores.home_team_score?.reduce((a, b) => a + b, 0)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
