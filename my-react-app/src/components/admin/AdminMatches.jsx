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
    <section className="admin-matches-section">
      {matchesForDay.length === 0 && (
        <p className="admin-no-matches">Ingen kamper denne dagen.</p>
      )}

      {matchesForDay.map((m) => {
        const homeName = teams[m.homeTeamId]?.name || "?";
        const awayName = teams[m.awayTeamId]?.name || "?";
        const reporterCount = (m.reporters || []).length;

        return (
          <div key={m.id} className="admin-match-card">
            <div className="admin-match-info">
              <span className="admin-match-title">{homeName} – {awayName}</span>
              {m.time && <span className="admin-match-time">{m.time}</span>}
            </div>

            <div className="admin-match-actions">
              <button
                className="admin-btn-live"
                onClick={() => onSelectMatch(m)}
              >
                Start live
              </button>

              <button
                className={`admin-btn-featured ${m.featuredLive ? "is-featured" : ""}`}
                onClick={() => m.featuredLive ? removeFeatured(m.id) : setFeatured(m.id)}
                title={m.featuredLive ? "Fjern som dagens livekamp" : "Sett som dagens livekamp"}
              >
                {m.featuredLive ? "★ Fremhevet" : "☆ Fremhev"}
              </button>

              <button
                className="admin-btn-reporters"
                onClick={() => setReporterMatch(m)}
              >
                Reportere{reporterCount > 0 ? ` (${reporterCount})` : ""}
              </button>
            </div>
          </div>
        );
      })}

      {/* REPORTER-MODAL */}
      {reporterMatch && (
        <div className="reporter-modal-overlay">
          <div className="reporter-modal">
            <h3 className="reporter-modal-title">
              {teams[reporterMatch.homeTeamId]?.name} – {teams[reporterMatch.awayTeamId]?.name}
            </h3>
            <p className="reporter-modal-sub">Administrer reportere</p>

            <ul className="reporter-list">
              {(reporterMatch.reporters || []).length === 0 && (
                <li className="reporter-empty">Ingen reportere lagt til</li>
              )}
              {(reporterMatch.reporters || []).map((email) => (
                <li key={email} className="reporter-row">
                  <span>{email}</span>
                  <button className="btn-danger" onClick={() => removeReporter(email)}>Fjern</button>
                </li>
              ))}
            </ul>

            <div className="reporter-add-row">
              <input
                className="reporter-input"
                placeholder="E-post til reporter"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addReporter()}
              />
              <button className="btn-primary" onClick={addReporter}>Legg til</button>
            </div>

            <button
              className="btn-secondary reporter-close"
              onClick={() => { setReporterMatch(null); setReporterEmail(""); }}
            >
              Lukk
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
