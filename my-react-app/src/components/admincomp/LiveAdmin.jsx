import { useState } from "react";
import Calandar from "../homecomp/Calandar";
import AdminMatches from "./AdminMatches";
import LiveControls from "./LiveControls";


export default function LiveAdmin() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMatch, setSelectedMatch] = useState(null);

  const handleSelectMatch = (match) => {
    const cleanMatch = {
      id: match.id,
      homeTeamId: String(match.homeTeamId),
      awayTeamId: String(match.awayTeamId),
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

      <Calandar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        setSelectedMatch={setSelectedMatch}
      />

      <AdminMatches
        selectedDate={selectedDate}
        onSelectMatch={handleSelectMatch}
      />

      {!selectedMatch && (
        <p>Velg en kamp for å starte livekontroll.</p>
      )}

      {selectedMatch && (
        <>
          <button onClick={() => setSelectedMatch(null)}>
            Tilbake
          </button>

          <LiveControls match={selectedMatch} />
        </>
      )}
    </div>
  );
}

