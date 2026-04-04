import MatchReport from "../MatchReport";

export default function MatchPreview({ match, events }) {
  if (!match) {
    return <p>Laster forhåndsvisning...</p>;
  }

  return (
    <section>
      <h3>Live forhåndsvisning</h3>
      <MatchReport match={match} events={events} />
    </section>
  );
}
