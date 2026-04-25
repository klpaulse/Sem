// src/components/admin/FormationAdmin.jsx
import { useState, useRef, useEffect } from "react";
import {
  doc,
  setDoc,
  onSnapshot,
  getDoc
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
  const [homePlayers, setHomePlayers] = useState([])
  const [draggingId, setDraggingId] = useState(null)

 const fieldRef = useRef(null);
 const selectedPlayerRef = useRef(null)
 const clickTimerRef = useRef(null)

  const activeTeamName =
    activeSide === "home" ? match?.homeTeamName : match?.awayTeamName;

  /* -----------------------------
      AUTO-VELG HJEMMELAG
  ------------------------------ */
  useEffect(() => {
    if (!match) return;
    setActiveSide("home");
  }, [match]);

  useEffect(() => {
    if(!match?.id) return 
    const ref = doc(db, "matches", match.id, "formations", "home")

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()){
        const data=snap.data()
        const pos = data.positions || {}
        const loaded = Object.keys(pos).map((key) => ({
          id: key,
          name: pos[key].name,
          number: pos[key].number,
          x: pos[key].x,
          y: pos[key].y,
        }))
        setHomePlayers(loaded)
      }
    })
    return () => unsub()
  }, [match])

  /* -----------------------------
      HENT SPILLERE (ARRAY)
  ------------------------------ */
  useEffect(() => {
    async function loadPlayers() {
      if (!match) return;

      const teamId =
        activeSide === "home" ? match.homeTeamId : match.awayTeamId;

      if (!teamId) return;

      const teamRef = doc(db, "teams", teamId);
      const snap = await getDoc(teamRef);

      if (!snap.exists()) {
        setAllPlayers([]);
        return;
      }

      const data = snap.data();
      setAllPlayers(data.players || []);
    }

    loadPlayers();
  }, [match, activeSide]);

  /* -----------------------------
      HENT FORMASJON
  ------------------------------ */
  useEffect(() => {
    if (!match?.id) return;

    const ref = doc(db, "matches", match.id, "formations", activeSide);

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

  useEffect(() => {
    function handlePointerMove(e) {

      if (!selectedPlayerRef.current) return
      const field = fieldRef.current
      if (!field) return
    
      const rect = field.getBoundingClientRect()
      const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
      const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100))

      setPlayers((prev) => 
      prev.map((p) => (p.id === selectedPlayerRef.current? {...p, x, y} :p))
    )
    }
    function handlePointerUp() {
      const currentId = selectedPlayerRef.current
      selectedPlayerRef.current = null
      setDraggingId(null)

      if(!currentId) return

      const preset = FORMATIONS[selectedFormation]
      if(!preset) return

      const OFFSET_HOME = 8
      const OFFSET_AWAY = 7
      const SNAP_DISTANCE = 10
       
      setPlayers((prev) => {
        return prev.map((p) => {
          if (p.id !== currentId) return p
          let closestPos = null
          let closestDist = Infinity

          preset.forEach((pos) => {
            let finalY
            if (activeSide === "home"){
              const mirroredY = 100 - pos.y 
              finalY = mirroredY * 0.5 + OFFSET_HOME
            } else {
              finalY = 50 + pos.y * 0.5 - OFFSET_AWAY
            }
            
            const dx = p.x - pos.x
            const dy = p.y - finalY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < closestDist){
              closestDist = dist
              closestPos = { x: pos.x, y: finalY}
            }
          })

          if (closestDist < SNAP_DISTANCE && closestPos){
            return {...p, x:closestPos.x, y: closestPos.y}
          }
          return p 
        })
      })
}

window.addEventListener("pointermove", handlePointerMove)
window.addEventListener("pointerup", handlePointerUp)

return () => {
  window.removeEventListener("pointermove", handlePointerMove)
  window.removeEventListener("pointerup", handlePointerUp)
}
}, [])


  /* -----------------------------
      BENK
  ------------------------------ */
  const benchPlayers = allPlayers.filter(
    (p) => !players.some((pos) => pos.id === p.id)
  );

  /* -----------------------------
      FORMASJON
  ------------------------------ */
  function applyFormation(formationName) {
    setSelectedFormation(formationName);

    const preset = FORMATIONS[formationName];
    if (!preset) return;

    const OFFSET_HOME = 8;
    const OFFSET_AWAY = 7;

    const newPositions = preset.map((pos) => {
      let finalY;

      if (activeSide === "home") {
        const mirroredY = 100 - pos.y;
        finalY = mirroredY * 0.5 + OFFSET_HOME;
      } else {
        finalY = 50 + pos.y * 0.5 - OFFSET_AWAY;
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

  /* -----------------------------
      DRAGGING
  ------------------------------ */
  function startDrag(id, fromBench = false) {
    if (fromBench){
      const p = allPlayers.find((pl) => pl.id === id)
      if(!p) return 
      if (players.some((pl) => pl.id === id)) return
  
      setPlayers((prev) => [
        ...prev,
        {
          id: p.id,
          name: p.name,
          number: p.number,
          x: 50,
          y: activeSide === "home" ? 25 : 75,
        },
        
      ]);
    }
    selectedPlayerRef.current = id
    setDraggingId(id)
  }

  function removeFromField(id) {
     console.log("removeFromField kalt med id:", id)
    setPlayers((prev) => prev.filter((p) => p.id !==id))
  }

  /* -----------------------------
      LAGRE
  ------------------------------ */
  async function saveFormation() {
    if (!match?.id) return;

    const ref = doc(db, "matches", match.id, "formations", activeSide);

    const positions = {};
    players.forEach((p) => {
      positions[p.id] = {
        x: p.x,
        y: p.y,
        playerId: p.id,
        name: p.name || "",
        number: p.number || "",
      };
    });

    await setDoc(ref, {
      formation: selectedFormation,
      positions,
    });

  }

  /* -----------------------------
      RENDER
  ------------------------------ */
  return (
    <div className="formation-admin">
      <h2 className="formation-admin__title">
        Formasjon – {activeTeamName}
      </h2>

      {/* Side-velger */}
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
          Hjemmelag – {match?.homeTeamName}
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
          Bortelag – {match?.awayTeamName}
        </button>
      </div>

      {/* Formasjon-velger */}
      <div className="formation-admin__formation-select">
        <label>Formasjon for {activeTeamName}:</label>
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

      {/* Benk */}
      <div className="formation-admin__bench">
        <h3 className="formation-admin__bench-title">
          Benk – {activeTeamName}
        </h3>

        <div className="formation-admin__bench-list">
          {benchPlayers.map((p) => (
            <div
              key={p.id}
              onPointerDown={(e) => {e.preventDefault(); startDrag (p.id, true)}}
              className="formation-admin__bench-player"
            >
              {p.number} – {p.name}
            </div>
          ))}
        </div>
      </div>

      {/* Banen */}
      <FormationField ref={fieldRef}>
        {FORMATIONS[selectedFormation]?.map((pos) => {
          let finalY
          if(activeSide === "home") {
            const mirroredY = 100 - pos.y
            finalY = mirroredY * 0.5 + 8
          } else {
            finalY = 50 + pos.y * 0.5-7
          }
          return(
            <div
            key={"marker-" + pos.id}
            className="formation-admin__position-marker"
            style={{left: `${pos.x}%`, top: `${finalY}%`}}
            />

        
          )
        })}
        {activeSide === "away" && homePlayers.map((p) => (
              <div
              key={"home" + p.id}
              className="formation-admin__player-on-field formation-admin__player-on-field--ghost"
               style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
               <PlayerChip name={p.name} number={p.number} />
              </div> 
        ))}
      
        {players.map((p) => (
          <div
            key={p.id}
            onPointerDown={(e) => {e.preventDefault(); e.stopPropagation(); console.log("pointerdown")
              if (clickTimerRef.current) {
               clearTimeout(clickTimerRef.current)
               clickTimerRef.current = null
                removeFromField(p.id)
                return
              }
              clickTimerRef.current = setTimeout(() => {
                clickTimerRef.current = null 
                startDrag(p.id)
              }, 250)
            }}

            className={"formation-admin__player-on-field" + (draggingId === p.id ? " formation-admin__player-on-field--dragging" : "")}
            
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
          >

            <PlayerChip name={p.name} number={p.number} />
          </div>
        ))}
      </FormationField>

      {/* Lagre */}
      {activeSide === "home" ? (
        
      <button
        onClick={async () => {await saveFormation(); setActiveSide("away");}}
        className="formation-admin__save-button"
      >
        Neste - Sett opp {match?.awayTeamName}
        </button>
        
      ) : (
        <button
        onClick={saveFormation}
         className="formation-admin__save-button"
         >
      
      Lagre formasjon for {match?.awayTeamName}
      </button>
      
      )}
    </div>
  );
}













