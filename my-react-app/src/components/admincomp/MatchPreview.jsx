import MatchReport from "../MatchReport";

export default function MatchPreview({ match, events }) {
  if (!match) {
    return <p>Laster forhåndsvisning...</p>;
  }

  // Sikrer at match alltid har ID-basert struktur
  const cleanMatch = {
    id: match.id,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    division: match.division,
    date: match.date,
    time: match.time,
    arena: match.arena,
    status: match.status,
    season: match.season,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
  };

  return (
    <section>
      <h3>Live forhåndsvisning</h3>
      <MatchReport match={cleanMatch} events={events} />
    </section>
  );
}
