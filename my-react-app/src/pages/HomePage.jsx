import { useEffect, useState, useMemo } from "react";
import { db } from "../config/Firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { getTeam } from "../services/TeamService";

import Calandar from "../components/homecomp/Calandar";
import DivisionList from "../components/homecomp/DivisionList";
import "../assets/style/homePage.css";

export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [teamNames, setTeamNames] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  // LIVE-OPPDATERING AV KAMPER
  useEffect(() => {
    const matchesRef = collection(db, "matches");

    const unsubscribe = onSnapshot(matchesRef, (snapshot) => {
      const matchesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Trygg sortering
      matchesData.sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return da - db;
      });

      setMatches(matchesData);
    });

    return () => unsubscribe();
  }, []);

  // HENT LAGNAVN
  useEffect(() => {
    async function loadNames() {
      const map = {};

      for (const m of matches) {
        if (m.homeTeamId && !map[m.homeTeamId]) {
          const t = await getTeam(m.homeTeamId);
          map[m.homeTeamId] = t?.name || "Ukjent lag";
        }
        if (m.awayTeamId && !map[m.awayTeamId]) {
          const t = await getTeam(m.awayTeamId);
          map[m.awayTeamId] = t?.name || "Ukjent lag";
        }
      }

      setTeamNames(map);
    }

    if (matches.length > 0) loadNames();
  }, [matches]);

  // FILTRER DAGENS KAMPER
  const todaysMatches = matches.filter((m) => {
    if (!m.date) return false;

    const matchDate = m.date?.toDate
      ? m.date.toDate()
      : new Date(m.date);

    return matchDate.toDateString() === selectedDate.toDateString();
  });

  // GRUPPER ETTER DIVISJON
  const matchesByDivision = todaysMatches.reduce((acc, match) => {
    const division = match.division || "Ukjent divisjon";

    if (!acc[division]) acc[division] = [];
    acc[division].push(match);

    return acc;
  }, {});

  // FINN FEATURED MATCH
  const featuredMatch = useMemo(() => {
    const fm = matches.find((m) => m.featuredLive === true);
    if (!fm) return null;

    return {
      ...fm,
      homeName: teamNames[fm.homeTeamId],
      awayName: teamNames[fm.awayTeamId],
    };
  }, [matches, teamNames]);

  // FINN DAGENS LIVEKAMPER
  const todaysLiveMatches = todaysMatches.filter(
    (m) => m.status === "live"
  );

  return (
    <>
      <header className="site-header">
        <h1 className="live-header">Breddefotball Live</h1>
      </header>

      <main className="page">

        {/* ⭐ VIS LIVE-KAMPER HVIS DET FINNES */}
        {todaysLiveMatches.length > 0 && (
          <div className="live-banner">
            {todaysLiveMatches.map((m) => (
              <div key={m.id} className="live-row">
                <span className="live-dot"></span>
                {teamNames[m.homeTeamId]} – {teamNames[m.awayTeamId]}
              </div>
            ))}
          </div>
        )}

        {/* ⭐ VIS FEATURED KAMP HVIS INGEN LIVE-KAMPER */}
        {todaysLiveMatches.length === 0 &&
          featuredMatch &&
          featuredMatch.status !== "live" &&
          featuredMatch.status !== "finished" && (
            <div className="live-banner">
              <span className="live-dot"></span>
              Dagens livekamp: {featuredMatch.homeName} – {featuredMatch.awayName}
            </div>
          )}

        <section className="calandar-section">
          <Calandar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </section>

        <section className="division-section">
          <DivisionList
            matchesByDivision={matchesByDivision}
            navigate={navigate}
            selectedDate={selectedDate}
          />
        </section>
      </main>
    </>
  );
}
