import { useState, useEffect } from "react";
import { NBAGameRowDisplay } from "@/components/nba/cards/nba_game_row_display";
import { getGameById } from "@/apis/sports_apis";

const GamePage = ({ id }) => {
  const [myGame, setMyGame] = useState({});

  useEffect(() => {
    const updateGame = async () => {
      const newGame = await getGameById({ game_id: id });
      if (newGame.status === "success") {
        setMyGame(newGame.game);
      }
    };
    if (id) updateGame();
  }, [id]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div>Game: {id}</div>
      <div className="flex flex-row items-center justify-center">
        {myGame?.game_id && <NBAGameRowDisplay game={myGame} />}
      </div>
    </div>
  );
};

export default GamePage;
