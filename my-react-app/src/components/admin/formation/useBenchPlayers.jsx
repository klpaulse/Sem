import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../config/Firebase";

export function useBenchPlayers(match, activeSide) {
  const [allPlayers, setAllPlayers] = useState([]);

  useEffect(() => {
    async function loadPlayers() {
      if (!match) return;

      const teamId = activeSide === "home" ? match.homeTeamId : match.awayTeamId;
      if (!teamId) return;

      const snap = await getDoc(doc(db, "teams", teamId));
      if (!snap.exists()) {
        setAllPlayers([]);
        return;
      }

      const data = snap.data();
      const squad = match.squad || [];
      setAllPlayers((data.players || []).filter((p) => squad.includes(p.id)));
    }

    loadPlayers();
  }, [match, activeSide]);

  return { allPlayers };
}