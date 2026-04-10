import { useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../config/Firebase";

export default function MigrateMatchFields() {
  const [log, setLog] = useState([]);

  const runMigration = async () => {
    const matchesSnap = await getDocs(collection(db, "matches"));
    const newLog = [];

    for (const matchDoc of matchesSnap.docs) {
      const match = matchDoc.data();
      const updates = {};

      // Sett season hvis mangler
      if (!match.season) {
        updates.season = "2026";
      }

      // Sett played basert på score
      const hasScore =
        typeof match.homeScore === "number" &&
        typeof match.awayScore === "number";

      if (match.played === undefined) {
        updates.played = hasScore ? true : false;
      }

      // Hvis ingen endringer, hopp over
      if (Object.keys(updates).length === 0) continue;

      await updateDoc(doc(db, "matches", matchDoc.id), updates);

      newLog.push(
        `Oppdatert kamp ${matchDoc.id}: ${JSON.stringify(updates)}`
      );
    }

    setLog(newLog);
    alert("Migrering fullført!");
  };

  return (
    <section style={{ padding: "20px" }}>
      <h2>Migrering av season + played</h2>

      <button onClick={runMigration} style={{ padding: "10px", marginTop: "10px" }}>
        Kjør migrering
      </button>

      {log.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Logg</h3>
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