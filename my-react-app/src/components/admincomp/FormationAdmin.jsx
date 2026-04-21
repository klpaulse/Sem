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
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedFormation, setSelectedFormation] = useState("4-3-3");
  const [activeSide, setActiveSide] = useState("home");

  const fieldRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  // ⭐ Hent spillere for valgt lag
  useEffect(() => {
    async function loadPlayers() {
      if (!match) return;

      const teamId =
        activeSide === "home" ? match.homeTeamId : match.awayTeamId;

      if (!teamId) return;

      const ref = collection(db, "teams", teamId, "players");
      const snap = await getDocs(ref);

      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAllPlayers(list);
    }

    loadPlayers();
  }, [match, activeSide]);

  // ⭐ Hent formasjon for valgt side
  useEffect(() => {
    if (!match?.id) return;

    const ref = doc(db, "matches", match.id, "formation", activeSide);

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
  }, [match, activeSide]);

  // ⭐ Spillere som ikke er på banen
  const benchPlayers = allPlayers.filter(
    (p) => !players.some((pos) => pos.id === p.id)
  );

  // ⭐ Formasjon-velger med horisontal halv-bane skalering
function applyFormation(formationName) {
  setSelectedFormation(formationName);

  const preset = FORMATIONS[formationName];
  if (!preset) return;

  const OFFSET_HOME = 8;   // behold denne – hjemmelag er bra nå
  const OFFSET_AWAY = 7;   // flytt bortelag litt mer opp

  const newPositions = preset.map((pos) => {
    let finalY;

    if (activeSide === "home") {
      // Hjemmelag → speilvend → skaler → skyv ned mot midten
      const mirroredY = 100 - pos.y;
      finalY = mirroredY * 0.5 + OFFSET_HOME;
    } else {
      // Bortelag → skaler → skyv opp mot midten
      finalY = 50 + (pos.y * 0.5) - OFFSET_AWAY;
    }

    return {
      id: pos.id,
      name: "",
      number: "",
      x: pos.x,
      y: finalY,
    };
  });

  setPlayers(newPositions);
}










  // ⭐ Start dragging
  function startDrag(id, fromBench = false) {
    setDraggingId(id);

    if (fromBench) {
      const p = allPlayers.find((pl) => pl.id === id);
      if (!p) return;

      setPlayers((prev) => [
        ...prev,
        {
          id: p.id,
          name: p.name,
          number: p.number,
          x: 50, // midt på banen
          y: activeSide === "home" ? 25 : 75, // midt i halvdel
        },
      ]);
    }
  }

  // ⭐ Stopp dragging
  function stopDrag() {
    setDraggingId(null);
  }

  // ⭐ Flytt spiller
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

  // ⭐ Lagre formasjon
  async function saveFormation() {
    if (!match?.id) return;

    const ref = doc(db, "matches", match.id, "formation", activeSide);

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
    <div className="formation-admin">
      <h2 className="formation-admin__title">Formasjon (Admin)</h2>

      {/* ⭐ Side-velger */}
      <div className="formation-admin__side-toggle">
        <button
          onClick={() => setActiveSide("home")}
          className={
            "formation-admin__side-button" +
            (activeSide === "home"
              ? " formation-admin__side-button--active"
              : "")
          }
        >
          Hjemmelag
        </button>

        <button
          onClick={() => setActiveSide("away")}
          className={
            "formation-admin__side-button" +
            (activeSide === "away"
              ? " formation-admin__side-button--active"
              : "")
          }
        >
          Bortelag
        </button>
      </div>

      {/* ⭐ Formasjon-velger */}
      <div className="formation-admin__formation-select">
        <label>Formasjon:</label>
        <select
          value={selectedFormation}
          onChange={(e) => applyFormation(e.target.value)}
        >
          {Object.keys(FORMATIONS).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* ⭐ Benk */}
      <div className="formation-admin__bench">
        <h3 className="formation-admin__bench-title">
          Spillere ({activeSide === "home" ? "Hjemme" : "Borte"})
        </h3>

        <div className="formation-admin__bench-list">
          {benchPlayers.map((p) => (
            <div
              key={p.id}
              onMouseDown={() => startDrag(p.id, true)}
              className="formation-admin__bench-player"
            >
              {p.number} – {p.name}
            </div>
          ))}
        </div>
      </div>

      {/* ⭐ Banen */}
      <div
        ref={fieldRef}
        onMouseMove={onMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        className="formation-admin__field-wrapper"
      >
        <FormationField>
          {players.map((p) => (
            <div
              key={p.id}
              onMouseDown={() => startDrag(p.id)}
              className="formation-admin__player-on-field"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
              }}
            >
              <PlayerChip name={p.name} number={p.number} />
            </div>
          ))}
        </FormationField>
      </div>

      {/* ⭐ Lagre */}
      <button
        onClick={saveFormation}
        className="formation-admin__save-button"
      >
        Lagre formasjon
      </button>
    </div>
  );
}









