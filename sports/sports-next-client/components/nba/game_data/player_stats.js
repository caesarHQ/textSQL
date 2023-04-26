import {
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "./table";

export const PlayerStats = ({ playerData }) => {
  return (
    <Table>
      <TableHead>
        <TableHeader>Total Points</TableHeader>
        <TableHeader>FGM</TableHeader>
        <TableHeader>FGA</TableHeader>
        <TableHeader>FG%</TableHeader>
        <TableHeader>3PM</TableHeader>
        <TableHeader>3PA</TableHeader>
        <TableHeader>3P%</TableHeader>
        <TableHeader>FTM</TableHeader>
        <TableHeader>FTA</TableHeader>
        <TableHeader>FT%</TableHeader>
        <TableHeader>PF</TableHeader>
        <TableHeader>OREB</TableHeader>
        <TableHeader>DREB</TableHeader>
        <TableHeader>REB</TableHeader>
        <TableHeader>AST</TableHeader>
        <TableHeader>STL</TableHeader>
        <TableHeader>BLK</TableHeader>
        <TableHeader>TO</TableHeader>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>{playerData.total_points}</TableCell>
          <TableCell>{playerData.total_field_goals_made}</TableCell>
          <TableCell>{playerData.total_field_goals_attempted}</TableCell>
          <TableCell>{playerData.field_goal_percentage}</TableCell>
          <TableCell>{playerData.total_three_pointers_made}</TableCell>
          <TableCell>{playerData.total_three_pointers_attempted}</TableCell>
          <TableCell>{playerData.three_point_percentage}</TableCell>
          <TableCell>{playerData.total_free_throws_made}</TableCell>
          <TableCell>{playerData.total_free_throws_attempted}</TableCell>
          <TableCell>{playerData.free_throw_percentage}</TableCell>
          <TableCell>{playerData.total_personal_fouls}</TableCell>
          <TableCell>{playerData.total_offensive_rebounds}</TableCell>
          <TableCell>{playerData.total_defensive_rebounds}</TableCell>
          <TableCell>{playerData.total_rebounds}</TableCell>
          <TableCell>{playerData.total_assists}</TableCell>
          <TableCell>{playerData.total_steals}</TableCell>
          <TableCell>{playerData.total_blocks}</TableCell>
          <TableCell>{playerData.total_turnovers}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
