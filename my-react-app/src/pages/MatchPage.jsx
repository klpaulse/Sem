import NextMatch from "../components/maincomp/NextMatch";
import MatchReport from "../components/MatchReport";
import Tabs from "../components/Tabs";
import MatchFilters from "../components/maincomp/MatchFilters";
import MatchList from "../components/maincomp/MatchList";
import "../assets/style/matchPage.css";

import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../config/Firebase";

import { useParams } from "react-router-dom";
import BeforeMatch from "../components/maincomp/BeforeMatch";

export default function MatchPage() {
  const { id } = useParams();

  const [allMatches, setAllMatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("rapport");

  const [selectedRound, setSelectedRound] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const upcomingRef = useRef(null);

  // 🔥 Hent ALLE kamper
  useEffect(() => {
    const fetchAll = async () => {
      const ref = collection(db, "matches");
      const snap = await getDocs(ref);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllMatches(list);
    };

    fetchAll();
  }, []);

  // 🔥 Finn kampen basert på ID
  const selectedMatch = allMatches.find(m => m.id === id);

  // 🔥 Hent events
  useEffect(() => {
    if (!selectedMatch) return;

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

  // 🔥 Siste spilte kamp
  const played = allMatches.filter((m) => m.homeScore !== null);
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

  // 🔥 Kampstatus
  if (!selectedMatch) {
    return <p>Laster kamp...</p>;
  }

  const matchDate = selectedMatch.date.toDate();
  const isFuture = matchDate > new Date();

  if (isFuture) {
    return <BeforeMatch match={selectedMatch} allMatches={allMatches} />;
  }

  return (
    <>
      <header className="header">
        <h1 className="SEM">Breddefotball Live</h1>
      </header>

      <NextMatch matches={allMatches} />

      {lastPlayed && (
        <section className="last-played-card">
          <p className="lp-status">Slutt</p>
          <div className="lp-row">
            <span className="lp-title">{lastPlayed.homeTeamName}</span>
            <p className="lp-result">
              {lastPlayed.homeScore} - {lastPlayed.awayScore}
            </p>
            <span className="lp-title">{lastPlayed.awayTeamName}</span>
          </div>

          <p className="lp-date">
            {lastPlayed.date.toDate().toLocaleDateString("no-NO")}
          </p>
        </section>
      )}

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} upcomingRef={upcomingRef} />

      <section className="content-box">
        {activeTab === "rapport" && (
          <MatchReport match={selectedMatch} events={events} />
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
