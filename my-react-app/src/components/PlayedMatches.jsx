import { useNavigate } from "react-router-dom";

export default function PlayedMatches({ matches }) {
  const navigate = useNavigate();
  const now = new Date();

  // Filtrer ferdigspilte kamper
  const past = matches
    .filter((m) => {
      if (!m.date) return false;

      const baseDate = m.date.toDate ? m.date.toDate() : new Date(m.date);
      if (isNaN(baseDate)) return false;

      const datePart = baseDate.toISOString().split("T")[0];
      const matchDateTime = new Date(`${datePart}T${m.time}`);

      return matchDateTime < now;
    })
    .sort((a, b) => {
      const aBase = a.date.toDate ? a.date.toDate() : new Date(a.date);
      const bBase = b.date.toDate ? b.date.toDate() : new Date(b.date);

      const aDate = new Date(`${aBase.toISOString().split("T")[0]}T${a.time}`);
      const bDate = new Date(`${bBase.toISOString().split("T")[0]}T${b.time}`);

      return bDate - aDate; // nyeste først
    });

  return (
    <section>
      <h2>Spilte kamper</h2>

      {past.length === 0 && <p>Ingen spilte kamper ennå</p>}

      {past.map((m, index) => {
        const baseDate = m.date.toDate ? m.date.toDate() : new Date(m.date);
        const datePart = baseDate.toISOString().split("T")[0];
        const kampDato = new Date(`${datePart}T${m.time}`);

        const harResultat =
          m.homeScore !== null &&
          m.homeScore !== undefined &&
          m.awayScore !== null &&
          m.awayScore !== undefined;

        return (
          <div
            key={index}
            className="match-clickable"
            onClick={() => navigate(`/match/${m.id}`, { state: { match: m } })}
          >
            <p>
              {m.day} {kampDato.toLocaleDateString("no-NO")} – Ferdig
            </p>

            {harResultat ? (
              <p>
                {m.homeTeamName} {m.homeScore} – {m.awayScore} {m.awayTeamName}
              </p>
            ) : (
              <p>Resultat kommer</p>
            )}
          </div>
        );
      })}
    </section>
  );
}