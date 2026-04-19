import { useEffect, useState } from "react";
import { db } from "../../config/Firebase";
import { collection, onSnapshot } from "firebase/firestore";

import MatchListAdmin from "./MatchListAdmin";
import ResultsForm from "./ResultsForm";

export default function ResultatAdmin() {
  const [matches, setMatches] = useState([]);
  const [editingMatch, setEditingMatch] = useState(null);

  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [location, setLocation] = useState("");

  const [selectedDivision, setSelectedDivision] = useState(null);

  // Hent alle kamper
  useEffect(() => {
    const ref = collection(db, "matches");

    const unsub = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMatches(data);
    });

    return () => unsub();
  }, []);

  // Sorter kamper etter dato
  const sortedMatches = [...matches].sort((a, b) => {
    const da = a.date?.toDate?.() || new Date(0);
    const db = b.date?.toDate?.() || new Date(0);
    return da - db;
  });

  // Filtrer manglende resultater
  const missingResults = sortedMatches.filter((m) => {
    const matchDate = m.date?.toDate?.();
    const now = new Date();

    const isPast = matchDate && matchDate < now;

    const noResult =
      (m.homeScore === null || m.homeScore === undefined || m.homeScore === "") &&
      (m.awayScore === null || m.awayScore === undefined || m.awayScore === "");

    const notLive = m.status !== "live";

    return isPast && noResult && notLive;
  });

  // Gruppér etter divisjon
  function groupByDivision(matches) {
    const groups = {};

    for (const m of matches) {
      const div = m.division || "Uten divisjon";
      if (!groups[div]) groups[div] = [];
      groups[div].push(m);
    }

    return groups;
  }

  const grouped = groupByDivision(sortedMatches);
  const divisions = Object.keys(grouped);

  return (
    <section>
      <h1>Resultatadministrasjon</h1>

      {/* Manglende resultater */}
      <h2>Mangler resultat</h2>

      {missingResults.length === 0 && <p>Ingen kamper mangler resultat 🎉</p>}

      {missingResults.length > 0 && (
        <MatchListAdmin
          matches={missingResults}
          editingMatch={editingMatch}
          setEditingMatch={setEditingMatch}
          mode="missing"
        />
      )}

      <hr />

      {/* Vis kamper-knapp */}
      {!selectedDivision && (
        <button onClick={() => setSelectedDivision("choose")}>
          Vis kamper
        </button>
      )}

      {/* Velg divisjon */}
      {selectedDivision === "choose" && (
        <div>
          <h2>Velg divisjon</h2>
          {divisions.map((div) => (
            <button
              key={div}
              onClick={() => setSelectedDivision(div)}
              style={{ display: "block", marginBottom: "0.5rem" }}
            >
              {div}
            </button>
          ))}
        </div>
      )}

      {/* Viser kamper i valgt divisjon */}
      {selectedDivision && selectedDivision !== "choose" && (
        <div>
          <h2>{selectedDivision}</h2>

          <MatchListAdmin
            matches={grouped[selectedDivision]}
            editingMatch={editingMatch}
            setEditingMatch={setEditingMatch}
            mode="all"
          />

          <button onClick={() => setSelectedDivision("choose")}>
            Tilbake til divisjoner
          </button>
        </div>
      )}

      {/* Redigeringsskjema */}
      {editingMatch && (
        <ResultsForm
          editingMatch={editingMatch}
          setEditingMatch={setEditingMatch}
          homeScore={homeScore}
          setHomeScore={setHomeScore}
          awayScore={awayScore}
          setAwayScore={setAwayScore}
          location={location}
          setLocation={setLocation}
        />
      )}
    </section>
  );
}




