import { useEffect, useState } from "react";
import { getTeam } from "../../../services/TeamService";

export function useMatchTeams(match) {
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);

  useEffect(() => {
    if (!match?.homeTeamId || !match?.awayTeamId) return;

    async function loadTeams() {
      const home = await getTeam(match.homeTeamId);
      const away = await getTeam(match.awayTeamId);
      setHomeTeam(home);
      setAwayTeam(away);
    }

    loadTeams();
  }, [match?.homeTeamId, match?.awayTeamId]);

  return { homeTeam, awayTeam };
}