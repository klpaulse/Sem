import { useEffect, useState } from "react";
import { auth, db } from "../../config/Firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getTeam } from "../../services/TeamService";
import MatchCard from "../match/MatchCard";

export default function ReporterPage({ matches }) {
  const [myMatches, setMyMatches] = useState([]);
  const [teamNames, setTeamNames] = useState({});
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const mine = matches.filter(m => 
      m.reporters?.includes(user?.email) &&
      m.status !== "finished"
    );
    setMyMatches(mine);
  }, [matches]);

  useEffect(() => {
    async function loadNames() {
      const map = {};
      for (const m of myMatches) {
        if (m.homeTeamId && !map[m.homeTeamId]) {
          map[m.homeTeamId] = await getTeam(m.homeTeamId);
        }
        if (m.awayTeamId && !map[m.awayTeamId]) {
          map[m.awayTeamId] = await getTeam(m.awayTeamId);
        }
      }
      setTeamNames(map);
    }
    if (myMatches.length > 0) loadNames();
  }, [myMatches]);

  return (
    <main className="page">
      <h1 className="live-header">Mine kamper</h1>

      {myMatches.length === 0 && (
        <p style={{ color: "#ffffff88", padding: "1rem" }}>
          Du har ingen tilgjengelige kamper
        </p>
      )}

      {myMatches.map(m => (
        <MatchCard
          key={m.id}
          match={m}
          homeName={teamNames[m.homeTeamId]?.name || "..."}
          awayName={teamNames[m.awayTeamId]?.name || "..."}
          onClick={() => navigate(`/reporter/live/${m.id}`)}
        />
      ))}
    </main>
  );
}