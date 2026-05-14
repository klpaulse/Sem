import { useEffect, useState } from "react";
import FormationField from "./FormationField";
import PlayerChip from "./PlayerChip";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/Firebase";
import { getTeam } from "../../services/TeamService";

export default function LagComponent({ match }) {
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [homeBench, setHomeBench] = useState([]);
  const [awayBench, setAwayBench] = useState([]);
  const [homeName, setHomeName] = useState("Hjemmelag");
  const [awayName, setAwayName] = useState("Bortelag");

  useEffect(() => {
    async function loadNames() {
      if (match?.homeTeamId) {
        const home = await getTeam(match.homeTeamId);
        setHomeName(home?.name || "Hjemmelag");
      }
      if (match?.awayTeamId) {
        const away = await getTeam(match.awayTeamId);
        setAwayName(away?.name || "Bortelag");
      }
    }
    loadNames();
  }, [match]);

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
            <PlayerChip name={p.name} number={p.number} img={p.img} team="home" />
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
            <PlayerChip name={p.name} number={p.number} img={p.img} team="away" />
          </div>
        ))}
      </FormationField>

      <div className="bench-section">
        <div className="bench-team">
          <h4 className="bench-team-title">Benk – {homeName}</h4>
          {homeBench.length === 0
            ? <p className="bench-empty">Ingen registrert</p>
            : <ul className="bench-list">
                {homeBench.map((p) => (
                  <li key={"hbench-" + p.id} className="bench-player">
                    <span className="bench-player-number">#{p.number}</span>
                    <span className="bench-player-name">{p.name}</span>
                  </li>
                ))}
              </ul>
          }
        </div>

        <div className="bench-team">
          <h4 className="bench-team-title">Benk – {awayName}</h4>
          {awayBench.length === 0
            ? <p className="bench-empty">Ingen registrert</p>
            : <ul className="bench-list">
                {awayBench.map((p) => (
                  <li key={"abench-" + p.id} className="bench-player">
                    <span className="bench-player-number">#{p.number}</span>
                    <span className="bench-player-name">{p.name}</span>
                  </li>
                ))}
              </ul>
          }
        </div>
      </div>
    </div>
  );
}