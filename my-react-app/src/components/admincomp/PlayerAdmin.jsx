import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../config/Firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function PlayerAdmin() {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [playerName, setPlayerName] = useState("");
  const [playerAge, setPlayerAge] = useState("");
  const [playerFile, setPlayerFile] = useState(null);

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editFile, setEditFile] = useState(null);

  // Hent alle lag
  useEffect(() => {
    async function loadTeams() {
      const snap = await getDocs(collection(db, "teams"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTeams(list);
    }
    loadTeams();
  }, []);

  // Når vi velger lag
  useEffect(() => {
    if (!selectedTeamId) {
      setSelectedTeam(null);
      return;
    }
    const team = teams.find((t) => t.id === selectedTeamId);
    setSelectedTeam(team || null);
  }, [selectedTeamId, teams]);

  // ⭐ Last opp bilde til Firebase Storage
  async function uploadPlayerImage(file) {
    if (!file) return null;

    const storage = getStorage();
    const fileRef = ref(storage, `players/${selectedTeamId}/${crypto.randomUUID()}`);

    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  }

  // ⭐ Legg til spiller
  async function addPlayer() {
    if (!selectedTeamId || !playerName.trim()) return;

    const teamRef = doc(db, "teams", selectedTeamId);

    const currentPlayers = Array.isArray(selectedTeam?.players)
      ? selectedTeam.players
      : Object.values(selectedTeam?.players || {});

    let imageUrl = null;
    if (playerFile) {
      imageUrl = await uploadPlayerImage(playerFile);
    }

    const newPlayer = {
      id: crypto.randomUUID(),
      name: playerName.trim(),
      age: playerAge ? Number(playerAge) : null,
      img: imageUrl
    };

    const updatedPlayers = [...currentPlayers, newPlayer];

    await updateDoc(teamRef, { players: updatedPlayers });

    setSelectedTeam((prev) => ({ ...prev, players: updatedPlayers }));
    setTeams((prev) =>
      prev.map((t) => (t.id === selectedTeamId ? { ...t, players: updatedPlayers } : t))
    );

    setPlayerName("");
    setPlayerAge("");
    setPlayerFile(null);
  }

  // ⭐ Start redigering
  function startEdit(player) {
    setEditingPlayer(player);
    setEditName(player.name);
    setEditAge(player.age || "");
    setEditFile(null);
  }

  // ⭐ Lagre endringer
  async function saveEdit() {
    if (!editingPlayer) return;

    const teamRef = doc(db, "teams", selectedTeamId);

    const currentPlayers = Array.isArray(selectedTeam.players)
      ? selectedTeam.players
      : Object.values(selectedTeam.players || {});

    let imageUrl = editingPlayer.img;

    if (editFile) {
      imageUrl = await uploadPlayerImage(editFile);
    }

    const updatedPlayers = currentPlayers.map((p) =>
      p.id === editingPlayer.id
        ? {
            ...p,
            name: editName.trim(),
            age: editAge ? Number(editAge) : null,
            img: imageUrl
          }
        : p
    );

    await updateDoc(teamRef, { players: updatedPlayers });

    setSelectedTeam((prev) => ({ ...prev, players: updatedPlayers }));
    setTeams((prev) =>
      prev.map((t) => (t.id === selectedTeamId ? { ...t, players: updatedPlayers } : t))
    );

    setEditingPlayer(null);
  }

  // ⭐ Slett spiller
  async function deletePlayer(playerId) {
    const teamRef = doc(db, "teams", selectedTeamId);

    const updatedPlayers = selectedTeam.players.filter((p) => p.id !== playerId);

    await updateDoc(teamRef, { players: updatedPlayers });

    setSelectedTeam((prev) => ({ ...prev, players: updatedPlayers }));
    setTeams((prev) =>
      prev.map((t) => (t.id === selectedTeamId ? { ...t, players: updatedPlayers } : t))
    );
  }

  return (
    <section>
      <h2>Spilleradministrasjon</h2>

      {/* Velg lag */}
      <select
        value={selectedTeamId}
        onChange={(e) => setSelectedTeamId(e.target.value)}
      >
        <option value="">Velg lag</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>

      {/* Spillere på valgt lag */}
      {selectedTeam && (
        <>
          <h3>Spillere på {selectedTeam.name}</h3>

          <ul>
            {selectedTeam.players?.map((p) => (
              <li key={p.id} style={{ marginBottom: "10px" }}>
                {p.img && (
                  <img
                    src={p.img}
                    alt={p.name}
                    width="40"
                    style={{ marginRight: "8px", borderRadius: "4px" }}
                  />
                )}
                {p.name} {p.age && `(${p.age})`}

                <button onClick={() => startEdit(p)} style={{ marginLeft: "10px" }}>
                  Endre
                </button>

                <button
                  onClick={() => deletePlayer(p.id)}
                  style={{ marginLeft: "6px", color: "red" }}
                >
                  Slett
                </button>
              </li>
            ))}
          </ul>

          {/* Rediger spiller */}
          {editingPlayer && (
            <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #444" }}>
              <h4>Rediger spiller</h4>

              <input
                type="text"
                placeholder="Navn"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />

              <input
                type="number"
                placeholder="Alder"
                value={editAge}
                onChange={(e) => setEditAge(e.target.value)}
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditFile(e.target.files[0])}
              />

              <button onClick={saveEdit}>Lagre</button>
              <button onClick={() => setEditingPlayer(null)}>Avbryt</button>
            </div>
          )}

          {/* Legg til spiller */}
          <h4>Legg til ny spiller</h4>

          <input
            type="text"
            placeholder="Navn på spiller"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <input
            type="number"
            placeholder="Alder"
            value={playerAge}
            onChange={(e) => setPlayerAge(e.target.value)}
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPlayerFile(e.target.files[0])}
          />

          <button onClick={addPlayer}>Legg til spiller</button>
        </>
      )}
    </section>
  );
}
