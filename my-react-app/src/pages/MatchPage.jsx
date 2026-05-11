import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, getDocs, doc } from "firebase/firestore";
import { db } from "../config/Firebase";

import { useParams, useNavigate } from "react-router-dom";

import Countdown from "../components/Countdown";
import BeforeMatch from "../components/maincomp/BeforeMatch";
import MatchReport from "../components/MatchReport";
import Tabs from "../components/Tabs";

import { getTeam } from "../services/TeamService";
import {getSeasonMatches} from "../services/MatchService"

import "../assets/style/matchPage.css";
import LagComponent from "../components/maincomp/LagComponent";

import { loadOrCreateMatchData } from "../components/admincomp/useMatchData";
import TabellComponent from "../components/maincomp/TabellComponent";
import PollDisplay from "../components/maincomp/PollDisplay";
import BeforeMatchInfo from "../components/maincomp/BeforeMatchInfo";

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
  const [homeSeason, setHomeSeason] = useState([])
  const [awaySeason, setAwaySeason] = useState([])

  // ⭐ ALLE HOOKS FØRST – før enhver return
useEffect(() => {
  if (!selectedMatch) return;
  
  const matchDate = selectedMatch.date?.toDate 
    ? selectedMatch.date.toDate() 
    : new Date(selectedMatch.date);
  const isPast = matchDate && matchDate < new Date();
  const isFinished = selectedMatch.status === "finished" || 
    (selectedMatch.status === "not_started" && isPast);

  if (!isFinished) return;

  async function loadSeason() {
    const home = await getSeasonMatches(selectedMatch.homeTeamId, "2026");
    const away = await getSeasonMatches(selectedMatch.awayTeamId, "2026");
    setHomeSeason(home);
    setAwaySeason(away);
  }
  loadSeason();
}, [selectedMatch]);

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
    if (!selectedMatch?.id) return;
    const ref = collection(db, "matches", selectedMatch.id, "polls");
    const unsub = onSnapshot(ref, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPolls(list.filter((p) => p.active));
    });
    return () => unsub();
  }, [selectedMatch]);

  useEffect(() => {
    if (!selectedMatch) return;
    const q = query(
      collection(db, "matches", selectedMatch.id, "events"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      const data = snap.data();
      setHasFormation(
        snap.exists() && Object.keys(data?.positions || {}).length > 0
      );
    });
    return () => unsub();
  }, [selectedMatch]);

  // ⭐ TIDLIG RETURN ETTER ALLE HOOKS
  if (!selectedMatch) return <p>Laster kamp...</p>;

  function normalizeDate(d) {
    if (!d) return null;
    if (d.toDate) return d.toDate();
    return new Date(d);
  }

  const matchDate = normalizeDate(selectedMatch.date);
  const isPastMatch = matchDate && matchDate < new Date();
  const effectivelyFinished = selectedMatch.status === "finished" ||
    (selectedMatch.status === "not_started" && isPastMatch);
  const hasPreMatchContent = events.length > 0 || polls.length > 0;

  if (selectedMatch.status === "not_started" && !hasPreMatchContent && !isPastMatch) {
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
      <header className="site-header">
        <h1 className="live-header" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          Breddefotball live
        </h1>
      </header>

      <div className="last-played-card">
        <p className="lp-status">
          {effectivelyFinished ? "Slutt" : selectedMatch.status === "live" ? "Live" : "Før kamp"}
        </p>

        <div className="lp-row">
          <span className="lp-title">{homeName}</span>
          <p className={`lp-result ${effectivelyFinished && selectedMatch.homeScore == null ? "lp-result--text" : ""}`}>
            {effectivelyFinished
              ? (selectedMatch.homeScore != null
                  ? `${selectedMatch.homeScore} - ${selectedMatch.awayScore}`
                  : "Ikke registrert")
              : selectedMatch.status === "live"
              ? `${selectedMatch.homeScore ?? 0} - ${selectedMatch.awayScore ?? 0}`
              : `Kl ${selectedMatch.time}`}
          </p>
          <span className="lp-title">{awayName}</span>
        </div>

        <p className="lp-date">
          {selectedMatch.date?.toDate?.().toLocaleDateString("no-NO")}
        </p>
      </div>

      {selectedMatch.status === "not_started" && !hasPreMatchContent && !effectivelyFinished && (
        <Countdown match={selectedMatch} />
      )}

      <main className="page">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} hasFormation={hasFormation} />

        <section className={`content-box ${activeTab === "lag" ? "content-box--lag" : ""}`}>
          {activeTab === "rapport" && (
            <MatchReport
              match={{...selectedMatch, status: effectivelyFinished ? "finished" : selectedMatch.status}}
              events={events}
              matchId={selectedMatch.id}
              allMatches={allMatches}
              isFinished={effectivelyFinished}
            />
          )}
          {activeTab === "tabell" && <TabellComponent match={selectedMatch} />}
          {activeTab === "lag" && <LagComponent match={selectedMatch} />}
        </section>
        

        {activeTab === "rapport" && effectivelyFinished && events.length === 0  &&(
          <BeforeMatchInfo
          match={selectedMatch}
          allMatches={allMatches}
          homeSeason={homeSeason}
          awaySeason={awaySeason}
          hideTitle={true}
          />
        )}
        </main>
      
    </>
  );
}