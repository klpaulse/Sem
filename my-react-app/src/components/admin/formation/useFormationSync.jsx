import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/Firebase";

export function useFormationSync(match, activeSide) {
  const [players, setPlayers] = useState([]);
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [selectedFormation, setSelectedFormation] = useState("4-3-3");

  // Laster hjemmelagets spillere (for ghost-visning og preview)
  useEffect(() => {
    if (!match?.id) return;
    const ref = doc(db, "matches", match.id, "formations", "home");

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const pos = snap.data().positions || {};
      setHomePlayers(
        Object.keys(pos).map((key) => ({
          id: key,
          name: pos[key].name,
          number: pos[key].number,
          x: pos[key].x,
          y: pos[key].y,
          img: pos[key].img || "",
        }))
      );
    });

    return () => unsub();
  }, [match]);

  // Laster bortelagets spillere (for preview)
  useEffect(() => {
    if (!match?.id) return;
    const ref = doc(db, "matches", match.id, "formations", "away");

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const pos = snap.data().positions || {};
      setAwayPlayers(
        Object.keys(pos).map((key) => ({
          id: key,
          name: pos[key].name,
          number: pos[key].number,
          x: pos[key].x,
          y: pos[key].y,
          img: pos[key].img || "",
        }))
      );
    });

    return () => unsub();
  }, [match]);

  // Laster aktivt lags formasjon og spillerposisjoner
  useEffect(() => {
    if (!match?.id) return;
    const ref = doc(db, "matches", match.id, "formations", activeSide);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setPlayers([]);
        return;
      }

      const data = snap.data();
      if (data.formation) setSelectedFormation(data.formation);

      const pos = data.positions || {};
      setPlayers(
        Object.keys(pos).map((key) => ({
          id: pos[key].playerId,
          name: pos[key].name,
          number: pos[key].number,
          x: pos[key].x,
          y: pos[key].y,
          img: pos[key].img || "",
        }))
      );
    });

    return () => unsub();
  }, [match, activeSide]);

  return {
    players,
    setPlayers,
    homePlayers,
    awayPlayers,
    selectedFormation,
    setSelectedFormation,
  };
}