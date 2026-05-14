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
  getDocs
} from "firebase/firestore";

import { getTeam } from "../../services/TeamService";
import CreateMatchForm from "./CreateMatchForm";
import BulkImportMatches from "./BulkImportMatches";
import { generateSlug } from "../../utils/generateSlug";



async function migrerSlugger() {
  const snap = await getDocs(collection(db, "matches"));
  const utenSlug = snap.docs.filter(d => !d.data().slug);

  let count = 0;
  for (const d of utenSlug) {
    const data = d.data();
    const homeTeam = await getTeam(data.homeTeamId);
    const awayTeam = await getTeam(data.awayTeamId);
    if (!homeTeam?.name || !awayTeam?.name) continue;

    const date = data.date?.toDate ? data.date.toDate() : new Date(data.date);
    const slug = generateSlug(homeTeam.name, awayTeam.name, date, data.time);

    await updateDoc(doc(db, "matches", d.id), { slug });
    count++;
  }
  return count;
}

export default function KampAdministrasjon({ divisions }) {
  const [selectedDivision, setSelectedDivision] = useState("");
  const [matches, setMatches] = useState([]);
  const [migrering, setMigrering] = useState("idle");

  const [teams, setTeams] = useState([]);

  // Redigering
  const [editingMatch, setEditingMatch] = useState(null);
  const [editHomeTeamId, setEditHomeTeamId] = useState("");
  const [editAwayTeamId, setEditAwayTeamId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const [teamNames, setTeamNames] = useState({});

  // Hent alle lag (for dropdown)
  useEffect(() => {
    async function loadTeams() {
      const snap = await getDocs(collection(db, "teams"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTeams(list);
    }
    loadTeams();
  }, []);

  // Hent kamper for valgt divisjon
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

  // Hent lagnavn for alle kamper i listen
  useEffect(() => {
    async function loadNames() {
      const map = {};

      for (const m of matches) {
        if (!map[m.homeTeamId]) {
          map[m.homeTeamId] = await getTeam(m.homeTeamId);
        }
        if (!map[m.awayTeamId]) {
          map[m.awayTeamId] = await getTeam(m.awayTeamId);
        }
      }

      setTeamNames(map);
    }

    if (matches.length > 0) {
      loadNames();
    }
  }, [matches]);

  // ⭐ Bekreft sletting
  const deleteMatch = async (id) => {
    const ok = window.confirm("Er du sikker på at du vil slette denne kampen?");
    if (!ok) return;

    await deleteDoc(doc(db, "matches", id));
  };

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
    const matchRef = doc(db, "matches", editingMatch.id);

    const combinedDate = new Date(`${editDate}T${editTime}:00`);

    const homeTeamObj = teams.find(t => t.id === editHomeTeamId);
    const awayTeamObj = teams.find(t => t.id === editAwayTeamId);
    const slug = homeTeamObj && awayTeamObj
      ? generateSlug(homeTeamObj.name, awayTeamObj.name, combinedDate, editTime)
      : editingMatch.slug;

    await updateDoc(matchRef, {
      homeTeamId: editHomeTeamId,
      awayTeamId: editAwayTeamId,
      date: combinedDate,
      time: editTime || "",
      arena: editLocation || "",
      division: editingMatch.division || "",
      season: editingMatch.season || "",
      slug: slug || editingMatch.slug || "",
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
              {matches.map((match) => {
                const dateObj = match.date?.toDate
                  ? match.date.toDate()
                  : new Date(match.date);

                return (
                  <li key={match.id} className="kampadmin-list-item">
                    <span>
                      {teamNames[match.homeTeamId]?.name || match.homeTeamId} –{" "}
                      {teamNames[match.awayTeamId]?.name || match.awayTeamId} (
                      {dateObj.toLocaleDateString("nb-NO")} kl {match.time})
                    </span>

                    <button onClick={() => startEditing(match)}>Rediger</button>
                    <button onClick={() => deleteMatch(match.id)}>Slett</button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Rediger kamp */}
      {editingMatch && (
        <div className="kampadmin-edit">
          <h3>Rediger kamp</h3>

          <label>Hjemmelag</label>
          <select
            value={editHomeTeamId}
            onChange={(e) => setEditHomeTeamId(e.target.value)}
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <label>Bortelag</label>
          <select
            value={editAwayTeamId}
            onChange={(e) => setEditAwayTeamId(e.target.value)}
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

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

      <div className="kampadmin-card">
        <h3>Bulk-import</h3>
        <BulkImportMatches />
      </div>

      <div className="kampadmin-card">
        <h3>Generer slugger for gamle kamper</h3>
        <p style={{ fontSize: "13px", color: "#ffffffaa", marginBottom: "12px" }}>
          Én-gangs migrering — gir lesbare URLer til kamper som mangler slug.
        </p>
        <button
          onClick={async () => {
            setMigrering("laster");
            try {
              const antall = await migrerSlugger();
              setMigrering(`ferdig:${antall}`);
            } catch {
              setMigrering("feil");
            }
          }}
          disabled={migrering === "laster"}
        >
          {migrering === "laster" ? "Migrerer..." : "Kjør migrering"}
        </button>

        {migrering.startsWith("ferdig:") && (
          <p style={{ color: "#4ecf7a", marginTop: "8px", fontSize: "13px" }}>
            ✓ {migrering.split(":")[1]} kamper fikk slug
          </p>
        )}
        {migrering === "feil" && (
          <p style={{ color: "#e74c3c", marginTop: "8px", fontSize: "13px" }}>
            Noe gikk galt — sjekk konsollen
          </p>
        )}
      </div>

    </section>
  );
}