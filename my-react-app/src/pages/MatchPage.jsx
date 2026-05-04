import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, getDocs, doc } from "firebase/firestore";
import { db } from "../config/Firebase";

import { useParams, useNavigate } from "react-router-dom";

import Countdown from "../components/Countdown";
import BeforeMatch from "../components/maincomp/BeforeMatch";
import MatchReport from "../components/MatchReport";
import Tabs from "../components/Tabs";

import { getTeam } from "../services/TeamService";

import "../assets/style/matchPage.css";
import LagComponent from "../components/maincomp/LagComponent";

import { loadOrCreateMatchData } from "../components/admincomp/useMatchData";
import TabellComponent from "../components/maincomp/TabellComponent";

export default function MatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [allMatches, setAllMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("rapport");

  const [homeName, setHomeName] = useState("Hjemmelag");
  const [awayName, setAwayName] = useState("Bortelag");

  const [hasFormation, setHasFormation] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const data = await loadOrCreateMatchData(id);
      setSelectedMatch({ id, ...data });
    }
    load();
  }, [id]);

  useEffect(() => {
    const fetchAll = async () => {
      const ref = collection(db, "matches");
      const snap = await getDocs(ref);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllMatches(list);
    };
    fetchAll();
  }, []);

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

  useEffect(() => {
    async function loadNames() {
      if (!selectedMatch) return;
      if (selectedMatch.homeTeamId) {
        const home = await getTeam(selectedMatch.homeTeamId);
        setHomeName(home?.name || "Ukjent lag");
      }
      if (selectedMatch.awayTeamId) {
        const away = await getTeam(selectedMatch.awayTeamId);
        setAwayName(away?.name || "Ukjent lag");
      }
    }
    loadNames();
  }, [selectedMatch]);

  useEffect(() => {
    if (!selectedMatch?.id) return;
    const ref = doc(db, "matches", selectedMatch.id, "formations", "home");
    const unsub = onSnapshot(ref, (snap) => {
      setHasFormation(snap.exists());
    });
    return () => unsub();
  }, [selectedMatch]);

  if (!selectedMatch) return <p>Laster kamp...</p>;

  const now = new Date();
  const matchDate = selectedMatch.date?.toDate
    ? selectedMatch.date.toDate()
    : new Date(selectedMatch.date);
  const matchTimePassed = now > matchDate;
  const isFinished = selectedMatch.status === "finished" || matchTimePassed;

  // ⭐ Vis BeforeMatch kun hvis ingen events finnes ennå
  const hasEvents = events.length > 0;

  if (selectedMatch.status === "not_started" && !matchTimePassed && !hasEvents) {
    return (
      <BeforeMatch
        match={selectedMatch}
        allMatches={allMatches}
        hasFormation={hasFormation}
      />
    );
  }

  return (
    <>
      <header className="header">
        <h1
          className="live-header"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          Breddefotball live
        </h1>
      </header>

      <div className="last-played-card">
        <p className="lp-status">
          {selectedMatch.status === "finished"
            ? "Slutt"
            : selectedMatch.status === "live"
            ? "Live"
            : isFinished
            ? "Slutt"
            : selectedMatch.status === "not_started" && hasEvents
            ? "Før kamp"
            : "Kamp"}
        </p>

        <div className="lp-row">
          <span className="lp-title">{homeName}</span>

          <p className="lp-result">
            {selectedMatch.status === "live"
              ? `${selectedMatch.homeScore ?? 0} - ${selectedMatch.awayScore ?? 0}`
              : isFinished
              ? selectedMatch.homeScore !== null && selectedMatch.awayScore !== null
                ? `${selectedMatch.homeScore} - ${selectedMatch.awayScore}`
                : "Stilling kommer"
              : selectedMatch.status === "not_started"
              ? `Kl ${selectedMatch.time}`
              : "Stilling kommer"}
          </p>

          <span className="lp-title">{awayName}</span>
        </div>

        <p className="lp-date">
          {selectedMatch.date?.toDate?.().toLocaleDateString("no-NO")}
        </p>
      </div>

      {!isFinished && selectedMatch.status !== "live" && (
        <Countdown match={selectedMatch} />
      )}

      <main className="page">
        <Tabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasFormation={hasFormation}
        />

        <section className="content-box">
          {activeTab === "rapport" && (
            <MatchReport
              match={selectedMatch}
              events={events}
              matchId={selectedMatch.id}
            />
          )}

          {activeTab === "tabell" && (
            <TabellComponent match={selectedMatch} />
          )}

          {activeTab === "lag" && (
            <LagComponent
              division={selectedMatch.division}
              season={selectedMatch.season}
            />
          )}
        </section>
      </main>
    </>
  );
}