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
  addDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function LagAdministrasjon({ divisions }) {
  const [selectedDivision, setSelectedDivision] = useState(divisions[0] || "");
  const [teams, setTeams] = useState([]);
  const [expandedTeam, setExpandedTeam] = useState(null);

  // Team editing
  const [editingTeam, setEditingTeam] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [movingTeam, setMovingTeam] = useState(null);
  const [moveTargetDivision, setMoveTargetDivision] = useState("");

  // Add team form
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDivision, setNewTeamDivision] = useState("");
  const [teamAdded, setTeamAdded] = useState(false);

  // Player management
  const [addingPlayerForTeam, setAddingPlayerForTeam] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [playerBirthdate, setPlayerBirthdate] = useState("");
  const [playerFile, setPlayerFile] = useState(null);

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editPlayerName, setEditPlayerName] = useState("");
  const [editPlayerBirthdate, setEditPlayerBirthdate] = useState("");
  const [editPlayerFile, setEditPlayerFile] = useState(null);

  // Bulk import
  const [showBulk, setShowBulk] = useState(false);
  const [bulkDivision, setBulkDivision] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkDone, setBulkDone] = useState(false);

  useEffect(() => {
    if (!selectedDivision) return;
    const q = query(collection(db, "teams"), where("division", "==", selectedDivision));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setTeams(list);
    });
    return () => unsub();
  }, [selectedDivision]);

  /* -------- TEAM ACTIONS -------- */
  async function addTeam() {
    if (!newTeamName.trim() || !newTeamDivision) return;
    await addDoc(collection(db, "teams"), {
      name: newTeamName.trim(),
      division: newTeamDivision,
      players: [],
    });
    setNewTeamName("");
    setShowAddTeam(false);
    setTeamAdded(true);
    setTimeout(() => setTeamAdded(false), 2500);
  }

  async function saveTeamName() {
    if (!editName.trim()) return;
    await updateDoc(doc(db, "teams", editingTeam), { name: editName.trim() });
    setEditingTeam(null);
  }

  async function moveTeam(teamId) {
    if (!moveTargetDivision) return;
    await updateDoc(doc(db, "teams", teamId), { division: moveTargetDivision });
    setMovingTeam(null);
    setMoveTargetDivision("");
  }

  async function deleteTeam(teamId) {
    await deleteDoc(doc(db, "teams", teamId));
    setConfirmDelete(null);
    if (expandedTeam === teamId) setExpandedTeam(null);
  }

  /* -------- IMAGE UPLOAD -------- */
  async function uploadImage(teamId, file) {
    const storage = getStorage();
    const fileRef = ref(storage, `players/${teamId}/${crypto.randomUUID()}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  }

  /* -------- PLAYER ACTIONS -------- */
  function calcAge(birthdate) {
    if (!birthdate) return null;
    const diff = Date.now() - new Date(birthdate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  async function addPlayer(team) {
    if (!playerName.trim()) return;
    let imgUrl = null;
    if (playerFile) imgUrl = await uploadImage(team.id, playerFile);
    const newPlayer = {
      id: crypto.randomUUID(),
      name: playerName.trim(),
      birthdate: playerBirthdate || null,
      img: imgUrl,
    };
    const updated = [...(team.players || []), newPlayer];
    await updateDoc(doc(db, "teams", team.id), { players: updated });
    setPlayerName("");
    setPlayerBirthdate("");
    setPlayerFile(null);
    setAddingPlayerForTeam(null);
  }

  async function savePlayer(team) {
    let imgUrl = editingPlayer.img;
    if (editPlayerFile) imgUrl = await uploadImage(team.id, editPlayerFile);
    const updated = (team.players || []).map((p) =>
      p.id === editingPlayer.id
        ? { ...p, name: editPlayerName.trim(), birthdate: editPlayerBirthdate || null, img: imgUrl }
        : p
    );
    await updateDoc(doc(db, "teams", team.id), { players: updated });
    setEditingPlayer(null);
  }

  async function deletePlayer(team, playerId) {
    const updated = (team.players || []).filter((p) => p.id !== playerId);
    await updateDoc(doc(db, "teams", team.id), { players: updated });
  }

  /* -------- BULK IMPORT -------- */
  async function bulkImport() {
    if (!bulkDivision || !bulkText.trim()) return;
    const names = bulkText.split("\n").map((n) => n.trim()).filter(Boolean);
    for (const name of names) {
      await addDoc(collection(db, "teams"), { name, division: bulkDivision, players: [] });
    }
    setBulkText("");
    setBulkDone(true);
    setShowBulk(false);
    setTimeout(() => setBulkDone(false), 2500);
  }

  /* -------- RENDER -------- */
  return (
    <section className="lagadmin">

      {/* Division tabs */}
      <div className="lagadmin-division-tabs">
        {divisions.map((div) => (
          <button
            key={div}
            className={"lagadmin-division-tab" + (selectedDivision === div ? " active" : "")}
            onClick={() => setSelectedDivision(div)}
          >
            {div}
          </button>
        ))}
      </div>

      {/* Team list */}
      <div className="lagadmin-team-list">
        {teams.length === 0 && (
          <p className="lagadmin-empty">Ingen lag i denne divisjonen ennå.</p>
        )}

        {teams.map((team) => (
          <div
            key={team.id}
            className={"lagadmin-team" + (expandedTeam === team.id ? " expanded" : "")}
          >
            {/* Team header row */}
            <div
              className="lagadmin-team-header"
              onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
            >
              {editingTeam === team.id ? (
                <input
                  className="lagadmin-team-name-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveTeamName()}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <span className="lagadmin-team-name">{team.name}</span>
              )}

              <div className="lagadmin-team-meta" onClick={(e) => e.stopPropagation()}>
                <span className="lagadmin-player-count">
                  {(team.players || []).length} spillere
                </span>
                {editingTeam === team.id ? (
                  <>
                    <button className="btn-primary btn-sm" onClick={saveTeamName}>Lagre</button>
                    <button className="btn-secondary btn-sm" onClick={() => setEditingTeam(null)}>Avbryt</button>
                  </>
                ) : movingTeam === team.id ? (
                  <>
                    <select
                      className="lagadmin-move-select"
                      value={moveTargetDivision}
                      onChange={e => setMoveTargetDivision(e.target.value)}
                      autoFocus
                    >
                      <option value="">Velg divisjon</option>
                      {divisions.filter(d => d !== selectedDivision).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <button className="btn-primary btn-sm" onClick={() => moveTeam(team.id)} disabled={!moveTargetDivision}>Flytt</button>
                    <button className="btn-secondary btn-sm" onClick={() => { setMovingTeam(null); setMoveTargetDivision(""); }}>Avbryt</button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => { setEditingTeam(team.id); setEditName(team.name); }}
                    >
                      Rediger
                    </button>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => { setMovingTeam(team.id); setMoveTargetDivision(""); }}
                    >
                      Flytt
                    </button>
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => setConfirmDelete({ teamId: team.id, name: team.name })}
                    >
                      Slett
                    </button>
                  </>
                )}
                <span className="lagadmin-chevron">{expandedTeam === team.id ? "▲" : "▼"}</span>
              </div>
            </div>

            {/* Expanded: players */}
            {expandedTeam === team.id && (
              <div className="lagadmin-players">
                {(team.players || []).length === 0 && (
                  <p className="lagadmin-empty-players">Ingen spillere lagt til ennå.</p>
                )}

                {(team.players || []).map((p) => (
                  <div key={p.id} className="lagadmin-player">
                    {editingPlayer?.id === p.id ? (
                      <div className="lagadmin-player-edit-form">
                        <input
                          placeholder="Navn"
                          value={editPlayerName}
                          onChange={(e) => setEditPlayerName(e.target.value)}
                        />
                        <label className="lagadmin-file-label">
                          Fødselsdato
                          <input
                            type="date"
                            value={editPlayerBirthdate}
                            onChange={(e) => setEditPlayerBirthdate(e.target.value)}
                          />
                        </label>
                        <label className="lagadmin-file-label">
                          Bytt bilde
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditPlayerFile(e.target.files[0])}
                          />
                        </label>
                        <div className="lagadmin-player-form-actions">
                          <button className="btn-primary btn-sm" onClick={() => savePlayer(team)}>Lagre</button>
                          <button className="btn-secondary btn-sm" onClick={() => setEditingPlayer(null)}>Avbryt</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="lagadmin-player-info">
                          {p.img
                            ? <img src={p.img} alt={p.name} className="lagadmin-player-img" />
                            : <div className="lagadmin-player-placeholder">{p.name?.charAt(0) ?? "?"}</div>
                          }
                          <span className="lagadmin-player-name">{p.name}</span>
                          {p.birthdate && (
                            <span className="lagadmin-player-age">{calcAge(p.birthdate)} år</span>
                          )}
                        </div>
                        <div className="lagadmin-player-actions">
                          <button
                            className="btn-secondary btn-sm"
                            onClick={() => {
                              setEditingPlayer(p);
                              setEditPlayerName(p.name);
                              setEditPlayerBirthdate(p.birthdate || "");
                              setEditPlayerFile(null);
                            }}
                          >
                            Endre
                          </button>
                          <button className="btn-danger btn-sm" onClick={() => deletePlayer(team, p.id)}>Slett</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Add player inline */}
                {addingPlayerForTeam === team.id ? (
                  <div className="lagadmin-add-player-form">
                    <input
                      placeholder="Navn"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addPlayer(team)}
                      autoFocus
                    />
                    <label className="lagadmin-file-label">
                      Fødselsdato
                      <input
                        type="date"
                        value={playerBirthdate}
                        onChange={(e) => setPlayerBirthdate(e.target.value)}
                      />
                    </label>
                    <label className="lagadmin-file-label">
                      Velg bilde
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPlayerFile(e.target.files[0])}
                      />
                    </label>
                    <div className="lagadmin-player-form-actions">
                      <button className="btn-primary btn-sm" onClick={() => addPlayer(team)}>Legg til</button>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => {
                          setAddingPlayerForTeam(null);
                          setPlayerName("");
                          setPlayerBirthdate("");
                          setPlayerFile(null);
                        }}
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="lagadmin-add-player-btn"
                    onClick={() => setAddingPlayerForTeam(team.id)}
                  >
                    + Legg til spiller
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add team + feedback */}
      <div className="lagadmin-bottom">
        {teamAdded && <p className="lagadmin-feedback">Lag lagt til!</p>}
        {bulkDone && <p className="lagadmin-feedback">Lag importert!</p>}

        {showAddTeam ? (
          <div className="lagadmin-add-team-form">
            <input
              placeholder="Lagnavn"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTeam()}
              autoFocus
            />
            <select
              value={newTeamDivision}
              onChange={(e) => setNewTeamDivision(e.target.value)}
            >
              <option value="">Velg divisjon</option>
              {divisions.map((div) => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
            <div className="lagadmin-add-team-actions">
              <button className="btn-primary" onClick={addTeam}>Legg til</button>
              <button className="btn-secondary" onClick={() => setShowAddTeam(false)}>Avbryt</button>
            </div>
          </div>
        ) : (
          <button
            className="lagadmin-add-btn"
            onClick={() => { setShowAddTeam(true); setNewTeamDivision(selectedDivision); }}
          >
            + Legg til lag
          </button>
        )}

        {/* Bulk import collapsible */}
        <div className="lagadmin-bulk-section">
          <button className="lagadmin-bulk-toggle" onClick={() => setShowBulk(!showBulk)}>
            Masseimport {showBulk ? "▲" : "▼"}
          </button>
          {showBulk && (
            <div className="lagadmin-bulk-form">
              <select value={bulkDivision} onChange={(e) => setBulkDivision(e.target.value)}>
                <option value="">Velg divisjon</option>
                {divisions.map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Skriv ett lagnavn per linje..."
                rows={5}
              />
              <button className="btn-primary" onClick={bulkImport}>Importer</button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="lagadmin-overlay">
          <div className="lagadmin-confirm">
            <p>Slett <strong>{confirmDelete.name}</strong>?</p>
            <p className="lagadmin-confirm-warning">Alle spillere i laget slettes også. Dette kan ikke angres.</p>
            <div className="lagadmin-confirm-actions">
              <button className="btn-danger" onClick={() => deleteTeam(confirmDelete.teamId)}>Slett</button>
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Avbryt</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
