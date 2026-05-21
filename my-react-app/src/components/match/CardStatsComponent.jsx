import { useEffect, useState } from "react";
import { collectionGroup, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/Firebase";

export default function CardStatsComponent({ teamId, season }) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (!teamId || !season) return;

    async function load() {
      try {
        const [yellowSnap, redSnap] = await Promise.all([
          getDocs(query(
            collectionGroup(db, "events"),
            where("type", "==", "yellow"),
            where("team", "==", teamId),
            where("season", "==", season)
          )),
          getDocs(query(
            collectionGroup(db, "events"),
            where("type", "==", "red"),
            where("team", "==", teamId),
            where("season", "==", season)
          )),
        ]);

        const counts = {};

        yellowSnap.docs.forEach((doc) => {
          const d = doc.data();
          if (!d.playerName) return;
          if (!counts[d.playerName]) counts[d.playerName] = { name: d.playerName, yellow: 0, red: 0 };
          counts[d.playerName].yellow++;
        });

        redSnap.docs.forEach((doc) => {
          const d = doc.data();
          if (!d.playerName) return;
          if (!counts[d.playerName]) counts[d.playerName] = { name: d.playerName, yellow: 0, red: 0 };
          counts[d.playerName].red++;
        });

        setPlayers(
          Object.values(counts)
            .sort((a, b) => (b.yellow + b.red * 2) - (a.yellow + a.red * 2))
        );
      } catch (err) {
        console.error("CardStatsComponent:", err);
      }
    }

    load();
  }, [teamId, season]);

  if (players.length === 0) return null;

  return (
    <div className="topscorer-block">
      <h3 className="timeline-header">Kort</h3>
      <ol className="topscorer-list">
        {players.map((p, i) => (
          <li key={p.name} className="topscorer-row">
            <span className="topscorer-rank">{i + 1}</span>
            <span className="topscorer-name">{p.name}</span>
            <span className="card-stats">
              {p.yellow > 0 && <span className="card-badge card-badge--yellow">{p.yellow}</span>}
              {p.red > 0 && <span className="card-badge card-badge--red">{p.red}</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
