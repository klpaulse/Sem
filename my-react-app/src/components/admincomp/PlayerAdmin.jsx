import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../config/Firebase";

export default function PlayerAdmin() {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [playerName, setPlayerName] = useState("");
  const [playerAge, setPlayerAge] = useState("");
  const [playerImg, setPlayerImg] = useState("");

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

  // Legg til spiller
  async function addPlayer() {
    if (!selectedTeamId || !playerName.trim()) return;

    const teamRef = doc(db, "teams", selectedTeamId);

    // Firestore lagrer arrays som maps hvis feltet ikke eksisterte fra før
    const currentPlayers = Array.isArray(selectedTeam?.players)
      ? selectedTeam.players
      : Object.values(selectedTeam?.players || {});

    const newPlayer = {
      id: crypto.randomUUID(),
      name: playerName.trim(),
      age: playerAge ? Number(playerAge) : null,
      img: playerImg || null
    };

    const updatedPlayers = [...currentPlayers, newPlayer];

    // Tving Firestore til å lagre som ARRAY
    await updateDoc(teamRef, { players: [...updatedPlayers] });

    // Oppdater lokalt
    setSelectedTeam((prev) =>
      prev ? { ...prev, players: updatedPlayers } : prev
    );

    setTeams((prev) =>
      prev.map((t) =>
        t.id === selectedTeamId ? { ...t, players: updatedPlayers } : t
      )
    );

    // Nullstill inputfeltene
    setPlayerName("");
    setPlayerAge("");
    setPlayerImg("");
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
            {Object.values(selectedTeam.players || {}).map((p) => (
              <li key={p.id}>
                {p.img && (
                  <img
                    src={p.img}
                    alt={p.name}
                    width="40"
                    style={{ marginRight: "8px", borderRadius: "4px" }}
                  />
                )}
                {p.name} {p.age && `(${p.age})`}
              </li>
            ))}
          </ul>

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
            type="text"
            placeholder="Bilde-URL (valgfritt)"
            value={playerImg}
            onChange={(e) => setPlayerImg(e.target.value)}
          />

          <button onClick={addPlayer}>Legg til spiller</button>
        </>
      )}
    </section>
  );
}