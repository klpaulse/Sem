import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../config/Firebase";
import { toSlug } from "../../utils/slugify";

function buildTableMap(teams, matches) {
  const tableMap = {};
  teams.forEach(team => {
    tableMap[team.id] = {
      teamId: team.id,
      teamSlug: toSlug(team.name),
      teamName: team.name,
      played: 0, wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0, points: 0,
      formResults: [],
    };
  });

  for (const match of matches) {
    const home = tableMap[match.homeTeamId];
    const away = tableMap[match.awayTeamId];
    if (!home || !away) continue;

    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;

    home.played++;
    away.played++;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    const matchDate = match.date?.toDate ? match.date.toDate() : new Date(match.date);

    if (homeScore > awayScore) {
      home.wins++; home.points += 3; away.losses++;
      home.formResults.push({ date: matchDate, result: "V" });
      away.formResults.push({ date: matchDate, result: "T" });
    } else if (homeScore < awayScore) {
      away.wins++; away.points += 3; home.losses++;
      home.formResults.push({ date: matchDate, result: "T" });
      away.formResults.push({ date: matchDate, result: "V" });
    } else {
      home.draws++; away.draws++; home.points++; away.points++;
      home.formResults.push({ date: matchDate, result: "U" });
      away.formResults.push({ date: matchDate, result: "U" });
    }
  }

  for (const team of Object.values(tableMap)) {
    team.form = team.formResults
      .sort((a, b) => a.date - b.date)
      .slice(-5)
      .map(r => r.result);
    delete team.formResults;
  }

  return tableMap;
}

function sortTable(tableMap) {
  return Object.values(tableMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    return b.goalsFor - a.goalsFor;
  });
}

export function useLeagueTable(division, season) {
  const [table, setTable] = useState([]);
  const [liveTable, setLiveTable] = useState([]);
  const [hasLive, setHasLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!division || !season) return;

    let unsub;

    async function init() {
      const teamSnap = await getDocs(
        query(collection(db, "teams"), where("division", "==", division))
      );
      const teams = teamSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const matchQuery = query(
        collection(db, "matches"),
        where("division", "==", division),
        where("season", "==", season)
      );

      unsub = onSnapshot(matchQuery, snap => {
        const matches = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const finished = matches.filter(m => m.status === "finished");
        const live = matches.filter(m => m.status === "live");

        const normalTable = sortTable(buildTableMap(teams, finished));
        setTable(normalTable);

        if (live.length > 0) {
          const liveTableSorted = sortTable(buildTableMap(teams, [...finished, ...live]));
          setLiveTable(liveTableSorted);
          setHasLive(true);
        } else {
          setLiveTable([]);
          setHasLive(false);
        }

        setLoading(false);
      });
    }

    init();
    return () => unsub?.();
  }, [division, season]);

  return { table, liveTable, hasLive, loading };
}
