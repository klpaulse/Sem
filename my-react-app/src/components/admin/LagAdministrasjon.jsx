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

import CreateTeamForm from "./CreateTeamForm";
import BulkImportTeams from "./BulkImportTeams";

export default function LagAdministrasjon({ divisions }) {
  const [selectedDivision, setSelectedDivision] = useState("");
  const [teams, setTeams] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editName, setEditName] = useState("");

  // LIVE: hent lag for valgt divisjon
  useEffect(() => {
    if (!selectedDivision) return;

    const teamsRef = collection(db, "teams");
    const q = query(teamsRef, where("division", "==", selectedDivision));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      list.sort((a, b) => a.name.localeCompare(b.name));
      setTeams(list);
    });

    return () => unsubscribe();
  }, [selectedDivision]);

  // ⭐ Bekreftelse før sletting
  const handleDelete = async (teamId) => {
    const ok = window.confirm("Er du sikker på at du vil slette dette laget?");
    if (!ok) return;

    await deleteDoc(doc(db, "teams", teamId));
  };

  // ⭐ Start redigering (kun navn)
  const startEdit = (team) => {
    setEditingTeam(team.id);
    setEditName(team.name);
  };

  // ⭐ Lagre nytt navn
  const saveEdit = async () => {
    await updateDoc(doc(db, "teams", editingTeam), {
      name: editName,
    });

    setEditingTeam(null);
    setEditName("");
  };

  return (
    <section className="lagadmin-container">

      <div className="lagadmin-select">
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

      {selectedDivision && (
        <div className="lagadmin-list">
          <h3>Lag i {selectedDivision}</h3>

          {teams.length === 0 ? (
            <p>Ingen lag registrert i denne divisjonen ennå.</p>
          ) : (
            <ul>
              {teams.map((team) => (
                <li key={team.id} className="lagadmin-list-item">
                  {editingTeam === team.id ? (
                    <>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nytt navn"
                      />
                      <button onClick={saveEdit}>Lagre</button>
                      <button onClick={() => setEditingTeam(null)}>
                        Avbryt
                      </button>
                    </>
                  ) : (
                    <>
                      <span>{team.name}</span>
                      <button onClick={() => startEdit(team)}>Rediger</button>
                      <button onClick={() => handleDelete(team.id)}>
                        Slett
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="lagadmin-card">
        <h3>Legg til lag</h3>
        <CreateTeamForm divisions={divisions} />
      </div>

      <div className="lagadmin-card">
        <h3>Legg til mange lag (bulk)</h3>
        <BulkImportTeams divisions={divisions} />
      </div>
    </section>
  );
}