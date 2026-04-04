import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export async function getAllMatches() {
  const matchesRef = collection(db, "matches");
  const snapshot = await getDocs(matchesRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}