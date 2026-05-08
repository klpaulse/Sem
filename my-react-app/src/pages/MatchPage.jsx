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
  const [polls, setPolls] = useState([]);
  const [activeTab, setActiveTab] = useState("rapport");

  const [homeName, setHomeName] = useState("Hjemmelag");
  const [awayName, setAwayName] = useState("Bortelag");

  const [hasFormation, setHasFormation] = useState(false);

  // POLLS
  useEffect(() => {
    if (!selectedMatch?.id) return;

    const ref = collection(db, "matches", selectedMatch.id, "polls");
    const unsub = onSnapshot(ref, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPolls(list.filter((p) => p.active));
    });

    return () => unsub();
  }, [selectedMatch]);

  // MATCH DATA
  useEffect(() => {
    if (!id) return;
    async function load() {
      const data = await loadOrCreateMatchData(id);
      setSelectedMatch({ id, ...data });
    }
    load();
  }, [id]);

  // ALL MATCHES
  useEffect(() => {
    const fetchAll = async () => {
      const ref = collection(db, "matches");
      const snap = await getDocs(ref);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllMatches(list);
    };
    fetchAll();
  }, []);

  // EVENTS
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

  // TEAM NAMES
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

  // FORMATION
  useEffect(() => {
    if (!selectedMatch?.id) return;
    const ref = doc(db, "matches", selectedMatch.id, "formations", "home");
    const unsub = onSnapshot(ref, (snap) => {
      setHasFormation(snap.exists());
    });
    return () => unsub();
  }, [selectedMatch]);

  if (!selectedMatch) return <p>Laster kamp...</p>;

  // STATUS LOGIKK (fikset)
  const isFinished = selectedMatch.status === "finished";
  const hasPreMatchContent = events.length > 0 || polls.length > 0;

  // BEFORE MATCH VISNING
  if (selectedMatch.status === "not_started" && !hasPreMatchContent) {
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
            : selectedMatch.status === "not_started" && hasPreMatchContent
            ? "Før kamp"
            : "Kamp"}
        </p>

        <div className="lp-row">
          <span className="lp-title">{homeName}</span>

          <p className="lp-result">
            {selectedMatch.status === "live"
              ? `${selectedMatch.homeScore ?? 0} - ${selectedMatch.awayScore ?? 0}`
              : selectedMatch.status === "finished"
              ? `${selectedMatch.homeScore ?? 0} - ${selectedMatch.awayScore ?? 0}`
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

      {/* COUNTDOWN – vises kun når kampen ikke har startet og ingen pre-match content */}
      {selectedMatch.status === "not_started" && !hasPreMatchContent && (
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
