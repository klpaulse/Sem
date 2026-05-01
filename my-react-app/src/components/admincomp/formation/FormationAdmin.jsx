import { useState, useRef } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../config/Firebase";

import FormationField from "../../maincomp/FormationField";
import PlayerChip from "../../maincomp/PlayerChip";
import { FORMATIONS } from "../../../services/formationPresets";

import { useFormationSync } from "./useFormationSync";
import { useBenchPlayers } from "./useBenchPlayers";
import { useDragAndDrop } from "./useDragAndDrop";
import BenchList from "./BenchList";
import ConfirmModal from "./ConfirmModal";
import FormationPreview from "./FormationPreview";

export default function FormationAdmin({ match, onClose }) {
  const [activeSide, setActiveSide] = useState("home");
  const [homePositions, setHomePositions] = useState([]);
  const [awayPositions, setAwayPositions] = useState([]);
  const [mode, setMode] = useState("preview");
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const fieldRef = useRef(null);

  /* -----------------------------
      HOOKS
  ------------------------------ */
  const {
    players,
    setPlayers,
    homePlayers,
    awayPlayers,
    selectedFormation,
    setSelectedFormation,
  } = useFormationSync(match, activeSide);

  const { allPlayers } = useBenchPlayers(match, activeSide);

  const { draggingId, startDrag, removeFromField, clickTimerRef } = useDragAndDrop({
    players,
    setPlayers,
    allPlayers,
    activeSide,
    selectedFormation,
    calcFinalY,
  });

  /* -----------------------------
      HJELPEFUNKSJONER
  ------------------------------ */
  const activeTeamName =
    activeSide === "home" ? match?.homeTeamName : match?.awayTeamName;

  function calcFinalY(posY, side) {
    if (side === "home") {
      return (100 - posY) * 0.5 + 10;
    } else {
      return 50 + posY * 0.5 - 7;
    }
  }

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

    const newPositions = preset.map((pos) => ({
      slotId: pos.id,
      x: pos.x,
      y: calcFinalY(pos.y, activeSide),
    }));

    if (activeSide === "home") {
      setHomePositions(newPositions);
    } else {
      setAwayPositions(newPositions);
    }

    setPlayers((prev) =>
      prev.map((p) => {
        let closest = null;
        let closestDist = Infinity;

        newPositions.forEach((pos) => {
          const dx = p.x - pos.x;
          const dy = p.y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < closestDist) {
            closestDist = dist;
            closest = pos;
          }
        });

        return closest ? { ...p, x: closest.x, y: closest.y } : p;
      })
    );
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
        name: p.name ?? "",
        number: p.number ?? "",
        img: p.img ?? "",
      };
    });

    const bench = benchPlayers.map((p) => ({
      id: p.id ?? "",
      name: p.name ?? "",
      number: p.number ?? "",
      img: p.img ?? "",
    }));

    await setDoc(
      ref,
      { formation: selectedFormation, positions, bench },
      { merge: true }
    );

    if (activeSide === "away" || isEditingExisting) {
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
      setMode("preview");
      setIsEditingExisting(false);
    }
  }

  /* -----------------------------
      RENDER
  ------------------------------ */
  return (
    <div className="formation-admin">

      {/* PREVIEW-MODUS */}
      {mode === "preview" && (
        <FormationPreview
          match={match}
          homePlayers={homePlayers}
          awayPlayers={awayPlayers}
          showSavedToast={showSavedToast}
          onEdit={() => {
            setIsEditingExisting(true);
            setActiveSide("home");
            setMode("edit");
          }}
          
        />
      )}

      {/* EDIT-MODUS */}
      {mode === "edit" && (
        <>
          <h2 className="formation-admin__title">
            Formasjon – {activeTeamName}
          </h2>

          {/* Side-velger */}
          <div className="formation-admin__side-toggle">
            <button
              onClick={() => setActiveSide("home")}
              className={
                "formation-admin__side-button" +
                (activeSide === "home" ? " formation-admin__side-button--active" : "")
              }
            >
              Hjemmelag – {match?.homeTeamName}
            </button>
            <button
              onClick={() => setActiveSide("away")}
              className={
                "formation-admin__side-button" +
                (activeSide === "away" ? " formation-admin__side-button--active" : "")
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
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Benk over banen (hjemmelag) */}
          {activeSide === "home" && (
            <div className="formation-admin__bench">
              <h3 className="formation-admin__bench-title">
                Benk – {activeTeamName}
              </h3>
              <BenchList players={benchPlayers} onDragStart={startDrag} />
            </div>
          )}

          {/* Banen */}
          <FormationField ref={fieldRef} interactive={true}>
            {FORMATIONS[selectedFormation]?.map((pos) => (
              <div
                key={"marker-" + pos.id}
                className="formation-admin__position-marker"
                style={{
                  left: `${pos.x}%`,
                  top: `${calcFinalY(pos.y, activeSide)}%`,
                }}
              />
            ))}

            {activeSide === "away" &&
              homePlayers.map((p) => (
                <div
                  key={"home-" + p.id}
                  className="formation-admin__player-on-field formation-admin__player-on-field--ghost"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  <PlayerChip name={p.name} number={p.number} img={p.img} />
                </div>
              ))}

            {players.map((p) => (
              <div
                key={p.id}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (clickTimerRef.current) {
                    clearTimeout(clickTimerRef.current);
                    clickTimerRef.current = null;
                    removeFromField(p.id);
                    return;
                  }

                  clickTimerRef.current = setTimeout(() => {
                    clickTimerRef.current = null;
                    startDrag(p.id);
                  }, 250);
                }}
                className={
                  "formation-admin__player-on-field" +
                  (draggingId === p.id
                    ? " formation-admin__player-on-field--dragging"
                    : "")
                }
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                {p.name && (
                  <PlayerChip name={p.name} number={p.number} img={p.img} />
                )}
              </div>
            ))}
          </FormationField>

          {/* Benk under banen (bortelag) */}
          {activeSide === "away" && (
            <div className="formation-admin__bench">
              <h3 className="formation-admin__bench-title">
                Benk – {activeTeamName}
              </h3>
              <BenchList players={benchPlayers} onDragStart={startDrag} />
            </div>
          )}

          {/* Lagre-knapper */}
          {activeSide === "home" && !isEditingExisting ? (
            <button
              onClick={async () => {
                await saveFormation();
                setActiveSide("away");
              }}
              className="formation-admin__save-button"
            >
              Neste – Sett opp {match?.awayTeamName}
            </button>
          ) : (
            <button
              onClick={() => {
                if (isEditingExisting) {
                  setShowConfirmModal(true);
                } else {
                  saveFormation();
                }
              }}
              className="formation-admin__save-button"
            >
              {isEditingExisting
                ? "Lagre endringer"
                : `Lagre formasjon for ${match?.awayTeamName}`}
            </button>
          )}

          {/* Bekreftelsesmodal */}
          {showConfirmModal && (
            <ConfirmModal
              title="Lagre endringer?"
              message="Er du sikker på at du vil lagre endringene i formasjonen?"
              onConfirm={async () => {
                setShowConfirmModal(false);
                await saveFormation();
              }}
              onCancel={() => setShowConfirmModal(false)}
            />
          )}
        </>
      )}
    </div>
  );
}