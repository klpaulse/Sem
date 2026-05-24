import { useNavigate } from "react-router-dom";
import { toSlug } from "../../utils/slugify";

export default function MatchScoreCard({ status, homeName, awayName, homeTeamId, awayTeamId, result, resultClassName, children }) {
  const navigate = useNavigate();

  const statusMod =
    (status === "Slutt" || status === "Før kamp") ? " lp-status--slutt"
    : status === "Live" ? " lp-status--live"
    : status === "Pause" ? " lp-status--pause"
    : "";

  return (
    <div className="last-played-card">
      <p className={`lp-status${statusMod}`}>{status}</p>

      <div className="lp-row">
        <button className="lp-title team-link" onClick={() => homeTeamId && navigate(`/lag/${toSlug(homeName)}`)}>
          {homeName}
        </button>
        <p className={`lp-result ${resultClassName || ""}`}>{result}</p>
        <button className="lp-title team-link" onClick={() => awayTeamId && navigate(`/lag/${toSlug(awayName)}`)}>
          {awayName}
        </button>
      </div>

      {children}
    </div>
  );
}
