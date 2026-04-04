import NextMatch from "../components/maincomp/NextMatch";
import MatchReport from "../components/MatchReport";
import Tabs from "../components/Tabs";
import MatchFilters from "../components/maincomp/MatchFilters";
import MatchList from "../components/maincomp/MatchList";
import "../assets/style/matchPage.css";

import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, query, orderBy, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../config/Firebase";
import { useParams } from "react-router-dom";

// ⭐ Hent lag basert på ID
import { getTeam } from "../services/TeamService";

export default function MatchPage() {
  const { id } = useParams();

  // Kampen du klikket på
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Alle kamper (for designet ditt)
  const [allMatches, setAllMatches] = useState([]);

  // Lagobjekter (hentes via ID)
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);

  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("rapport");

  const [selectedRound, setSelectedRound] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const upcomingRef = useRef(null);

  // 🔥 Hent EN kamp basert på URL
  useEffect(() => {
    const fetchMatch = async () => {
      const ref = doc(db, "matches", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setSelectedMatch({ id: snap.id, ...snap.data() });
      }
    };

    fetchMatch();
  }, [id]);

  // 🔥 Hent ALLE kamper (for designet ditt)
  useEffect(() => {
    const fetchAll = async () => {
      const ref = collection(db, "matches");
      const snap = await getDocs(ref);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllMatches(list);
    };

    fetchAll();
  }, []);

  // 🔥 Hent lagobjekter basert på ID
  useEffect(() => {
    if (!selectedMatch) return;

    async function loadTeams() {
      const home = await getTeam(selectedMatch.homeTeam);
      const away = await getTeam(selectedMatch.awayTeam);

      setHomeTeam(home);
      setAwayTeam(away);
    }

    loadTeams();
  }, [selectedMatch]);

  // 🔥 Hent events
  useEffect(() => {
    if (!selectedMatch) {
      setEvents([]);
      return;
    }

    const q = query(
      collection(db, "matches", selectedMatch.id, "events"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(list);
    });

    return () => unsub();
  }, [selectedMatch]);

  // Loading
  if (!selectedMatch || allMatches.length === 0 || !homeTeam || !awayTeam) {
    return <p>Laster kamp...</p>;
  }

  // 🔥 Siste spilte kamp
  const played = allMatches.filter((m) => m.homeScore != null);
  const lastPlayed =
    played.length > 0
      ? played.sort((a, b) => b.date.toDate() - a.date.toDate())[0]
      : null;

  // 🔥 Filtrering
  const filteredMatches = allMatches
    .filter((m) => (selectedRound ? m.round === selectedRound : true))
    .filter((m) =>
      selectedMonth !== null
        ? m.date.toDate().getMonth() === selectedMonth
        : true
    )
    .filter((m) =>
      selectedTeam
        ? m.homeTeam === selectedTeam || m.awayTeam === selectedTeam
        : true
    );

  return (
    <>
      <header className="header">
        <h1 className="SEM">Breddefotball Live</h1>
      </header>

      {/* 🔥 Nedtelling og neste kamp */}
      <NextMatch matches={allMatches} />

      {/* 🔥 Siste kamp på gressmatta */}
      {lastPlayed && (
        <section className="last-played-card">
          <p className="lp-status">Slutt</p>
          <div className="lp-row">
            <span className="lp-title">{homeTeam.teamName}</span>
            <p className="lp-result">
              {lastPlayed.homeScore} - {lastPlayed.awayScore}
            </p>
            <span className="lp-title">{awayTeam.teamName}</span>
          </div>

          <p className="lp-date">
            {lastPlayed.date.toDate().toLocaleDateString("no-NO")}
          </p>
        </section>
      )}

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} upcomingRef={upcomingRef} />

      <section className="content-box">
        {activeTab === "rapport" && (
          <MatchReport
            match={selectedMatch}
            events={events}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
        )}

        {activeTab === "kamper" && (
          <>
            <MatchFilters
              selectedRound={selectedRound}
              setSelectedRound={setSelectedRound}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedTeam={selectedTeam}
              setSelectedTeam={setSelectedTeam}
              matches={allMatches}
            />

            <MatchList
              filteredMatches={filteredMatches}
              matches={allMatches}
              played={played}
              upcomingRef={upcomingRef}
            />
          </>
        )}
      </section>
    </>
  );
}
