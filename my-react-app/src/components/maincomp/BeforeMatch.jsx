import { useEffect, useState } from "react";
import Countdown from "../Countdown";
import "../../assets/style/matchPage.css";
import BeforeMatchInfo from "./BeforeMatchInfo";
import SeasonTimeline from "./SeasonsTimeline";
import { getSeasonMatches } from "../../services/MatchService";



export default function BeforeMatch({ match, allMatches }) {
  if (!match) return null;

  const matchDate =
    match.date instanceof Date ? match.date : match.date.toDate();

  const [homeSeason, setHomeSeason] = useState([]);
  const [awaySeason, setAwaySeason] = useState([]);

  // Hent sesongens kamper for begge lag
  useEffect(() => {
    async function loadSeason() {
      if (!match) return;

      const home = await getSeasonMatches(match.homeTeamId, "2026");
      const away = await getSeasonMatches(match.awayTeamId, "2026");

      setHomeSeason(home);
      setAwaySeason(away);
    }

    loadSeason();
  }, [match]);

  return (
    <section className="page">
      <h1 className="live-header">Breddefotball Live</h1>

      {/* Countdown */}
      <div className="countdown">
        <Countdown date={new Date(matchDate)} />
      </div>

      {/* Kampkort */}
      <div className="last-played-card">
        <div className="lp-row">
          <span className="lp-title">{match.homeTeamName}</span>
          <span className="lp-title">{match.awayTeamName}</span>
        </div>

        <p className="dato">
          {match.time ||
            matchDate.toLocaleTimeString("no-NO", {
              hour: "2-digit",
              minute: "2-digit",
            })}
        </p>
      </div>

      {/* Timeline for hjemmelaget */}
      <h3 className="timeline-header">{match.homeTeamName} – sesongen 2026</h3>
      <SeasonTimeline
        matches={homeSeason}
        teamId={match.homeTeamId}
        currentMatchId={match.id}
      />

      {/* Timeline for bortelaget */}
      <h3 className="timeline-header">{match.awayTeamName} – sesongen 2026</h3>
      <SeasonTimeline
        matches={awaySeason}
        teamId={match.awayTeamId}
        currentMatchId={match.id}
      />

      {/* Info-boksene dine */}
      <BeforeMatchInfo match={match} allMatches={allMatches} />
    </section>
  );
}