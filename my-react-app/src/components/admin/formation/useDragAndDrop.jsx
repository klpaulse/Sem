import { useRef, useState, useEffect } from "react";
import { FORMATIONS } from "../../../services/formationPresets";

export function useDragAndDrop({ players, setPlayers, allPlayers, activeSide, selectedFormation, calcFinalY }) {
  const selectedPlayerRef = useRef(null);
  const clickTimerRef = useRef(null);
  const activeSideRef = useRef(activeSide);
  const selectedFormationRef = useRef(selectedFormation);
  const [draggingId, setDraggingId] = useState(null);

  useEffect(() => { activeSideRef.current = activeSide }, [activeSide]);
  useEffect(() => { selectedFormationRef.current = selectedFormation }, [selectedFormation]);

  useEffect(() => {
    function handlePointerMove(e) {
      if (!selectedPlayerRef.current) return;
      const field = document.querySelector(".formation-field");
      if (!field) return;

      const rect = field.getBoundingClientRect();
      const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));

      setPlayers((prev) =>
        prev.map((p) => (p.id === selectedPlayerRef.current ? { ...p, x, y } : p))
      );
    }

    function handlePointerUp() {
      const currentId = selectedPlayerRef.current;
      selectedPlayerRef.current = null;
      setDraggingId(null);
      if (!currentId) return;

      const preset = FORMATIONS[selectedFormationRef.current];
      if (!preset) return;

      const SNAP_DISTANCE = 10;

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id !== currentId) return p;

          let closestPos = null;
          let closestDist = Infinity;

          preset.forEach((pos) => {
            const finalY = calcFinalY(pos.y, activeSideRef.current);
            const dx = p.x - pos.x;
            const dy = p.y - finalY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist) {
              closestDist = dist;
              closestPos = { x: pos.x, y: finalY };
            }
          });

          if (closestDist < SNAP_DISTANCE && closestPos) {
            return { ...p, x: closestPos.x, y: closestPos.y };
          }
          return p;
        })
      );
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  function startDrag(id, fromBench = false) {
    const isPlayer = players.some((p) => p.id === id);
    const isBench = allPlayers.some((p) => p.id === id);
    if (!isPlayer && !isBench) return;

    if (fromBench) {
      const p = allPlayers.find((pl) => pl.id === id);
      if (!p) return;
      if (players.some((pl) => pl.id === id)) return;

      const preset = FORMATIONS[selectedFormationRef.current];
      const occupied = players.map((pl) => ({ x: pl.x, y: pl.y }));

      let bestPos = { x: 50, y: activeSide === "home" ? 25 : 75 };

      if (preset) {
        for (const pos of preset) {
          const finalY = calcFinalY(pos.y, activeSide);
          const isOccupied = occupied.some(
            (o) => Math.abs(o.x - pos.x) < 5 && Math.abs(o.y - finalY) < 5
          );
          if (!isOccupied) {
            bestPos = { x: pos.x, y: finalY };
            break;
          }
        }
      }

      setPlayers((prev) => [
        ...prev,
        {
          id: p.id,
          name: p.name,
          number: p.number,
          img: p.img || "",
          x: bestPos.x,
          y: bestPos.y,
        },
      ]);
    }

    selectedPlayerRef.current = id;
    setDraggingId(id);
  }

  function removeFromField(id) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  return {
    draggingId,
    startDrag,
    removeFromField,
    clickTimerRef,
  };
}