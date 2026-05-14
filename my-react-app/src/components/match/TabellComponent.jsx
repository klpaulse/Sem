
import { useNavigate } from "react-router-dom";
import { useLeagueTable } from "./useLeagueTable";

export default function TabellComponent({ match, division: divProp, season: seasProp, title, highlightTeamId }) {
  const division = divProp ?? match?.division;
  const season = seasProp ?? match?.season;

  const navigate = useNavigate();
  const { table, loading } = useLeagueTable(division, season);

  if (loading) return <p>Laster tabell...</p>;
  if (table.length === 0) return null;

  return (
    <div className="tabell-block">
      {title && <h2 className="tabell-division-title">{title}</h2>}
      <table className="league-table">
      <thead>
        <tr className="table-header">
          <th scope="col">#</th>
          <th scope="col">Lag</th>
          <th scope="col">V</th>
          <th scope="col">U</th>
          <th scope="col">T</th>
          <th scope="col">Mål</th>
          <th scope="col">P</th>
        </tr>
      </thead>

      <tbody>
        {table.map((team, index) => (
          <tr key={team.teamId} className={`table-row ${team.teamId === highlightTeamId ? "highlight" : ""}`}>
            <td>{index + 1}</td>
            <td>
              <button className="team-link" onClick={() => navigate(`/lag/${team.teamId}`)}>
                {team.teamName}
              </button>
            </td>
            <td>{team.wins}</td>
            <td>{team.draws}</td>
            <td>{team.losses}</td>
            <td>{team.goalsFor}-{team.goalsAgainst}</td>
            <td>{team.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
