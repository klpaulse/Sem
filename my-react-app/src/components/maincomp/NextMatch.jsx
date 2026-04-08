import { useNavigate } from "react-router-dom";
import Countdown from "../Countdown";

export default function NextMatch({ matches }) {
  const navigate = useNavigate();

  if (!matches || matches.length === 0) {
    return <p>Ingen kamper lagt til ennå.</p>;
  }

  const now = new Date();

  // 🔥 Finn kommende kamper basert på FULL datetime i `date`
  const upcoming = matches
    .filter((m) => {
      if (!m.date) return false;
      const matchDate = m.date.toDate();
      return matchDate >= now;
    })
    .sort((a, b) => a.date.toDate() - b.date.toDate());

  if (upcoming.length === 0) {
    return <p>Ingen kommende kamper</p>;
  }

  const next = upcoming[0];
  const nextDate = next.date.toDate();

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

      {/* 🔥 Countdown får full datetime */}
      <Countdown date={nextDate} />

      <div className="knapp-linje">
        <button className="knapp-kampdetaljer">Se kampdetaljer</button>
      </div>
    </section>
  );
}