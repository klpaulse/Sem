// src/components/maincomp/LagComponent.jsx
import { useEffect, useState } from "react";
import FormationField from "./FormationField";
import PlayerChip from "./PlayerChip";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/Firebase";

export default function LagComponent({ match }) {
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);

  const [homeBench, setHomeBench] = useState([]);
  const [awayBench, setAwayBench] = useState([]);

  useEffect(() => {
    if (!match?.id) return;

    const homeRef = doc(db, "matches", match.id, "formations", "home");
    const awayRef = doc(db, "matches", match.id, "formations", "away");

    const unsubHome = onSnapshot(homeRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const pos = data.positions || {};
        const bench = data.bench || [];

        const loaded = Object.keys(pos)
          .map((key) => ({
            id: key,
            name: pos[key].name,
            number: pos[key].number,
            x: pos[key].x,
            y: pos[key].y,
            img: pos[key].img || "",
          }))
          .filter((p) => p.x !== undefined && p.y !== undefined);

        setHomePlayers(loaded);
        setHomeBench(bench);
      } else {
        setHomePlayers([]);
        setHomeBench([]);
      }
    });

    const unsubAway = onSnapshot(awayRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const pos = data.positions || {};
        const bench = data.bench || [];

        const loaded = Object.keys(pos)
          .map((key) => ({
            id: key,
            name: pos[key].name,
            number: pos[key].number,
            x: pos[key].x,
            y: pos[key].y,
            img: pos[key].img || "",
          }))
          .filter((p) => p.x !== undefined && p.y !== undefined);

        setAwayPlayers(loaded);
        setAwayBench(bench);
      } else {
        setAwayPlayers([]);
        setAwayBench([]);
      }
    });

    return () => {
      unsubHome();
      unsubAway();
    };
  }, [match]);

  return (
    <div className="lagoppstilling-container">
      

      {/* ⭐ Formasjonen på banen */}
      <FormationField interactive={false}>
        {homePlayers.map((p) => (
          <div
            key={"home-" + p.id}
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
              img={p.img}
              team="home"
            />
          </div>
        ))}

        {awayPlayers.map((p) => (
          <div
            key={"away-" + p.id}
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
              img={p.img}
              team="away"
            />
          </div>
        ))}
      </FormationField>

      {/* ⭐ Benkspillere under banen */}
{/* ⭐ Benkspillere under banen */}
<div className="bench-list">
  <h3>Benk</h3>

  {homeBench.length === 0 && awayBench.length === 0 && (
    <p style={{ opacity: 0.7 }}>Ingen benk registrert</p>
  )}

  {[...homeBench, ...awayBench].map((p) => (
    <div key={"bench-" + p.id} className="bench-player">
      {p.img && <img src={p.img} alt="" className="bench-avatar" />}
      <span className="bench-name">{p.number} – {p.name}</span>
    </div>
  ))}
</div>

    </div>
  );
}




