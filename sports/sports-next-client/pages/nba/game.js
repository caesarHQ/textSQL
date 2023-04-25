import { useRouter } from "next/router";

const Game = () => {
  const router = useRouter();
  const { id } = router.query;

  return <div>Game: {id}</div>;
};

export default Game;
