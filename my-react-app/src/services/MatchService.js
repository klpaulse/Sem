import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../config/Firebase";

/* -------------------------------------------------------
   HENT ALLE KAMPER FOR ETT LAG (alle sesonger)
------------------------------------------------------- */
export async function getTeamMatches(teamId) {
  const matchesRef = collection(db, "matches");
  const [homeSnap, awaySnap] = await Promise.all([
    getDocs(query(matchesRef, where("homeTeamId", "==", teamId))),
    getDocs(query(matchesRef, where("awayTeamId", "==", teamId))),
  ]);
  return [...homeSnap.docs, ...awaySnap.docs]
    .map(d => {
      const data = d.data();
      return { id: d.id, ...data, date: data.date?.toDate ? data.date.toDate() : new Date(data.date) };
    })
    .sort((a, b) => a.date - b.date);
}

/* -------------------------------------------------------
   HENT KAMP VIA SLUG
------------------------------------------------------- */
export async function getMatchBySlug(slug) {
  try {
    const q = query(collection(db, "matches"), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const d = snap.docs[0];
    const data = d.data();
    const date = data.date?.toDate ? data.date.toDate() : new Date(data.date);
    return { id: d.id, ...data, date };
  } catch (err) {
    console.error("Kunne ikke hente kamp via slug:", err);
    return null;
  }
}

/* -------------------------------------------------------
   OPPDATER RESULTAT
------------------------------------------------------- */
export async function updateMatchResult(matchId, homeScore, awayScore, location) {
  const matchRef = doc(db, "matches", matchId);
  try {
    await updateDoc(matchRef, {
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      location: location || "",
      played: true,
      updatedAt: new Date()
    });
    return true;
  } catch (err) {
    console.error("Kunne ikke oppdatere kampresultat:", err);
    throw err;
  }
}

/* -------------------------------------------------------
   W/D/L basert på lagets perspektiv
------------------------------------------------------- */
export function getMatchOutcome(match, teamId) {
  const isHome = match.homeTeamId === teamId;

  const goalsFor = isHome ? match.homeScore : match.awayScore;
  const goalsAgainst = isHome ? match.awayScore : match.homeScore;

  if (goalsFor > goalsAgainst) return "W";
  if (goalsFor < goalsAgainst) return "L";
  return "D";
}

/* -------------------------------------------------------
   HENT ALLE KAMPER (for admin)
------------------------------------------------------- */
export async function getAllMatches() {
  try {
    const matchesRef = collection(db, "matches");
    const snap = await getDocs(matchesRef);

    return snap.docs.map(doc => {
      const data = doc.data();
      const date = data.date?.toDate ? data.date.toDate() : new Date(data.date);
      return { id: doc.id, ...data, date };
    });
  } catch (err) {
    console.error("Kunne ikke hente kamper:", err);
    return [];
  }
}

/* -------------------------------------------------------
   HENT SESONGENS KAMPER FOR ETT LAG
------------------------------------------------------- */
export async function getSeasonMatches(teamId, season) {
  if (!teamId || !season) return [];
  try {
    const matchesRef = collection(db, "matches");

    const qHome = query(
      matchesRef,
      where("homeTeamId", "==", teamId),
      where("season", "==", season)
    );

    const qAway = query(
      matchesRef,
      where("awayTeamId", "==", teamId),
      where("season", "==", season)
    );

    const [homeSnap, awaySnap] = await Promise.all([
      getDocs(qHome),
      getDocs(qAway)
    ]);

    return [...homeSnap.docs, ...awaySnap.docs]
      .map(doc => {
        const data = doc.data();
        const date = data.date?.toDate ? data.date.toDate() : new Date(data.date);
        return {
          id: doc.id,
          ...data,
          date,
          homeScore: data.homeScore ?? null,
          awayScore: data.awayScore ?? null,
        };
      })
      .sort((a, b) => a.date - b.date);
  } catch (err) {
    console.error("Kunne ikke hente sesongens kamper:", err);
    return [];
  }
}
