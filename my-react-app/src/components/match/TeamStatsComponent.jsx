import { useEffect, useState } from "react";
import { collectionGroup, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/Firebase";

export default function TeamStatsComponent({ teamId, season }) {
  const [corners, setCorners] = useState(null);
  const [subsIn, setSubsIn] = useState([]);

  useEffect(() => {
    if (!teamId || !season) return;

    async function load() {
      try {
        const [cornerSnap, subSnap] = await Promise.all([
          getDocs(query(
            collectionGroup(db, "events"),
            where("type", "==", "corner"),
            where("team", "==", teamId),
            where("season", "==", season)
          )),
          getDocs(query(
            collectionGroup(db, "events"),
            where("type", "==", "sub"),
            where("team", "==", teamId),
            where("season", "==", season)
          )),
        ]);

        setCorners(cornerSnap.size);

        const counts = {};
        subSnap.docs.forEach((doc) => {
          const d = doc.data();
          if (!d.playerInName) return;
          counts[d.playerInName] = (counts[d.playerInName] || 0) + 1;
        });

        setSubsIn(
          Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        );
      } catch (err) {
        console.error("TeamStatsComponent:", err);
      }
    }

    load();
  }, [teamId, season]);

  const hasData = corners !== null || subsIn.length > 0;
  if (!hasData) return null;

  return (
    <>
      {corners !== null && corners > 0 && (
        <div className="topscorer-block">
          <h3 className="timeline-header">Corners</h3>
          <p className="team-stat-summary">{corners} corners denne sesongen</p>
        </div>
      )}

      {subsIn.length > 0 && (
        <div className="topscorer-block">
          <h3 className="timeline-header">Flest bytter inn</h3>
          <ol className="topscorer-list">
            {subsIn.map((s, i) => (
              <li key={s.name} className="topscorer-row">
                <span className="topscorer-rank">{i + 1}</span>
                <span className="topscorer-name">{s.name}</span>
                <span className="topscorer-goals topscorer-goals--sub">{s.count}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
