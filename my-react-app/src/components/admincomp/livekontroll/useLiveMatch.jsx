import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/Firebase";

export function useLiveMatch(match) {
  const [liveMatch, setLiveMatch] = useState(null);

  useEffect(() => {
    if (!match?.id) return;

    const ref = doc(db, "matches", match.id);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setLiveMatch({ id: snap.id, ...snap.data() });
      }
    });

    return () => unsub();
  }, [match?.id]);

  return { liveMatch };
}