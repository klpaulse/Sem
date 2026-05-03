import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/Firebase";

export function useLeagueTable(division, season) {
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!division || !season) return;

    async function loadTable() {
      setLoading(true);

      // 1. Hent ALLE lag i divisjonen
      const teamQuery = query(
        collection(db, "teams"),
        where("division", "==", division)
      );
      const teamSnap = await getDocs(teamQuery);
      const teams = teamSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 2. Hent ALLE kamper i divisjonen
      const matchQuery = query(
        collection(db, "matches"),
        where("division", "==", division),
        where("season", "==", season)
      );
      const matchSnap = await getDocs(matchQuery);
      const matches = matchSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 3. Lag tabellrader for ALLE lag
      const tableMap = {};
      teams.forEach(team => {
        tableMap[team.id] = {
          teamId: team.id,
          teamName: team.name,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0
        };
      });

      // 4. Oppdater statistikk basert på ferdigspilte kamper
      for (const match of matches) {
        if (match.status !== "finished") continue;

        const home = tableMap[match.homeTeamId];
        const away = tableMap[match.awayTeamId];

        if (!home || !away) continue; // sikkerhet

        home.played++;
        away.played++;

        home.goalsFor += match.homeScore;
        home.goalsAgainst += match.awayScore;

        away.goalsFor += match.awayScore;
        away.goalsAgainst += match.homeScore;

        if (match.homeScore > match.awayScore) {
          home.wins++;
          home.points += 3;
          away.losses++;
        } else if (match.homeScore < match.awayScore) {
          away.wins++;
          away.points += 3;
          home.losses++;
        } else {
          home.draws++;
          away.draws++;
          home.points++;
          away.points++;
        }
      }

      // 5. Sorter tabellen
      const sorted = Object.values(tableMap).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;

        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;

        return b.goalsFor - a.goalsFor;
      });

      setTable(sorted);
      setLoading(false);
    }

    loadTable();
  }, [division, season]);

  return { table, loading };
}
