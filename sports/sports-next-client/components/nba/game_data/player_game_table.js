import { useContext } from "react";
import { NbaContext } from "../nba_context";
import {
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "./table";

export const PlayerGameTable = ({ games }) => {
  const { teamLookup } = useContext(NbaContext);
  return (
    <Table>
      <TableHead>
        <TableHeader>Game ID</TableHeader>
        <TableHeader>Date</TableHeader>
        <TableHeader>Home Team ID</TableHeader>
        <TableHeader>Away Team ID</TableHeader>
        <TableHeader>Attendance</TableHeader>
        <TableHeader>Duration</TableHeader>
        <TableHeader>Status</TableHeader>
      </TableHead>

      <TableBody>
        {games.map((game) => {
          return (
            <TableRow key={game.game_id}>
              <TableCell>{game.game_id}</TableCell>
              <TableCell>{game.game_et}</TableCell>
              <TableCell>{teamLookup[game.home_team_id].name}</TableCell>
              <TableCell>{teamLookup[game.away_team_id].name}</TableCell>
              <TableCell>{game.attendance}</TableCell>
              <TableCell>{game.duration}</TableCell>
              <TableCell>{game.game_status_text}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
