import { useEffect, useState } from "react";
import { db } from "../../config/Firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import CreateMatchForm from "./CreateMatchForm";

export default function KampAdministrasjon({ divisions }) {
  const [selectedDivision, setSelectedDivision] = useState("");
  const [matches, setMatches] = useState([]);

  // Redigering
  const [editingMatch, setEditingMatch] = useState(null);
  const [editHomeTeam, setEditHomeTeam] = useState("");
  const [editAwayTeam, setEditAwayTeam] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");

  // LIVE: hent kamper for valgt divisjon
  useEffect(() => {
    if (!selectedDivision) return;

    const matchesRef = collection(db, "matches");
    const q = query(matchesRef, where("division", "==", selectedDivision));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sorter etter dato
      list.sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dbb = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return da - dbb;
      });

      setMatches(list);
    });

    return () => unsubscribe();
  }, [selectedDivision]);

  const deleteMatch = async (id) => {
    await deleteDoc(doc(db, "matches", id));
  };

  const startEditing = (match) => {
    setEditingMatch(match);

    // Lag-navn (gamle og nye kamper)
    setEditHomeTeam(match.homeTeamName || match.homeTeam || "");
    setEditAwayTeam(match.awayTeamName || match.awayTeam || "");

    // Dato
    const d = match.date?.toDate ? match.date.toDate() : new Date(match.date);
    setEditDate(d.toISOString().split("T")[0]);

    // Tid
    setEditTime(match.time || "");

    // Arena
    setEditLocation(match.arena || "");
  };

  const saveEdit = async () => {
  const matchRef = doc(db, "matches", editingMatch.id);

  // Kombiner dato + tid
  const combinedDate = new Date(`${editDate}T${editTime}:00`);

  await updateDoc(matchRef, {
    homeTeamName: editHomeTeam || "",
    awayTeamName: editAwayTeam || "",
    date: combinedDate,   // ← riktig navn
    time: editTime || "",
    arena: editLocation || "",
    division: editingMatch.division || "",
    season: editingMatch.season || "",
  });

  setEditingMatch(null);
};

  return (
    <section className="kampadmin-container">

      {/* Velg divisjon */}
      <div className="kampadmin-select">
        <label>Velg divisjon:</label>
        <select
          value={selectedDivision}
          onChange={(e) => setSelectedDivision(e.target.value)}
        >
          <option value="">-- Velg divisjon --</option>
          {divisions.map((div) => (
            <option key={div} value={div}>
              {div}
            </option>
          ))}
        </select>
      </div>

      {/* Liste over kamper */}
      {selectedDivision && (
        <div className="kampadmin-list">
          <h3>Kamper i {selectedDivision}</h3>

          {matches.length === 0 ? (
            <p>Ingen kamper registrert i denne divisjonen ennå.</p>
          ) : (
            <ul>
              {matches.map((match) => (
                <li key={match.id} className="kampadmin-list-item">
                  <span>
                    {match.homeTeamName || match.homeTeam} –{" "}
                    {match.awayTeamName || match.awayTeam} (
                    {match.date?.toDate
                      ? match.date.toDate().toLocaleDateString("nb-NO")
                      : match.date}{" "}
                    kl{" "}
                    {match.time})
                  </span>

                  <button onClick={() => startEditing(match)}>Rediger</button>
                  <button onClick={() => deleteMatch(match.id)}>Slett</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Rediger kamp */}
      {editingMatch && (
        <div className="kampadmin-edit">
          <h3>Rediger kamp</h3>

          <label>Hjemmelag</label>
          <input
            value={editHomeTeam}
            onChange={(e) => setEditHomeTeam(e.target.value)}
          />

          <label>Bortelag</label>
          <input
            value={editAwayTeam}
            onChange={(e) => setEditAwayTeam(e.target.value)}
          />

          <label>Dato</label>
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
          />

          <label>Tid</label>
          <input
            type="time"
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
          />

          <label>Bane / sted</label>
          <input
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
          />

          <button onClick={saveEdit}>Lagre endringer</button>
          <button onClick={() => setEditingMatch(null)}>Avbryt</button>
        </div>
      )}

      {/* Legg til kamp */}
      <div className="kampadmin-card">
        <h3>Legg til kamp</h3>
        <CreateMatchForm divisions={divisions} />
      </div>

    </section>
  );
}