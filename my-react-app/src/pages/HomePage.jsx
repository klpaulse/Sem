import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../config/Firebase";
import { collection, onSnapshot, getDocs, doc, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { getTeam } from "../services/TeamService";
import { toSlug } from "../utils/slugify";

import Calandar from "../components/home/Calandar";
import DivisionList from "../components/home/DivisionList";
import BrandLogo from "../components/shared/BrandLogo";
import TabellComponent from "../components/match/TabellComponent";
import TopscorersComponent from "../components/match/TopscorersComponent";
import SponsorBanner from "../components/shared/SponsorBanner";
import UpcomingMatches from "../components/home/UpcomingMatches";
import "../assets/style/homePage.css";

export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [teamNames, setTeamNames] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("kamper");
  const [activeDivision, setActiveDivision] = useState(null);
  const [allTeams, setAllTeams] = useState([]);
  const [announcement, setAnnouncement] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    getDocs(collection(db, "teams")).then(snap => {
      setAllTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "announcements", "active"), snap => {
      setAnnouncement(snap.exists() ? snap.data() : null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "competitions"), where("active", "==", true)),
      snap => setCompetitions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
        setSearchOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allTeams.filter(t => t.name?.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery, allTeams]);

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
    const division = match.division?.trim() || "Ukjent divisjon";
    if (!acc[division]) acc[division] = [];
    acc[division].push(match);
    return acc;
  }, {});

  return (
    <>
      <header className="site-header">
        <BrandLogo height={42} />
      </header>

      <main className="page">

        {announcement && (
          announcement.url ? (
            <a href={announcement.url} target="_blank" rel="noopener noreferrer" className="announcement-banner">
              <span className="announcement-banner__icon">📣</span>
              <span>{announcement.text}</span>
              <span className="announcement-banner__arrow">→</span>
            </a>
          ) : (
            <div className="announcement-banner">
              <span className="announcement-banner__icon">📣</span>
              <span>{announcement.text}</span>
            </div>
          )
        )}

        {competitions.length > 0 && (
          <div className="competitions-block">
            <span className="competitions-block__icon">🏆</span>
            <div className="competitions-block__list">
              {competitions.map(comp => (
                <a
                  key={comp.id}
                  href={`/konkurranse/${comp.id}`}
                  className="competitions-block__link"
                >
                  <span>{comp.title}</span>
                  <span className="competitions-block__arrow">→</span>
                </a>
              ))}
            </div>
          </div>
        )}

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

        <div ref={searchRef}>
        <div className="home-tabs-row">
          <nav className="home-tabs">
            <button
              className={`home-tab ${activeTab === "kamper" ? "active" : ""}`}
              onClick={() => setActiveTab("kamper")}
            >
              Kamper
            </button>
            <button
              className={`home-tab ${activeTab === "kommende" ? "active" : ""}`}
              onClick={() => setActiveTab("kommende")}
            >
              Kommende
            </button>
            <button
              className={`home-tab ${activeTab === "tabell" ? "active" : ""}`}
              onClick={() => setActiveTab("tabell")}
            >
              Tabell
            </button>
          </nav>
          <button
            className={`search-icon-btn${searchOpen ? " search-icon-btn--active" : ""}`}
            onClick={() => { setSearchOpen(o => !o); setSearchQuery(""); setShowResults(false); }}
            aria-label="Søk på lag"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </div>

        {searchOpen && (
          <div className="team-search">
            <input
              ref={searchInputRef}
              className="team-search__input"
              type="search"
              placeholder="Søk på lag..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowResults(true); }}
            />
            {showResults && searchResults.length > 0 && (
              <ul className="team-search__results">
                {searchResults.map(t => (
                  <li key={t.id}>
                    <button
                      className="team-search__result"
                      onClick={() => {
                        navigate(`/lag/${toSlug(t.name)}`);
                        setSearchQuery("");
                        setSearchOpen(false);
                        setShowResults(false);
                      }}
                    >
                      <span className="team-search__name">{t.name}</span>
                      {t.division && <span className="team-search__div">{t.division}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        </div>

        {activeTab === "kamper" && (
          <div className="home-layout">
            <div className="home-main">

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

        {activeTab === "kommende" && (
          <section className="upcoming-section">
            <UpcomingMatches
              matches={matches}
              teamNames={teamNames}
              navigate={navigate}
            />
          </section>
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
                  <TopscorersComponent division={division} season={season} topOnly />
                </div>
              ))
            }
          </section>
        )}

        <SponsorBanner />
      </main>
    </>
  );
}
