import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../config/Firebase";
import { useState } from "react";

export default function AddStatusToMatches() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    const snap = await getDocs(collection(db, "matches"));
    const updates = [];

    for (const d of snap.docs) {
      const m = d.data();

      // Hopp over hvis status allerede finnes
      if (m.status) continue;

      const ref = doc(db, "matches", d.id);

      // Enkel regel: hvis kampen er spilt → finished, ellers not_started
      // (du kan justere denne senere)
      const isPlayed = m.played === true || m.homeScore != null || m.awayScore != null;

      await updateDoc(ref, {
        status: isPlayed ? "finished" : "not_started",
        events: m.events || [],
      });

      updates.push(`${d.id} → ${isPlayed ? "finished" : "not_started"}`);
    }

    setLog(updates);
    setRunning(false);
  };

  return (
    <section style={{ padding: 20 }}>
      <h2>Legg til status på eksisterende kamper</h2>
      <button onClick={run} disabled={running}>
        {running ? "Oppdaterer..." : "Kjør oppdatering"}
      </button>

      <ul>
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </section>
  );
}