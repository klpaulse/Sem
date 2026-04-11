import { useNavigate } from "react-router-dom";
import Countdown from "../Countdown";

function normalizeDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (d.toDate) return d.toDate(); // Firestore Timestamp
  return new Date(d); // ISO string
}

export default function NextMatch({ matches }) {
  const navigate = useNavigate();

  if (!matches || matches.length === 0) {
    return <p>Ingen kamper lagt til ennå.</p>;
  }

  const now = new Date();

  // Finn kommende kamper
  const upcoming = matches
  .map((m) => ({ ...m, dateObj: normalizeDate(m.date) }))
  .filter((m) => m.dateObj && m.dateObj >= now)
  .sort((a, b) => a.dateObj - b.dateObj);

  // Finn ferdige kamper (med resultat)
const finished = matches
  .map((m) => ({ ...m, dateObj: normalizeDate(m.date) }))
  .filter((m) => m.homeScore !== null && m.awayScore !== null)
  .sort((a, b) => b.dateObj - a.dateObj);

  // Hvis det finnes en kommende kamp → vis den
  if (upcoming.length > 0) {
    const next = upcoming[0];
    const nextDate = next.dateObj;

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
    const lastDate = last.dateObj;

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