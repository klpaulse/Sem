import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../config/Firebase";

export async function loadOrCreateMatchData(matchId) {
  const matchRef = doc(db, "matches", matchId);
  const snap = await getDoc(matchRef);

  if (snap.exists()) {
    return snap.data();
  }

  const emptyData = {
    home: { players: [], formation: null },
    away: { players: [], formation: null },
    arena: "",
    info: "",
    events: []
  };

  await setDoc(matchRef, emptyData);
  return emptyData;
}
