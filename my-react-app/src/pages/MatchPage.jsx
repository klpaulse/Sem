import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, getDocs, doc } from "firebase/firestore";
import { db } from "../config/Firebase";

import { useParams, useNavigate } from "react-router-dom";

import Countdown from "../components/match/Countdown";
import BeforeMatch from "../components/match/BeforeMatch";
import MatchReport from "../components/match/MatchReport";
import Tabs from "../components/shared/Tabs";

import { getTeam } from "../services/TeamService";
import { getSeasonMatches, getMatchBySlug } from "../services/MatchService";
import { normalizeDate } from "../utils/normalizeDate";

import "../assets/style/matchPage.css";
import LagComponent from "../components/match/LagComponent";

import { loadOrCreateMatchData } from "../components/admin/useMatchData";
import TabellComponent from "../components/match/TabellComponent";
import PollDisplay from "../components/match/PollDisplay";
import BeforeMatchInfo from "../components/match/BeforeMatchInfo";
import MatchScoreCard from "../components/match/MatchScoreCard";
import ReactGA from "react-ga4"
import ShareButton from "../components/shared/ShareButton"

export default function MatchPage() {
  const { slug } = useParams();
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
  if (!selectedMatch?.id) return;
  async function loadSeason() {
    const home = await getSeasonMatches(selectedMatch.homeTeamId, selectedMatch.season);
    const away = await getSeasonMatches(selectedMatch.awayTeamId, selectedMatch.season);
    setHomeSeason(home);
    setAwaySeason(away);
  }
  loadSeason();
}, [selectedMatch?.id]);

  // Løs slug til kamp (med fallback til Firebase-ID for gamle lenker)
  useEffect(() => {
    if (!slug) return;
    async function load() {
      let match = await getMatchBySlug(slug);
      if (!match) {
        const data = await loadOrCreateMatchData(slug);
        if (data) match = { id: slug, ...data };
      }
      if (match) setSelectedMatch(match);
    }
    load();
  }, [slug]);

  // Sanntidslytter bruker Firebase-ID fra det løste selectedMatch
  useEffect(() => {
    if (!selectedMatch?.id) return;
    const ref = doc(db, "matches", selectedMatch.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSelectedMatch(prev => ({ ...prev, ...snap.data() }));
      }
    });
    return () => unsub();
  }, [selectedMatch?.id]);


  useEffect(() => {
    if (!selectedMatch?.id) return 
    
    ReactGA.event("kamp_visning",{
    })
  }, [selectedMatch])

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

  const matchDate = normalizeDate(selectedMatch.date);
  const isPastMatch = matchDate && matchDate < new Date();
  const effectivelyFinished = selectedMatch.status === "finished" ||
    (selectedMatch.status === "not_started" && isPastMatch);
  const hasPreMatchContent = events.length > 0 || polls.length > 0;
  const noLiveReport = effectivelyFinished && events.length === 0;

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
      <header className="site-header site-header--split">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Tilbake" />
        <h1 className="live-header live-header--compact" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          Breddefotball live
        </h1>
        <ShareButton title={`${homeName} – ${awayName}`} />
      </header>

      <MatchScoreCard
        status={
          effectivelyFinished ? "Slutt"
          : selectedMatch.status === "pause" ? "Pause"
          : selectedMatch.status === "live" ? "Live"
          : "Før kamp"
        }
        homeName={homeName}
        awayName={awayName}
        homeTeamId={selectedMatch.homeTeamId}
        awayTeamId={selectedMatch.awayTeamId}
        result={
          effectivelyFinished
            ? (selectedMatch.homeScore != null ? `${selectedMatch.homeScore} - ${selectedMatch.awayScore}` : "–")
            : (selectedMatch.status === "live" || selectedMatch.status === "pause")
            ? `${selectedMatch.homeScore ?? 0} - ${selectedMatch.awayScore ?? 0}`
            : `Kl ${selectedMatch.time}`
        }
        resultClassName={
          effectivelyFinished && selectedMatch.homeScore == null ? "lp-result--text"
          : !effectivelyFinished && selectedMatch.status !== "live" && selectedMatch.status !== "pause" ? "lp-result--time"
          : ""
        }
      >
        <p className="lp-date">
          {selectedMatch.date?.toDate?.().toLocaleDateString("no-NO")}
        </p>
      </MatchScoreCard>

      {selectedMatch.status === "not_started" && !hasPreMatchContent && !effectivelyFinished && (
        <Countdown date={matchDate} />
      )}

      <main className="page">
        <div className={`match-desktop-layout${noLiveReport ? " match-desktop-layout--full" : ""}`}>
          <div className="match-desktop-main">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} hasFormation={hasFormation} />

            {noLiveReport && activeTab === "rapport" ? (
              <>
                <section className="content-box">
                  <MatchReport
                    match={{...selectedMatch, status: "finished"}}
                    events={[]}
                    matchId={selectedMatch.id}
                    allMatches={allMatches}
                    isFinished={true}
                  />
                </section>
                <BeforeMatchInfo
                  match={selectedMatch}
                  allMatches={allMatches}
                  homeSeason={homeSeason}
                  awaySeason={awaySeason}
                  hideTitle={true}
                />
              </>
            ) : (
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
            )}
          </div>

          {!noLiveReport && (
            <aside className="match-desktop-sidebar">
              <BeforeMatchInfo
                match={selectedMatch}
                allMatches={allMatches}
                homeSeason={homeSeason}
                awaySeason={awaySeason}
                hideTitle={true}
              />
            </aside>
          )}
        </div>
      </main>
      
    </>
  );
}