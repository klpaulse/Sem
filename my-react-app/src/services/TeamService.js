// src/services/teamService.js

import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../config/Firebase";
import { toSlug } from "../utils/slugify";

const teamCache = {};
const slugCache = {};

export function clearTeamCache(teamId) {
  if (teamId && teamCache[teamId]) {
    const slug = Object.keys(slugCache).find(s => slugCache[s].id === teamId);
    if (slug) delete slugCache[slug];
    delete teamCache[teamId];
  }
}

export async function getTeam(teamId) {
  if (!teamId) return null;

  if (teamCache[teamId]) return teamCache[teamId];

  const ref = doc(db, "teams", teamId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const team = { id: teamId, ...snap.data() };
  teamCache[teamId] = team;
  slugCache[toSlug(team.name)] = team;

  return team;
}

export async function getTeamBySlug(slug) {
  if (!slug) return null;

  if (slugCache[slug]) return slugCache[slug];

  const snap = await getDocs(collection(db, "teams"));
  const match = snap.docs.find(d => toSlug(d.data().name) === slug);
  if (!match) return null;

  const team = { id: match.id, ...match.data() };
  teamCache[team.id] = team;
  slugCache[slug] = team;

  return team;
}