import { useEffect, useMemo, useState } from "react";
import { db } from "../config/Firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { getTeam } from "../services/TeamService";

import Calandar from "../components/home/Calandar";
import DivisionList from "../components/home/DivisionList";
import TabellComponent from "../components/match/TabellComponent";
import TopscorersComponent from "../components/match/TopscorersComponent";
import "../assets/style/homePage.css";

export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [teamNames, setTeamNames] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("kamper");
  const [activeDivision, setActiveDivision] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const matchesRef = collection(db, "matches");

    const unsubscribe = onSnapshot(matchesRef, (snapshot) => {
      const matchesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      matchesData.sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return da - db;
      });

      setMatches(matchesData);
    });

    return () => unsubscribe();
  }, []);

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

  const divisions = useMemo(() => {
    const seen = new Set();
    return matches
      .filter(m => {
        const div = m.division?.trim();
        if (!div || !m.season || seen.has(div.toLowerCase())) return false;
        seen.add(div.toLowerCase());
        return true;
      })
      .map(m => ({ division: m.division.trim(), season: m.season }))
      .sort((a, b) => a.division.localeCompare(b.division, "no", { numeric: true }));
  }, [matches]);

  const todaysMatches = matches.filter((m) => {
    if (!m.date) return false;
    const matchDate = m.date?.toDate ? m.date.toDate() : new Date(m.date);
    return matchDate.toDateString() === selectedDate.toDateString();
  });

  const normalizeStatus = (s) => (s || "").toLowerCase();

  const todaysFeaturedMatches = todaysMatches.filter((m) => {
    const status = normalizeStatus(m.status);
    return m.featuredLive === true && (status === "live" || status === "pause");
  });

  const matchesByDivision = todaysMatches.reduce((acc, match) => {
    const division = match.division || "Ukjent divisjon";
    if (!acc[division]) acc[division] = [];
    acc[division].push(match);
    return acc;
  }, {});

  return (
    <>
      <header className="site-header">
        <h1 className="live-header">Breddefotball Live</h1>
      </header>

      <main className="page">

        <nav className="home-tabs">
          <button
            className={`home-tab ${activeTab === "kamper" ? "active" : ""}`}
            onClick={() => setActiveTab("kamper")}
          >
            Kamper
          </button>
          <button
            className={`home-tab ${activeTab === "tabell" ? "active" : ""}`}
            onClick={() => setActiveTab("tabell")}
          >
            Tabell
          </button>
        </nav>

        {activeTab === "kamper" && (
          <div className="home-layout">
            <div className="home-main">
              {todaysFeaturedMatches.length > 0 && (
                <div className="live-banner">
                  <div className="live-row-title">Dagens livekamp:</div>
                  <ul className="live-list">
                    {todaysFeaturedMatches.map((m) => (
                      <li key={m.id} className="live-row">
                        <span className="live-dot"></span>
                        {teamNames[m.homeTeamId]} – {teamNames[m.awayTeamId]}
                      </li>
                    ))}
                  </ul>
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
            </div>

          </div>
        )}

        {activeTab === "tabell" && (
          <section className="tabell-section">
            <nav className="division-tabs">
              {divisions.map(({ division }) => (
                <button
                  key={division}
                  className={`division-tab ${(activeDivision ?? divisions[0]?.division) === division ? "active" : ""}`}
                  onClick={() => setActiveDivision(division)}
                >
                  {division}
                </button>
              ))}
            </nav>

            {divisions
              .filter(({ division }) => division === (activeDivision ?? divisions[0]?.division))
              .map(({ division, season }) => (
                <div key={division}>
                  <TabellComponent division={division} season={season} title={division} />
                  <TopscorersComponent division={division} season={season} />
                </div>
              ))
            }
          </section>
        )}

      </main>
    </>
  );
}
