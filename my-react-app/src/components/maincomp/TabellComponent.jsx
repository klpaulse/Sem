
import { useLeagueTable } from "./useLeagueTable";

export default function TabellComponent({ match }) {
  const division = match.division;
  const season = match.season;

  const { table, loading } = useLeagueTable(division, season);

  if (loading) return <p>Laster tabell...</p>;

  return (
    <div className="league-table">
      <div className="table-header">
        <span>#</span>
        <span>Lag</span>
        <span>K</span>
        <span>V</span>
        <span>U</span>
        <span>T</span>
        <span>Mål</span>
        <span>Diff</span>
        <span>P</span>
      </div>

      {table.map((team, index) => (
        <div key={team.teamId} className="table-row">
          <span>{index + 1}</span>
          <span>{team.teamName}</span>
          <span>{team.played}</span>
          <span>{team.wins}</span>
          <span>{team.draws}</span>
          <span>{team.losses}</span>
          <span>{team.goalsFor} - {team.goalsAgainst}</span>
          <span>{team.goalsFor - team.goalsAgainst}</span>
          <span>{team.points}</span>
        </div>
      ))}
    </div>
  );
}
