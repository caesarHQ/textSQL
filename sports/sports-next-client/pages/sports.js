import { useState, useEffect } from "react";
import { getGames } from "@/apis/sports_apis";

const Sports = () => {
  const [currentGames, setCurrentGames] = useState([]);
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
          return <GameRowDisplay game={game} key={game.game_id} />;
        })}
      </div>
    </div>
  );
};
export default Sports;

const GameRowDisplay = ({ game }) => {
  return (
    <div className="flex flex-row items-center justify-center w-full border-2 border-black m-1">
      <div className="flex flex-row items-center justify-center p-1">
        <p>{game.game_et}</p>
        <p>{game.game_code}</p>
      </div>
    </div>
  );
};
