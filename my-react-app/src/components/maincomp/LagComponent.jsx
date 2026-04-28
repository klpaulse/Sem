// src/components/maincomp/LagComponent.jsx
import { useEffect, useState } from "react";
import FormationField from "./FormationField";
import PlayerChip from "./PlayerChip";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/Firebase";

export default function LagComponent({ match }) {
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);

  useEffect(() => {
    if (!match?.id) return;

    const homeRef = doc(db, "matches", match.id, "formations", "home");
    const awayRef = doc(db, "matches", match.id, "formations", "away");

    const unsubHome = onSnapshot(homeRef, (snap) => {
      if (snap.exists()) {
        const pos = snap.data().positions || {};

        const loaded = Object.keys(pos)
          .map((key) => ({
            id: key,
            name: pos[key].name,
            number: pos[key].number,
            x: pos[key].x,
            y: pos[key].y,
            img: pos[key].img || "",
          }))
          .filter((p) => p.x !== undefined && p.y !== undefined); // ⭐ viktig

        setHomePlayers(loaded);
      } else {
        setHomePlayers([]);
      }
    });

    const unsubAway = onSnapshot(awayRef, (snap) => {
      if (snap.exists()) {
        const pos = snap.data().positions || {};

        const loaded = Object.keys(pos)
          .map((key) => ({
            id: key,
            name: pos[key].name,
            number: pos[key].number,
            x: pos[key].x,
            y: pos[key].y,
            img: pos[key].img || "",
          }))
          .filter((p) => p.x !== undefined && p.y !== undefined); // ⭐ viktig

        setAwayPlayers(loaded);
      } else {
        setAwayPlayers([]);
      }
    });

    return () => {
      unsubHome();
      unsubAway();
    };
  }, [match]);

  return (
    <div style={{ padding: "1rem", color: "#fff" }}>
      <h2>Lagoppstilling</h2>

      {/* ⭐ FormationField i visningsmodus */}
      <FormationField interactive={false}>
        {/* HJEMMELAG */}
        {homePlayers.map((p) => (
          <div
            key={"home-" + p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: `translate(-50%, -50%)`,

            }}
          >
            <PlayerChip
              name={p.name}
              number={p.number}
              img={p.img}
              team="home"
            />
          </div>
        ))}

        {/* BORTELAG */}
        {awayPlayers.map((p) => (
          <div
            key={"away-" + p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: `translate(-50%, -50%)`,

            }}
          >
            <PlayerChip
              name={p.name}
              number={p.number}
              img={p.img}
              team="away"
            />
          </div>
        ))}
      </FormationField>
    </div>
  );
}



