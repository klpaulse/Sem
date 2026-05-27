import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeagueTable } from "./useLeagueTable";

function TableSkeleton() {
  return (
    <div className="skeleton-table">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton-cell skeleton" />
          <div className="skeleton-cell skeleton skeleton-cell--name" />
          <div className="skeleton-cell skeleton" />
          <div className="skeleton-cell skeleton" />
          <div className="skeleton-cell skeleton" />
          <div className="skeleton-cell skeleton" />
          <div className="skeleton-cell skeleton skeleton-cell--goals" />
          <div className="skeleton-cell skeleton" />
        </div>
      ))}
    </div>
  );
}

export default function TabellComponent({ match, division: divProp, season: seasProp, title, highlightTeamId }) {
  const division = divProp ?? match?.division;
  const season = seasProp ?? match?.season;

  const navigate = useNavigate();
  const { table, liveTable, hasLive, loading } = useLeagueTable(division, season);
  const [showLive, setShowLive] = useState(false);

  if (loading) return <TableSkeleton />;
  if (table.length === 0) return null;

  const displayTable = showLive && hasLive ? liveTable : table;

  // Build a map of teamId -> normal position for comparison
  const normalPositions = {};
  table.forEach((team, i) => { normalPositions[team.teamId] = i; });

  return (
    <div className="tabell-block">
      <div className="tabell-header-row">
        {title && <h2 className="tabell-division-title">{title}</h2>}
        {hasLive && (
          <div className="tabell-toggle">
            <button
              className={"tabell-toggle-btn" + (!showLive ? " active" : "")}
              onClick={() => setShowLive(false)}
            >
              Tabell
            </button>
            <button
              className={"tabell-toggle-btn tabell-toggle-btn--live" + (showLive ? " active" : "")}
              onClick={() => setShowLive(true)}
            >
              <span className="tabell-live-dot" />
              Live
            </button>
          </div>
        )}
      </div>

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
            <th scope="col">P</th>
          </tr>
        </thead>

        <tbody>
          {displayTable.map((team, index) => {
            const normalPos = normalPositions[team.teamId] ?? index;
            const diff = showLive ? normalPos - index : 0;
            const isLiveAffected = showLive && diff !== 0;

            return (
              <tr
                key={team.teamId}
                className={`table-row ${team.teamId === highlightTeamId ? "highlight" : ""} ${isLiveAffected ? "table-row--live" : ""}`}
              >
                <td className="table-pos-cell">
                  {index + 1}
                  {diff > 0 && <span className="table-pos-up">▲</span>}
                  {diff < 0 && <span className="table-pos-down">▼</span>}
                </td>
                <td>
                  <button className="team-link" onClick={() => navigate(`/lag/${team.teamSlug || team.teamId}`)}>
                    {team.teamName}
                  </button>
                </td>
                <td>{team.played}</td>
                <td>{team.wins}</td>
                <td>{team.draws}</td>
                <td>{team.losses}</td>
                <td>{team.goalsFor}-{team.goalsAgainst}</td>
                <td>{team.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
