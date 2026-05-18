import { useEffect, useState } from "react";
import { db } from "../../config/Firebase";
import {
  collection, query, where, onSnapshot,
  deleteDoc, doc, updateDoc, getDocs
} from "firebase/firestore";
import { getTeam } from "../../services/TeamService";
import { generateSlug } from "../../utils/generateSlug";
import CreateMatchForm from "./CreateMatchForm";
import BulkImportMatches from "./BulkImportMatches";

export default function KampAdministrasjon({ divisions }) {
  const [selectedDivision, setSelectedDivision] = useState(divisions[0] || "");
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamNames, setTeamNames] = useState({});
  const [editingMatch, setEditingMatch] = useState(null);
  const [editHomeTeamId, setEditHomeTeamId] = useState("");
  const [editAwayTeamId, setEditAwayTeamId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    async function loadTeams() {
      const snap = await getDocs(collection(db, "teams"));
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    loadTeams();
  }, []);

  useEffect(() => {
    if (!selectedDivision) return;
    const q = query(collection(db, "matches"), where("division", "==", selectedDivision));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const db2 = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return da - db2;
      });
      setMatches(list);
    });
    return () => unsub();
  }, [selectedDivision]);

  useEffect(() => {
    async function loadNames() {
      const map = {};
      for (const m of matches) {
        if (!map[m.homeTeamId]) map[m.homeTeamId] = await getTeam(m.homeTeamId);
        if (!map[m.awayTeamId]) map[m.awayTeamId] = await getTeam(m.awayTeamId);
      }
      setTeamNames(map);
    }
    if (matches.length > 0) loadNames();
  }, [matches]);

  const startEditing = (match) => {
    setEditingMatch(match);
    setEditHomeTeamId(match.homeTeamId || "");
    setEditAwayTeamId(match.awayTeamId || "");
    const d = match.date?.toDate ? match.date.toDate() : new Date(match.date);
    setEditDate(d.toISOString().split("T")[0]);
    setEditTime(match.time || "");
    setEditLocation(match.arena || "");
  };

  const saveEdit = async () => {
    const combinedDate = new Date(`${editDate}T${editTime}:00`);
    const homeTeamObj = teams.find(t => t.id === editHomeTeamId);
    const awayTeamObj = teams.find(t => t.id === editAwayTeamId);
    const slug = homeTeamObj && awayTeamObj
      ? generateSlug(homeTeamObj.name, awayTeamObj.name, combinedDate, editTime)
      : editingMatch.slug;
    await updateDoc(doc(db, "matches", editingMatch.id), {
      homeTeamId: editHomeTeamId,
      awayTeamId: editAwayTeamId,
      date: combinedDate,
      time: editTime || "",
      arena: editLocation || "",
      slug: slug || editingMatch.slug || "",
    });
    setEditingMatch(null);
  };

  const deleteMatch = async (id) => {
    await deleteDoc(doc(db, "matches", id));
    setDeleteConfirm(null);
  };

  return (
    <section className="kampadmin">

      {/* Divisjonsfaner */}
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

      {/* Kampliste */}
      <div className="kampadmin-list">
        {matches.length === 0 ? (
          <p className="kampadmin-empty">Ingen kamper i denne divisjonen ennå.</p>
        ) : (
          matches.map(match => {
            const dateObj = match.date?.toDate ? match.date.toDate() : new Date(match.date);
            const homeName = teamNames[match.homeTeamId]?.name || "…";
            const awayName = teamNames[match.awayTeamId]?.name || "…";
            const isEditing = editingMatch?.id === match.id;

            return (
              <div key={match.id} className="kampadmin-item">
                {isEditing ? (
                  <div className="kampadmin-edit-form">
                    <div className="kampadmin-edit-row">
                      <div className="kampadmin-field">
                        <label>Hjemmelag</label>
                        <select value={editHomeTeamId} onChange={e => setEditHomeTeamId(e.target.value)}>
                          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div className="kampadmin-field">
                        <label>Bortelag</label>
                        <select value={editAwayTeamId} onChange={e => setEditAwayTeamId(e.target.value)}>
                          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="kampadmin-edit-row">
                      <div className="kampadmin-field">
                        <label>Dato</label>
                        <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                      </div>
                      <div className="kampadmin-field">
                        <label>Tid</label>
                        <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} />
                      </div>
                      <div className="kampadmin-field">
                        <label>Bane</label>
                        <input value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="Sted/bane" />
                      </div>
                    </div>
                    <div className="kampadmin-edit-actions">
                      <button className="btn-primary btn-sm" onClick={saveEdit}>Lagre</button>
                      <button className="btn-secondary btn-sm" onClick={() => setEditingMatch(null)}>Avbryt</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="kampadmin-item-info">
                      <span className="kampadmin-item-date">
                        {dateObj.toLocaleDateString("nb-NO", { day: "numeric", month: "short" })} kl {match.time}
                      </span>
                      <span className="kampadmin-item-matchup">{homeName} – {awayName}</span>
                      {match.arena && <span className="kampadmin-item-arena">{match.arena}</span>}
                    </div>
                    <div className="kampadmin-item-actions">
                      <button className="btn-secondary btn-sm" onClick={() => startEditing(match)}>Rediger</button>
                      {deleteConfirm === match.id ? (
                        <>
                          <button className="btn-danger btn-sm" onClick={() => deleteMatch(match.id)}>Bekreft</button>
                          <button className="btn-secondary btn-sm" onClick={() => setDeleteConfirm(null)}>Avbryt</button>
                        </>
                      ) : (
                        <button className="btn-danger btn-sm" onClick={() => setDeleteConfirm(match.id)}>Slett</button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Legg til kamp */}
      <div className="kampadmin-section">
        <button
          className="kampadmin-toggle"
          onClick={() => { setShowAddForm(v => !v); setShowBulk(false); }}
        >
          {showAddForm ? "↑ Skjul" : "+ Legg til kamp"}
        </button>
        {showAddForm && <CreateMatchForm divisions={divisions} onAdded={() => setShowAddForm(false)} />}
      </div>

      {/* Bulk-import */}
      <div className="kampadmin-section">
        <button
          className="kampadmin-toggle"
          onClick={() => { setShowBulk(v => !v); setShowAddForm(false); }}
        >
          {showBulk ? "↑ Skjul" : "↓ Bulk-import"}
        </button>
        {showBulk && <BulkImportMatches />}
      </div>

    </section>
  );
}
