import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../config/Firebase";

export default function MigrateMatches() {
  const [missingCount, setMissingCount] = useState(0);
  const [log, setLog] = useState([]);

  // Tell kamper som mangler teamId
  useEffect(() => {
    async function check() {
      const snap = await getDocs(collection(db, "matches"));
      const missing = snap.docs.filter(
        (d) => !d.data().homeTeamId || !d.data().awayTeamId
      );
      setMissingCount(missing.length);
    }
    check();
  }, []);

  const runMigration = async () => {
    const teamsSnap = await getDocs(collection(db, "teams"));
    const matchesSnap = await getDocs(collection(db, "matches"));

    const teams = teamsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    const newLog = [];

    for (const matchDoc of matchesSnap.docs) {
      const match = matchDoc.data();

      // hopp over hvis allerede migrert
      if (match.homeTeamId && match.awayTeamId) continue;

      const home = teams.find(
        (t) => t.name === match.homeTeam || t.name === match.homeTeamName
      );
      const away = teams.find(
        (t) => t.name === match.awayTeam || t.name === match.awayTeamName
      );

      if (!home || !away) {
        newLog.push(`Fant ikke lag for kamp ${matchDoc.id}`);
        continue;
      }

      await updateDoc(doc(db, "matches", matchDoc.id), {
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeTeamName: home.name,
        awayTeamName: away.name,
      });

      newLog.push(`Migrert kamp: ${matchDoc.id}`);
    }

    setLog(newLog);
    alert("Migrering fullført!");

    // Oppdater teller
    const snap = await getDocs(collection(db, "matches"));
    const missing = snap.docs.filter(
      (d) => !d.data().homeTeamId || !d.data().awayTeamId
    );
    setMissingCount(missing.length);
  };

  return (
    <section style={{ padding: "20px" }}>
      <h2>Migrering av gamle kamper</h2>

      <p>
        Kamper som mangler teamId: <strong>{missingCount}</strong>
      </p>

      <button onClick={runMigration} style={{ padding: "10px", marginTop: "10px" }}>
        Migrer nå
      </button>

      {log.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Migreringslogg</h3>
          <ul>
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}