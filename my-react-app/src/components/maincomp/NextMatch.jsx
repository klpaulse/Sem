import { useNavigate } from "react-router-dom";
import Countdown from "../Countdown";

export default function NextMatch({ matches }) {
  const navigate = useNavigate();

  if (!matches || matches.length === 0) {
    return <p>Ingen kamper lagt til ennå.</p>;
  }

  const now = new Date();

  // Finn kommende kamper
  const upcoming = matches
    .filter((m) => m.date && m.date >= now)
    .sort((a, b) => a.date - b.date);

  // Finn ferdige kamper (med resultat)
  const finished = matches
    .filter((m) => m.homeScore !== null && m.awayScore !== null)
    .sort((a, b) => b.date - a.date); // nyeste først

  // Hvis det finnes en kommende kamp → vis den
  if (upcoming.length > 0) {
    const next = upcoming[0];
    const nextDate = next.date;

    return (
      <section
        className="next-match"
        onClick={() => navigate(`/match/${next.id}`)}
      >
        <h2 className="match-title">
          {next.homeTeamName} - {next.awayTeamName}
        </h2>

        <p className="dato">
          {nextDate.toLocaleDateString("no-NO")} – kl {next.time}
        </p>

        <Countdown date={nextDate} />

        <div className="knapp-linje">
          <button className="knapp-kampdetaljer">Se kampdetaljer</button>
        </div>
      </section>
    );
  }

  // Hvis ingen kommende kamper → vis SISTE SPILTE kamp med resultat
  if (finished.length > 0) {
    const last = finished[0];
    const lastDate = last.date;

    return (
      <section
        className="next-match"
        onClick={() => navigate(`/match/${last.id}`)}
      >
        <h2 className="match-title">
          {last.homeTeamName} - {last.awayTeamName}
        </h2>

        <p className="dato">
          {lastDate.toLocaleDateString("no-NO")} – kl {last.time}
        </p>

        <p className="resultat">
          Resultat: {last.homeScore}–{last.awayScore}
        </p>

        <div className="knapp-linje">
          <button className="knapp-kampdetaljer">Se kampdetaljer</button>
        </div>
      </section>
    );
  }

  return <p>Ingen kamper tilgjengelig</p>;
}