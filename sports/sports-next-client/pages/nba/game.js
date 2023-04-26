import GamePage from "@/components/nba/game_data/game_page";
import { useRouter } from "next/router";

const Game = () => {
  const router = useRouter();
  const { id } = router.query;

  return <GamePage id={id} />;
};

export default Game;
