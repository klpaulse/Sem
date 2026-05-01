import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../config/Firebase";

/* -------------------------------------------------------
   OPPDATER RESULTAT
------------------------------------------------------- */
export async function updateMatchResult(matchId, homeScore, awayScore, location) {
  const matchRef = doc(db, "matches", matchId);

  await updateDoc(matchRef, {
    homeScore: Number(homeScore),
    awayScore: Number(awayScore),
    location: location || "",
    played: true,
    updatedAt: new Date()
  });

  return true;
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
  const matchesRef = collection(db, "matches");
  const snap = await getDocs(matchesRef);

  return snap.docs.map(doc => {
    const data = doc.data();

    const date = data.date?.toDate ? data.date.toDate() : new Date(data.date);

    return {
      id: doc.id,
      ...data,
      date
    };
  });
}

/* -------------------------------------------------------
   HENT SESONGENS KAMPER FOR ETT LAG
------------------------------------------------------- */
export async function getSeasonMatches(teamId, season = "2026") {
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

  const allMatches = [...homeSnap.docs, ...awaySnap.docs]
    .map(doc => {
      const data = doc.data();

      const date = data.date?.toDate
        ? data.date.toDate()
        : new Date(data.date);

      return {
        id: doc.id,
        ...data,
        date,

        // ⭐ VIKTIG: alltid legg til score-felter
        homeScore: data.homeScore ?? null,
        awayScore: data.awayScore ?? null,
      };
    })
    .sort((a, b) => a.date - b.date);

  return allMatches;
}
