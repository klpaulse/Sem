import { useEffect, useState } from "react";
import { db } from "../../../config/Firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { getTeam } from "../../../services/TeamService";

export default function AdminReporters() {
  const [matches, setMatches] = useState([]);
  const [teamNames, setTeamNames] = useState({});
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [reporterEmail, setReporterEmail] = useState("");

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "matches"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const active = list.filter(m => m.status !== "finished");
      setMatches(active);

      const divs = [...new Set(active.map(m => m.division?.trim()).filter(Boolean))];
      divs.sort();
      setDivisions(divs);
    }
    load();
  }, []);

  useEffect(() => {
    async function loadNames() {
      const map = {};
      for (const m of matches) {
        if (m.homeTeamId && !map[m.homeTeamId]) {
          map[m.homeTeamId] = await getTeam(m.homeTeamId);
        }
        if (m.awayTeamId && !map[m.awayTeamId]) {
          map[m.awayTeamId] = await getTeam(m.awayTeamId);
        }
      }
      setTeamNames(map);
    }
    if (matches.length > 0) loadNames();
  }, [matches]);

  const filteredMatches = matches.filter(m => m.division.trim() === selectedDivision);

  async function addReporter() {
    if (!reporterEmail.trim() || !selectedMatch) return;
    await updateDoc(doc(db, "matches", selectedMatch.id), {
      reporters: arrayUnion(reporterEmail.trim())
    });
    setSelectedMatch(prev => ({
      ...prev,
      reporters: [...(prev.reporters || []), reporterEmail.trim()]
    }));
    setReporterEmail("");
  }

  async function removeReporter(email) {
    await updateDoc(doc(db, "matches", selectedMatch.id), {
      reporters: arrayRemove(email)
    });
    setSelectedMatch(prev => ({
      ...prev,
      reporters: prev.reporters.filter(r => r !== email)
    }));
  }

  return (
    <section>
      <h2>Gi tilgang til live-rapport</h2>

      {/* STEG 1 – Velg divisjon */}
      <label>Divisjon:</label>
      <select
        value={selectedDivision}
        onChange={(e) => {
          setSelectedDivision(e.target.value);
          setSelectedMatch(null);
        }}
      >
        <option value="">Velg divisjon</option>
        {divisions.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* STEG 2 – Velg kamp */}
      {selectedDivision && (
        <>
          <label>Kamp:</label>
          <select
            value={selectedMatch?.id || ""}
            onChange={(e) => {
              const m = filteredMatches.find(m => m.id === e.target.value);
              setSelectedMatch(m || null);
            }}
          >
            <option value="">Velg kamp</option>
            {filteredMatches.map(m => (
              <option key={m.id} value={m.id}>
                {teamNames[m.homeTeamId]?.name || "?"} vs {teamNames[m.awayTeamId]?.name || "?"} – {m.time}
              </option>
            ))}
          </select>
        </>
      )}

      {/* STEG 3 – Legg til reportere */}
      {selectedMatch && (
        <div>
          <h3>
            {teamNames[selectedMatch.homeTeamId]?.name} vs {teamNames[selectedMatch.awayTeamId]?.name}
          </h3>

          <h4>Reportere:</h4>
          {(selectedMatch.reporters || []).length === 0 && (
            <p>Ingen reportere lagt til</p>
          )}
          {(selectedMatch.reporters || []).map(email => (
            <div key={email} style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
              <span>{email}</span>
              <button onClick={() => removeReporter(email)}>Fjern</button>
            </div>
          ))}

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <input
              placeholder="E-post til reporter"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addReporter()}
            />
            <button onClick={addReporter}>Legg til</button>
          </div>
        </div>
      )}
    </section>
  );
}