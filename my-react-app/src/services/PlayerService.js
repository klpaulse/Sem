import { db } from "../config/Firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// Hent alle spillere som tilhører et lag
export async function getPlayersByTeam(teamId) {
  const playersRef = collection(db, "players");

  const q = query(playersRef, where("teamId", "==", teamId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}
