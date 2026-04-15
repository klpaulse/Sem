import { useState } from "react";
import AdminMatches from "./AdminMatches";
import LiveControls from "./LiveControls";
import EventList from "./EventList";

export default function LiveAdmin() {
  const [selectedMatch, setSelectedMatch] = useState(null);

  const handleSelectMatch = (match) => {
    // Sikrer at match er ren og kun inneholder ID-feltene
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
    };

    setSelectedMatch(cleanMatch);
  };

  return (
    <div className="live-admin">
      <AdminMatches onSelectMatch={handleSelectMatch} />

      {!selectedMatch && (
        <p>Velg en kamp for å starte livekontroll.</p>
      )}

      {selectedMatch && (
        <>
          <button onClick={() => setSelectedMatch(null)}>
            Tilbake
          </button>

          <LiveControls match={selectedMatch} />
          <EventList match={selectedMatch} />
        </>
      )}
    </div>
  );
}