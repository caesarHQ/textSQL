import { useState, useEffect, useContext, useMemo } from "react";
import { NbaContext } from "../nba_context";
import {
  getGameById,
  getGameStatsById,
  getPlayerGameStatsById,
} from "@/apis/sports_apis";
import Link from "next/link";

const GamePage = ({ id }) => {
  const [myGame, setMyGame] = useState({});
  const [myGameStats, setMyGameStats] = useState({});
  const [myPlayerStats, setMyPlayerStats] = useState([]);

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

    const upgradePlayerStats = async () => {
      const newPlayerStats = await getPlayerGameStatsById({ game_id: id });
      if (newPlayerStats.status === "success") {
        setMyPlayerStats(newPlayerStats.stats);
      }
    };

    if (id) {
      updateGame();
      updateGameStats();
      upgradePlayerStats();
    }
  }, [id]);

  return (
    <div
      className="flex flex-col"
      style={{
        height: "100vh",
        justifyContent: "flex-start",
      }}
    >
      <div className="flex w-full">
        <Link href={"/nba"}>
          <div className="flex flex-col items-center justify-center w-[100px] h-9 text-white bg-blue-500 rounded-lg">
            Back
          </div>
        </Link>
      </div>
      {!!myGameStats && (
        <BasicGameDisplay
          stats={myGameStats}
          teamLookup={teamLookup}
          playerStats={myPlayerStats || []}
        />
      )}
    </div>
  );
};

export default GamePage;

const BasicGameDisplay = ({ stats, teamLookup, playerStats }) => {
  return (
    <div className="flex flex-col items-center w-full h-full">
      <ScoreBox
        stats={stats}
        teamLookup={teamLookup}
        playerStats={playerStats}
      />
    </div>
  );
};

const ScoreBox = ({ stats, teamLookup, playerStats }) => {
  const [activeTeam, setActiveTeam] = useState(null);
  const teams = Object.keys(stats || {});
  const teamCount = teams.length;

  useEffect(() => {
    if (teams && teams.length > 0) {
      setActiveTeam(teams[0]);
    }
  }, [teamCount]);

  const filteredPlayers = useMemo(() => {
    if (!playerStats) {
      return {};
    }
    const playersByTeam = {};
    for (const player of playerStats) {
      if (!playersByTeam[player.team_id]) {
        playersByTeam[player.team_id] = [];
      }
      playersByTeam[player.team_id].push(player);
    }
    return playersByTeam;
  }, [playerStats]);

  return (
    <>
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
                <ScoreBoxRow
                  teamLookup={teamLookup}
                  t={t}
                  key={t.team_id}
                  players={filteredPlayers[t.team_id] || []}
                  setActive={setActiveTeam}
                />
              );
            })}
        </tbody>
      </table>
      {activeTeam && (
        <div className="flex flex-col items-center justify-center w-full">
          <div className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col items-center justify-center w-full text-white bg-blue-600 text-2xl p-2">
              {teamLookup[activeTeam].name}
            </div>
          </div>
          <table className="w-full bg-white rounded-lg">
            <thead className="bg-gray-100 w-full">
              <tr>
                <ScoreBoxHead label="Player" />
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
              {filteredPlayers[activeTeam]?.map((player) => {
                return (
                  <PlayerBoxRow
                    teamLookup={teamLookup}
                    key={player.person_id}
                    player={player}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

const ScoreBoxHead = ({ label, width = "1/6" }) => {
  return (
    <th className={`w-${width} p-4 text-center font-medium text-gray-700`}>
      {label}
    </th>
  );
};

const ScoreBoxData = ({ data, extraProps }) => {
  return (
    <td
      className={`w-1/6 p-4 text-center font-medium text-gray-700 ${extraProps}`}
    >
      {data}
    </td>
  );
};

const ScoreBoxRow = ({ teamLookup, t, players, setActive }) => {
  const [isHovered, setIsHovered] = useState(false);
  if (isHovered) {
    console.log(players);
  }
  return (
    <tr
      className={`${isHovered ? "bg-gray-300" : ""} hover:bg-gray-300`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setActive(t.team_id)}
    >
      <ScoreBoxData
        data={teamLookup[t.team_id]?.name}
        width={"1/3"}
        extraProps={"cursor-pointer"}
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
};

const PlayerBoxRow = ({ player }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <tr
      className={`${isHovered ? "bg-gray-300" : ""} hover:bg-gray-300`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/nba/player?id=${player.person_id}`}>
        <ScoreBoxData data={player.player_name} width={"1/3"} />
      </Link>
      <ScoreBoxData data={player.points} />
      <ScoreBoxData data={player.assists} />
      <ScoreBoxData data={player.rebounds_total} />
      <ScoreBoxData data={player.steals} />
      <ScoreBoxData data={player.three_pointers_made} />
      <ScoreBoxData data={player.field_goals_percentage} />
      <ScoreBoxData data={player.free_throws_percentage} />
    </tr>
  );
};
