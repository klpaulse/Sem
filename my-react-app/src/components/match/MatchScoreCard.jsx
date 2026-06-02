import { useNavigate } from "react-router-dom";
import { toSlug } from "../../utils/slugify";
import TeamLogo from "../shared/TeamLogo";

export default function MatchScoreCard({ status, homeName, awayName, homeTeamId, awayTeamId, homeLogo, awayLogo, result, resultClassName, children }) {
  const navigate = useNavigate();

  const statusMod =
    (status === "Slutt" || status === "Før kamp") ? " lp-status--slutt"
    : status === "Utsatt" ? " lp-status--postponed"
    : status === "Live" ? " lp-status--live"
    : status === "Pause" ? " lp-status--pause"
    : "";

  return (
    <div className="last-played-card">
      <p className={`lp-status${statusMod}`}>{status}</p>

      <div className="lp-row">
        <button className="lp-title lp-title--home team-link" onClick={() => homeTeamId && navigate(`/lag/${toSlug(homeName)}`)}>
          <TeamLogo logoUrl={homeLogo} name={homeName} size={50} />
          <span className="lp-team-name">{homeName}</span>
        </button>
        <p className={`lp-result ${resultClassName || ""}`}>{result}</p>
        <button className="lp-title lp-title--away team-link" onClick={() => awayTeamId && navigate(`/lag/${toSlug(awayName)}`)}>
          <TeamLogo logoUrl={awayLogo} name={awayName} size={50} />
          <span className="lp-team-name">{awayName}</span>
        </button>
      </div>

      {children}
    </div>
  );
}
