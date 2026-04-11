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

  // ⭐ FØR KAMP
  if (selectedMatch.status === "not_started") {
    return (
        <BeforeMatch match={selectedMatch} allMatches={allMatches} />
    );
  }

  // ⭐ UNDER / ETTER KAMP
  return (
    <>
      <header className="header">
        <h1 className="live-header">Breddefotball live</h1>
      </header>

      {/* Kampkort – samme stil som BeforeMatch */}
      <div className="last-played-card">
        <p className="lp-status">
          {selectedMatch.status === "finished"
            ? "Slutt"
            : selectedMatch.status === "live"
            ? "Live"
            : "Kamp"}
        </p>

        <div className="lp-row">
          <span className="lp-title">{selectedMatch.homeTeamName}</span>

          <p className="lp-result">
            {selectedMatch.status === "not_started"
              ? `Kl ${selectedMatch.time}`
              : `${selectedMatch.homeScore} - ${selectedMatch.awayScore}`}
          </p>

          <span className="lp-title">{selectedMatch.awayTeamName}</span>
        </div>

        <p className="lp-date">
          {selectedMatch.date.toDate().toLocaleDateString("no-NO")}
        </p>
      </div>

      {/* Rapport + Admin */}
      <main className="page">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} upcomingRef={upcomingRef} />

        <section className="content-box">
          {activeTab === "rapport" && (
            <MatchReport match={selectedMatch} events={events} />
          )}

          {activeTab === "tabell" && (
  <TabellComponent match={selectedMatch} />
)}

{activeTab === "lag" && (
  <LagComponent match={selectedMatch} />
)}

           
        </section>
      </main>
    </>
  );
}
