import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../../../config/Firebase";

export function useLiveMatch(match) {
  const [liveMatch, setLiveMatch] = useState(null);

  useEffect(() => {
    if (!match?.id) return;

    /* -----------------------------
        HENT MATCH-DATA
    ------------------------------ */
    const matchRef = doc(db, "matches", match.id);
    const unsubMatch = onSnapshot(matchRef, (snap) => {
      if (snap.exists()) {
        setLiveMatch((prev) => ({
          ...prev,
          ...snap.data(),
          id: match.id
        }));
      }
    });

    /* -----------------------------
        HENT EVENTS
    ------------------------------ */
    const eventsRef = collection(db, "matches", match.id, "events");
    const qEvents = query(eventsRef, orderBy("createdAt", "asc"));

    const unsubEvents = onSnapshot(qEvents, (snap) => {
      const events = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));

      setLiveMatch((prev) => ({
        ...prev,
        events
      }));
    });

    /* -----------------------------
        HENT POLLS
    ------------------------------ */
    const pollsRef = collection(db, "matches", match.id, "polls");
    const unsubPolls = onSnapshot(pollsRef, (snap) => {
      const polls = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));

      setLiveMatch((prev) => ({
        ...prev,
        polls
      }));
    });

    return () => {
      unsubMatch();
      unsubEvents();
      unsubPolls();
    };
  }, [match?.id]);

  return { liveMatch };
}
