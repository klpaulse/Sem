// src/components/admin/FormationAdmin.jsx
import { useState, useRef, useEffect } from "react";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../../config/Firebase";



import FormationField from "../maincomp/FormationField";
import PlayerChip from "../maincomp/PlayerChip";
import { FORMATIONS } from "../../services/formationPresets";

export default function FormationAdmin({ match }) {
  const [players, setPlayers] = useState([]);        // spillere/posisjoner på banen
  const [allPlayers, setAllPlayers] = useState([]);  // alle spillere i laget
  const [selectedFormation, setSelectedFormation] = useState("4-3-3");

  const fieldRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  // ⭐ HENT ALLE SPILLERE FRA LAGET
  useEffect(() => {
    async function loadPlayers() {
      if (!match?.homeTeamId) return;

      const ref = collection(db, "teams", match.homeTeamId, "players");
      const snap = await getDocs(ref);

      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAllPlayers(list);
    }

    loadPlayers();
  }, [match]);

  // ⭐ HENT FORMASJON LIVE FRA FIRESTORE
  useEffect(() => {
    if (!match?.id) return;

    const ref = doc(db, "matches", match.id, "formation", "current");

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const pos = data.positions || {};

        if (data.formation) {
          setSelectedFormation(data.formation);
        }

        const loadedPlayers = Object.keys(pos).map((key) => ({
          id: key,
          name: pos[key].name,
          number: pos[key].number,
          x: pos[key].x,
          y: pos[key].y,
        }));

        setPlayers(loadedPlayers);
      } else {
        setPlayers([]);
      }
    });

    return () => unsub();
  }, [match]);

  // ⭐ SPILLERE SOM IKKE ER PÅ BANEN (BENK)
  const benchPlayers = allPlayers.filter(
    (p) => !players.some((pos) => pos.id === p.id)
  );

  // ⭐ FORMASJON-VELGER
  function applyFormation(formationName) {
    setSelectedFormation(formationName);

    const preset = FORMATIONS[formationName];
    if (!preset) return;

    // tomme posisjoner uten spillere
    const newPositions = preset.map((pos) => ({
      id: pos.id,
      name: "",
      number: "",
      x: pos.x,
      y: pos.y,
    }));

    setPlayers(newPositions);
  }

  // ⭐ START DRAGGING
  function startDrag(id, fromBench = false) {
    setDraggingId(id);

    if (fromBench) {
      const p = allPlayers.find((pl) => pl.id === id);
      if (!p) return;

      // legg spilleren inn på banen midlertidig
      setPlayers((prev) => [
        ...prev,
        {
          id: p.id,
          name: p.name,
          number: p.number,
          x: 50,
          y: 50,
        },
      ]);
    }
  }

  // ⭐ STOPP DRAGGING
  function stopDrag() {
    setDraggingId(null);
  }

  // ⭐ FLYTT SPILLER
  function onMove(e) {
    if (!draggingId) return;

    const field = fieldRef.current;
    if (!field) return;

    const rect = field.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPlayers((prev) =>
      prev.map((p) => (p.id === draggingId ? { ...p, x, y } : p))
    );
  }

  // ⭐ LAGRE FORMASJON
  async function saveFormation() {
    if (!match?.id) return;

    const ref = doc(db, "matches", match.id, "formation", "current");

    const positions = {};
    players.forEach((p) => {
      positions[p.id] = {
        x: p.x,
        y: p.y,
        playerId: p.id,
        name: p.name,
        number: p.number,
      };
    });

    await setDoc(ref, {
      formation: selectedFormation,
      positions,
    });

    console.log("Formasjon lagret!");
  }

  return (
    <div style={{ padding: "1rem", color: "#fff" }}>
      <h2>Formasjon (Admin)</h2>

      {/* ⭐ FORMASJON-VELGER */}
      <div style={{ margin: "0.5rem 0 1rem" }}>
        <label style={{ marginRight: "0.5rem" }}>Formasjon:</label>
        <select
          value={selectedFormation}
          onChange={(e) => applyFormation(e.target.value)}
          style={{ padding: "6px 10px" }}
        >
          {Object.keys(FORMATIONS).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* ⭐ BENK */}
      <div style={{ marginBottom: "1rem" }}>
        <h3>Spillere</h3>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {benchPlayers.map((p) => (
            <div
              key={p.id}
              onMouseDown={() => startDrag(p.id, true)}
              style={{
                padding: "8px 12px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
                cursor: "grab",
              }}
            >
              {p.number} – {p.name}
            </div>
          ))}
        </div>
      </div>

      {/* ⭐ BANEN */}
      <div
        ref={fieldRef}
        onMouseMove={onMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        style={{ marginTop: "1rem" }}
      >
        <FormationField>
          {players.map((p) => (
            <div
              key={p.id}
              onMouseDown={() => startDrag(p.id)}
              style={{
                position: "absolute",
                left: `${p.x}%`,
                top: `${p.y}%`,
                cursor: "grab",
                transform: "translate(-50%, -50%)",
              }}
            >
              <PlayerChip name={p.name} number={p.number} x={0} y={0} />
            </div>
          ))}
        </FormationField>
      </div>

      {/* ⭐ LAGRE */}
      <button onClick={saveFormation} className="save-btn">
        Lagre formasjon
      </button>
    </div>
  );
}






