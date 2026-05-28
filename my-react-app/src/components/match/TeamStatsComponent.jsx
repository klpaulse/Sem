import { useEffect, useState } from "react";
import { collectionGroup, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/Firebase";

export default function TeamStatsComponent({ teamId, season }) {
  const [corners, setCorners] = useState(null);

  useEffect(() => {
    if (!teamId || !season) return;

    async function load() {
      try {
        const snap = await getDocs(query(
          collectionGroup(db, "events"),
          where("type", "==", "corner"),
          where("team", "==", teamId),
          where("season", "==", season)
        ));
        setCorners(snap.size);
      } catch (err) {
        console.error("TeamStatsComponent:", err);
      }
    }

    load();
  }, [teamId, season]);

  if (!corners) return null;

  return (
    <div className="topscorer-block">
      <h3 className="timeline-header">Corners</h3>
      <p className="team-stat-summary">{corners} corners denne sesongen</p>
    </div>
  );
}
