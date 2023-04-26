import { useState, useEffect, useContext } from "react";
import { NbaContext } from "../nba_context";
import { getGameById, getGameStatsById } from "@/apis/sports_apis";
import Link from "next/link";

const GamePage = ({ id }) => {
  const [myGame, setMyGame] = useState({});
  const [myGameStats, setMyGameStats] = useState({});

  const { teamLookup } = useContext(NbaContext);

  useEffect(() => {
    const updateGame = async () => {
      const newGame = await getGameById({ game_id: id });
      if (newGame.status === "success") {
        setMyGame(newGame.game);
      }
    };
    const updateGameStats = async () => {
      const newGameStats = await getGameStatsById({ game_id: id });
      if (newGameStats.status === "success") {
        setMyGameStats(newGameStats.stats);
      }
    };

    if (id) {
      updateGame();
      updateGameStats();
    }
  }, [id]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex w-full">
        <Link href={"/nba"}>
          <div className="flex flex-col items-center justify-center w-[100px] h-9 text-white bg-blue-500 rounded-lg">
            Back
          </div>
        </Link>
      </div>
      {!!myGameStats && (
        <BasicGameDisplay stats={myGameStats} teamLookup={teamLookup} />
      )}
    </div>
  );
};

export default GamePage;

const BasicGameDisplay = ({ stats, teamLookup, team }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <ScoreBox stats={stats} teamLookup={teamLookup} />
    </div>
  );
};

const ScoreBox = ({ stats, teamLookup }) => {
  const teams = Object.keys(stats || {});
  console.log("stats: ", stats);
  console.log("teams: ", teams);

  return (
    <table className="w-full bg-white rounded-lg">
      <thead className="bg-gray-100">
        <tr>
          <ScoreBoxHead label="Team" />
          <ScoreBoxHead label="Points" />
          <ScoreBoxHead label="Assists" />
          <ScoreBoxHead label="Rebounds" />
          <ScoreBoxHead label="Steals" />
          <ScoreBoxHead label="3-Pointers Made" />
          <ScoreBoxHead label="FG%" />
          <ScoreBoxHead label="FT%" />
        </tr>
      </thead>
      <tbody>
        {teams
          ?.map((t) => stats[t])
          .map((t) => {
            return (
              <tr key={t.team_id}>
                <ScoreBoxData
                  data={teamLookup[t.team_id]?.name}
                  width={"1/3"}
                />
                <ScoreBoxData data={t.points} />
                <ScoreBoxData data={t.assists} />
                <ScoreBoxData data={t.rebounds_total} />
                <ScoreBoxData data={t.steals} />
                <ScoreBoxData data={t.three_pointers_made} />
                <ScoreBoxData data={t.field_goals_percentage} />
                <ScoreBoxData data={t.free_throws_percentage} />
              </tr>
            );
          })}
      </tbody>
    </table>
  );
};

const ScoreBoxHead = ({ label, width = "1/6" }) => {
  return (
    <th className={`w-${width} p-4 text-center font-medium text-gray-700`}>
      {label}
    </th>
  );
};

const ScoreBoxData = ({ data }) => {
  return (
    <td className="w-1/6 p-4 text-center font-medium text-gray-700">{data}</td>
  );
};
