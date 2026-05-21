import { useEffect, useState } from "react";
import { collectionGroup, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/Firebase";

export default function TopscorersComponent({ division, season, teamId, showAssists = false }) {
  const [scorers, setScorers] = useState([]);
  const [assisters, setAssisters] = useState([]);

  useEffect(() => {
    if (!season) return;
    if (!teamId && !division) return;

    async function load() {
      try {
        let q;
        if (teamId) {
          q = query(
            collectionGroup(db, "events"),
            where("type", "==", "goal"),
            where("team", "==", teamId),
            where("season", "==", season)
          );
        } else {
          q = query(
            collectionGroup(db, "events"),
            where("type", "==", "goal"),
            where("division", "==", division),
            where("season", "==", season)
          );
        }

        const snap = await getDocs(q);

        const goalCounts = {};
        const assistCounts = {};

        snap.docs.forEach((doc) => {
          const d = doc.data();
          if (d.playerName) {
            goalCounts[d.playerName] = (goalCounts[d.playerName] || 0) + 1;
          }
          if (showAssists && d.assistName) {
            assistCounts[d.assistName] = (assistCounts[d.assistName] || 0) + 1;
          }
        });

        setScorers(
          Object.entries(goalCounts)
            .map(([name, goals]) => ({ name, goals }))
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 10)
        );

        if (showAssists) {
          setAssisters(
            Object.entries(assistCounts)
              .map(([name, assists]) => ({ name, assists }))
              .sort((a, b) => b.assists - a.assists)
              .slice(0, 10)
          );
        }
      } catch (err) {
        console.error("TopscorersComponent:", err);
      }
    }

    load();
  }, [division, season, teamId, showAssists]);

  if (scorers.length === 0 && assisters.length === 0) return null;

  return (
    <>
      {scorers.length > 0 && (
        <div className="topscorer-block">
          <h3 className="timeline-header">Toppscorer</h3>
          <ol className="topscorer-list">
            {scorers.map((s, i) => (
              <li key={s.name} className="topscorer-row">
                <span className="topscorer-rank">{i + 1}</span>
                <span className="topscorer-name">{s.name}</span>
                <span className="topscorer-goals">{s.goals}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {showAssists && assisters.length > 0 && (
        <div className="topscorer-block">
          <h3 className="timeline-header">Flest assists</h3>
          <ol className="topscorer-list">
            {assisters.map((s, i) => (
              <li key={s.name} className="topscorer-row">
                <span className="topscorer-rank">{i + 1}</span>
                <span className="topscorer-name">{s.name}</span>
                <span className="topscorer-goals topscorer-goals--assist">{s.assists}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
