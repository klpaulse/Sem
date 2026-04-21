import { useEffect, useState } from "react";
import FormationField from "./FormationField";
import PlayerChip from "./PlayerChip";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/Firebase";

export default function LagComponent({ match }) {
    const [players, setPlayers] = useState([])

    useEffect(() => {
        if (!match?.id) return 
        const ref =doc(db, "matches", match.id, "formation", "current")

        const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const pos = data.positions || {};

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


 return (
    <div style={{ padding: "1rem", color: "#fff" }}>
      <h2>Lagoppstilling</h2>

      <FormationField>
        {players.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <PlayerChip
              name={p.name}
              number={p.number}
              x={0}
              y={0}
            />
          </div>
        ))}
      </FormationField>
    </div>
  );
}
