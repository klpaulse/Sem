// src/services/teamService.js

import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/Firebase";

const teamCache = {};

export async function getTeam(teamId) {
  if (!teamId) return null;

  // Sjekk cache først
  if (teamCache[teamId]) return teamCache[teamId];

  const ref = doc(db, "teams", teamId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();

  // Lagre i cache
  teamCache[teamId] = data;

  return data;
}