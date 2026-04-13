import NextMatch from "../components/maincomp/NextMatch";
import MatchReport from "../components/MatchReport";
import Tabs from "../components/Tabs";
import MatchFilters from "../components/maincomp/MatchFilters";
import MatchList from "../components/maincomp/MatchList";
import "../assets/style/matchPage.css";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, getDocs, doc } from "firebase/firestore";
import { db } from "../config/Firebase";

import { useParams } from "react-router-dom";
import BeforeMatch from "../components/maincomp/BeforeMatch";

export default function MatchPage() {
  const { id } = useParams();

  const [allMatches, setAllMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("rapport");

  const [selectedRound, setSelectedRound] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // 🔥 Hent ALLE kamper (ikke live)
  useEffect(() => {
    const fetchAll = async () => {
      const ref = collection(db, "matches");
      const snap = await getDocs(ref);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllMatches(list);
    };

    fetchAll();
  }, []);

  // ⭐ Hent DENNE kampen live
  useEffect(() => {
    if (!id) return;

    const ref = doc(db, "matches", id);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSelectedMatch({ id: snap.id, ...snap.data() });
      }
    });

    return () => unsub();
  }, [id]);

  // 🔥 Hent events live
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

      {/* Kampkort */}
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

      {/* Rapport */}
      <main className="page">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

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
