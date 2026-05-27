import { useNavigate } from "react-router-dom";
import { toSlug } from "../../utils/slugify";

export default function MatchScoreCard({ status, homeName, awayName, homeTeamId, awayTeamId, homeLogo, awayLogo, result, resultClassName, children }) {
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
        <button className="lp-title lp-title--home team-link" onClick={() => homeTeamId && navigate(`/lag/${toSlug(homeName)}`)}>
          {homeLogo && <img src={homeLogo} alt="" className="lp-team-logo" />}
          <span>{homeName}</span>
        </button>
        <p className={`lp-result ${resultClassName || ""}`}>{result}</p>
        <button className="lp-title lp-title--away team-link" onClick={() => awayTeamId && navigate(`/lag/${toSlug(awayName)}`)}>
          <span>{awayName}</span>
          {awayLogo && <img src={awayLogo} alt="" className="lp-team-logo" />}
        </button>
      </div>

      {children}
    </div>
  );
}
