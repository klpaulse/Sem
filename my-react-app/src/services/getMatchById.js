import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function getMatchById(matchId) {
  if (!matchId) return null;

  try {
    const ref = doc(db, "matches", matchId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data();

    // Normaliser dato
    const date = data.date?.toDate
      ? data.date.toDate()
      : new Date(data.date);

    return {
      id: matchId,
      ...data,
      date, // alltid Date-objekt
      homeTeamId: data.homeTeamId || null,
      awayTeamId: data.awayTeamId || null,
      time: data.time || "",
      arena: data.arena || "",
      season: data.season || "",
      status: data.status || "not_started",
      homeScore: data.homeScore ?? null,
      awayScore: data.awayScore ?? null,
    };
  } catch (err) {
    console.error("Feil ved henting av kamp:", err);
    return null;
  }
}