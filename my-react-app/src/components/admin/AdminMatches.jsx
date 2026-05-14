import { useEffect, useState } from "react";
import { getAllMatches } from "../../services/MatchService";
import { getTeam } from "../../services/TeamService";
import { db } from "../../config/Firebase";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { normalizeDate } from "../../utils/normalizeDate";

export default function AdminMatches({ selectedDate, onSelectMatch }) {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState({});
  const [reporterMatch, setReporterMatch] = useState(null);
  const [reporterEmail, setReporterEmail] = useState("");

  // HENT ALLE KAMPER
  useEffect(() => {
    async function load() {
      const all = await getAllMatches();
      setMatches(all);
    }
    load();
  }, []);

  // HENT LAGNAVN
  useEffect(() => {
    async function loadTeams() {
      const cache = {};
      for (const m of matches) {
        if (m.homeTeamId && !cache[m.homeTeamId]) {
          cache[m.homeTeamId] = await getTeam(m.homeTeamId);
        }
        if (m.awayTeamId && !cache[m.awayTeamId]) {
          cache[m.awayTeamId] = await getTeam(m.awayTeamId);
        }
      }
      setTeams(cache);
    }
    if (matches.length > 0) loadTeams();
  }, [matches]);

  // LEGG TIL REPORTER
  async function addReporter() {
    if (!reporterEmail.trim() || !reporterMatch) return;

    await updateDoc(doc(db, "matches", reporterMatch.id), {
      reporters: arrayUnion(reporterEmail.trim())
    });

    setReporterMatch(prev => ({
      ...prev,
      reporters: [...(prev.reporters || []), reporterEmail.trim()]
    }));

    setMatches(prev =>
      prev.map(m =>
        m.id === reporterMatch.id
          ? { ...m, reporters: [...(m.reporters || []), reporterEmail.trim()] }
          : m
      )
    );

    setReporterEmail("");
  }

  // FJERN REPORTER
  async function removeReporter(email) {
    await updateDoc(doc(db, "matches", reporterMatch.id), {
      reporters: arrayRemove(email)
    });

    setReporterMatch(prev => ({
      ...prev,
      reporters: prev.reporters.filter(r => r !== email)
    }));

    setMatches(prev =>
      prev.map(m =>
        m.id === reporterMatch.id
          ? { ...m, reporters: m.reporters.filter(r => r !== email) }
          : m
      )
    );
  }

  // ⭐ SETT KAMP SOM DAGENS LIVEKAMP (FLERE LOV)
  async function setFeatured(matchId) {
    await updateDoc(doc(db, "matches", matchId), {
      featuredLive: true
    });

    setMatches(prev =>
      prev.map(m =>
        m.id === matchId
          ? { ...m, featuredLive: true }
          : m // ikke rør andre kamper
      )
    );
  }

  async function removeFeatured(matchId) {
  await updateDoc(doc(db, "matches", matchId), {
    featuredLive: false
  });

  setMatches(prev =>
    prev.map(m =>
      m.id === matchId
        ? { ...m, featuredLive: false }
        : m
    )
  );
}

  // DATO-FILTRERING
  if (!selectedDate) return <p>Velg en dato</p>;

  const normalizedSelected = normalizeDate(selectedDate);
  if (!normalizedSelected) return <p>Ugyldig dato valgt</p>;

  const selectedDay = normalizedSelected.toISOString().split("T")[0];

  const matchesForDay = matches.filter((m) => {
    const matchDate = normalizeDate(m.date);
    if (!matchDate) return false;
    return matchDate.toISOString().split("T")[0] === selectedDay;
  });

  return (
    <section className="admin-page">
      <h1>Kamper denne dagen</h1>

      {matchesForDay.length === 0 && <p>Ingen kamper denne dagen.</p>}

      {matchesForDay.map((m) => (
        <div
          key={m.id}
          className="admin-match-row"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span>
            {teams[m.homeTeamId]?.name || "?"} – {teams[m.awayTeamId]?.name || "?"}
          </span>

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => onSelectMatch(m)}>🎙 Start live</button>
            <button onClick={() => setReporterMatch(m)}>👤 Reportere</button>
            <button onClick={() => setFeatured(m.id)}>⭐ Dagens livekamp</button>
            <button onClick={() => removeFeatured(m.id)}>❌ Fjern dagens kamp</button>

          </div>
        </div>
      ))}

      {/* REPORTER-MODAL */}
      {reporterMatch && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100
          }}
        >
          <div
            style={{
              background: "#1a1a1a",
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "400px",
              border: "1px solid #333"
            }}
          >
            <h3 style={{ color: "#fff", marginBottom: "4px" }}>
              {teams[reporterMatch.homeTeamId]?.name} –{" "}
              {teams[reporterMatch.awayTeamId]?.name}
            </h3>

            <p
              style={{
                color: "#ffffff66",
                fontSize: "13px",
                marginBottom: "16px"
              }}
            >
              Administrer reportere
            </p>

            {(reporterMatch.reporters || []).length === 0 && (
              <p style={{ color: "#ffffff44", fontStyle: "italic" }}>
                Ingen reportere lagt til
              </p>
            )}

            {(reporterMatch.reporters || []).map((email) => (
              <div
                key={email}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px solid #333"
                }}
              >
                <span style={{ color: "#ffffffcc" }}>{email}</span>
                <button onClick={() => removeReporter(email)}>Fjern</button>
              </div>
            ))}

            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <input
                placeholder="E-post til reporter"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addReporter()}
                style={{ flex: 1 }}
              />
              <button onClick={addReporter}>Legg til</button>
            </div>

            <button
              onClick={() => {
                setReporterMatch(null);
                setReporterEmail("");
              }}
              style={{ width: "100%", marginTop: "12px" }}
            >
              Lukk
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
