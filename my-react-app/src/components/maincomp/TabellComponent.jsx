
import { useLeagueTable } from "./useLeagueTable";

export default function TabellComponent({ match }) {
  const division = match.division;
  const season = match.season;

  const { table, loading } = useLeagueTable(division, season);

  if (loading) return <p>Laster tabell...</p>;

  return (
    <table className="league-table">
      <thead>
        <tr className="table-header">
          <th scope="col">#</th>
          <th scope="col">Lag</th>
          <th scope="col">K</th>
          <th scope="col">V</th>
          <th scope="col">U</th>
          <th scope="col">T</th>
          <th scope="col">Mål</th>
          <th scope="col">Diff</th>
          <th scope="col">P</th>
        </tr>
      </thead>

      <tbody>
        {table.map((team, index) => (
          <tr key={team.teamId} className="table-row">
            <td>{index + 1}</td>
            <td>{team.teamName}</td>
            <td>{team.played}</td>
            <td>{team.wins}</td>
            <td>{team.draws}</td>
            <td>{team.losses}</td>
            <td>{team.goalsFor} - {team.goalsAgainst}</td>
            <td>{team.goalsFor - team.goalsAgainst}</td>
            <td>{team.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
