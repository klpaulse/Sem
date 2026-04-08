import { useState } from "react";
import { db } from "../../config/Firebase";
import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";

export default function BulkImportMatches() {
  const [division, setDivision] = useState("");
  const [matchText, setMatchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const importMatches = async () => {
    if (!division) {
      setMessage("Du må skrive inn en divisjon");
      return;
    }

    if (!matchText.trim()) {
      setMessage("Du må lime inn minst én kamp");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const matchesRef = collection(db, "matches");
      const teamsRef = collection(db, "teams");

      const lines = matchText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      let addedCount = 0;

      for (const line of lines) {
        // Format: "Sem - Teie | 2025-05-12 18:00 | Sem Stadion"
        const parts = line.split("|").map((p) => p.trim());
        if (parts.length < 3) continue;

        const [teams, dateStr, venue] = parts;
        const [homeTeamName, awayTeamName] = teams.split("-").map((t) => t.trim());

        // Finn lag-IDer
        const homeSnap = await getDocs(query(teamsRef, where("name", "==", homeTeamName)));
        const awaySnap = await getDocs(query(teamsRef, where("name", "==", awayTeamName)));

        if (homeSnap.empty || awaySnap.empty) {
          console.log("Fant ikke lag:", homeTeamName, awayTeamName);
          continue;
        }

        const homeTeam = homeSnap.docs[0].id;
        const awayTeam = awaySnap.docs[0].id;

        const date = new Date(dateStr);

        await addDoc(matchesRef, {
          homeTeam,
          awayTeam,
          homeTeamName,
          awayTeamName,
          division,
          date: Timestamp.fromDate(date),
          venue,
          played: false,
          homeScore: null,
          awayScore: null
        });

        addedCount++;
      }

      setMessage(`Import fullført! ${addedCount} kamper lagt til.`);
    } catch (err) {
      console.error(err);
      setMessage("Feil ved import");
    }

    setLoading(false);
  };

  return (
    <section>
      <h2>Importer kamper manuelt (bulk)</h2>

      <input
        type="number"
        placeholder="FIKS-ID / divisjon"
        value={division}
        onChange={(e) => setDivision(e.target.value)}
      />

      <textarea
        placeholder="Format: Lag A - Lag B | 2025-05-12 18:00 | Bane"
        value={matchText}
        onChange={(e) => setMatchText(e.target.value)}
        rows={8}
      />

      <button onClick={importMatches} disabled={loading}>
        {loading ? "Lagrer..." : "Importer kamper"}
      </button>

      {message && <p>{message}</p>}
    </section>
  );
}