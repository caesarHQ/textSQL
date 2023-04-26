import { useState, useEffect, useContext } from "react";
import { NbaContext } from "../nba_context";
import { getGameById, getGameStatsById } from "@/apis/sports_apis";

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

  console.log("my game:", myGame);
  console.log("my game stats:", myGameStats);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div>Game: {id}</div>
      <BasicGameDisplay
        game={myGame}
        teamLookup={teamLookup}
        team={myGame.away_team_id}
      />
    </div>
  );
};

export default GamePage;

const BasicGameDisplay = ({ game, teamLookup, team }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {JSON.stringify(teamLookup[team])}
    </div>
  );
};
