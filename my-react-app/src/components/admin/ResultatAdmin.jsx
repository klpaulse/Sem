import { useEffect, useState } from "react";
import { db } from "../../config/Firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { getTeam } from "../../services/TeamService";
import ResultsForm from "./ResultsForm";

export default function ResultatAdmin() {
  const [matches, setMatches] = useState([]);
  const [teamCache, setTeamCache] = useState({});
  const [editingMatch, setEditingMatch] = useState(null);
  const [activeTab, setActiveTab] = useState("missing");
  const [selectedDivision, setSelectedDivision] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "matches"), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const da = a.date?.toDate?.() || new Date(0);
        const db2 = b.date?.toDate?.() || new Date(0);
        return da - db2;
      });
      setMatches(data);
    });
    return () => unsub();
  }, []);

  // Cache team names
  useEffect(() => {
    async function loadTeams() {
      const cache = { ...teamCache };
      let changed = false;
      for (const m of matches) {
        if (m.homeTeamId && !cache[m.homeTeamId]) {
          cache[m.homeTeamId] = await getTeam(m.homeTeamId);
          changed = true;
        }
        if (m.awayTeamId && !cache[m.awayTeamId]) {
          cache[m.awayTeamId] = await getTeam(m.awayTeamId);
          changed = true;
        }
      }
      if (changed) setTeamCache(cache);
    }
    if (matches.length > 0) loadTeams();
  }, [matches]);

  const now = new Date();

  const missingResults = matches.filter(m => {
    const matchDate = m.date?.toDate?.();
    const isPast = matchDate && matchDate < now;
    const noResult = m.homeScore == null && m.awayScore == null;
    return isPast && noResult && m.status !== "live";
  });

  const grouped = matches.reduce((acc, m) => {
    const div = m.division || "Uten divisjon";
    if (!acc[div]) acc[div] = [];
    acc[div].push(m);
    return acc;
  }, {});
  const divisions = Object.keys(grouped).sort();

  const allMatches = selectedDivision ? (grouped[selectedDivision] || []) : [];

  return (
    <section className="resultatadmin">

      <div className="home-tabs">
        <button
          className={`home-tab${activeTab === "missing" ? " active" : ""}`}
          onClick={() => setActiveTab("missing")}
        >
          Mangler resultat
          {missingResults.length > 0 && (
            <span className="resultat-count">{missingResults.length}</span>
          )}
        </button>
        <button
          className={`home-tab${activeTab === "all" ? " active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          Alle kamper
        </button>
      </div>

      {activeTab === "missing" && (
        <div className="resultat-list">
          {missingResults.length === 0 ? (
            <p className="resultat-empty">Alle kamper har resultat.</p>
          ) : (
            missingResults.map(match => (
              <MatchResultItem
                key={match.id}
                match={match}
                teamCache={teamCache}
                editingMatch={editingMatch}
                setEditingMatch={setEditingMatch}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "all" && (
        <>
          <div className="division-tabs">
            {divisions.map(div => (
              <button
                key={div}
                className={`division-tab${selectedDivision === div ? " active" : ""}`}
                onClick={() => setSelectedDivision(div)}
              >
                {div}
              </button>
            ))}
          </div>
          <div className="resultat-list">
            {!selectedDivision ? (
              <p className="resultat-empty">Velg en divisjon.</p>
            ) : allMatches.length === 0 ? (
              <p className="resultat-empty">Ingen kamper i denne divisjonen.</p>
            ) : (
              allMatches.map(match => (
                <MatchResultItem
                  key={match.id}
                  match={match}
                  teamCache={teamCache}
                  editingMatch={editingMatch}
                  setEditingMatch={setEditingMatch}
                />
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}

function MatchResultItem({ match, teamCache, editingMatch, setEditingMatch }) {
  const home = teamCache[match.homeTeamId];
  const away = teamCache[match.awayTeamId];
  const isEditing = editingMatch?.id === match.id;
  const hasResult = match.homeScore != null && match.awayScore != null;

  const dateObj = match.date?.toDate ? match.date.toDate() : new Date(match.date);
  const dateStr = dateObj.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });

  return (
    <div className={`resultat-item${isEditing ? " editing" : ""}`}>
      <div className="resultat-item-main">
        <div className="resultat-item-info">
          <span className="resultat-date">{dateStr}</span>
          <span className="resultat-matchup">
            {home?.name || "…"} – {away?.name || "…"}
          </span>
          {match.arena && <span className="resultat-arena">{match.arena}</span>}
        </div>
        <div className="resultat-item-right">
          {hasResult && (
            <span className="resultat-score">{match.homeScore} – {match.awayScore}</span>
          )}
          <button
            className={`btn-sm ${hasResult ? "btn-secondary" : "btn-primary"}`}
            onClick={() => setEditingMatch(isEditing ? null : match)}
          >
            {isEditing ? "Lukk" : hasResult ? "Rediger" : "Legg inn"}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="resultat-form-wrapper">
          <ResultsForm
            editingMatch={match}
            setEditingMatch={setEditingMatch}
          />
        </div>
      )}
    </div>
  );
}
