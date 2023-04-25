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
      setCurrentGames(newGames.games);
    }
  };

  console.log("currentGames: ", currentGames);

  useEffect(() => {
    updateCurrentGames();
  }, [currentDate]);

  return (
    <div className="flex flex-col items-center justify-center">
      <h1>Sports</h1>
      <div className="flex flex-row items-center justify-center">
        {currentGames.map((game, idx) => {
          return (
            <div
              className="flex flex-col items-center justify-center"
              key={idx}
            >
              <p>{JSON.stringify(game)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default Sports;
