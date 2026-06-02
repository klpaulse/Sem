import { useEffect, useRef, useState } from "react";
import { useLiveSidebar } from "../context/LiveSidebarContext";
import { collection, onSnapshot, getDocs, doc } from "firebase/firestore";
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
import GoalWidget from "../components/match/GoalWidget"
import MatchSummary from "../components/match/MatchSummary"

export default function MatchPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { pin, pinned } = useLiveSidebar();

  const [allMatches, setAllMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [polls, setPolls] = useState([]);
  const [activeTab, setActiveTab] = useState("rapport");
  const [homeName, setHomeName] = useState("Hjemmelag");
  const [awayName, setAwayName] = useState("Bortelag");
  const [homeLogo, setHomeLogo] = useState(null);
  const [awayLogo, setAwayLogo] = useState(null);
  const [hasFormation, setHasFormation] = useState(false);
  const [homeSeason, setHomeSeason] = useState([])
  const [awaySeason, setAwaySeason] = useState([])
  const [showGoalWidget, setShowGoalWidget] = useState(false)
  const [eventsLoaded, setEventsLoaded] = useState(false)
  const seenEventIdsRef = useRef(new Set())

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
    if (!events.length || !selectedMatch) return;
    const isFirstLoad = seenEventIdsRef.current.size === 0;
    let hasNewGoal = false;
    events.forEach(e => {
      if (!seenEventIdsRef.current.has(e.id)) {
        if (!isFirstLoad && e.type === "goal") hasNewGoal = true;
        seenEventIdsRef.current.add(e.id);
      }
    });
    if (!isFirstLoad && hasNewGoal) setShowGoalWidget(true);
  }, [events, selectedMatch]);

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
    if (!selectedMatch?.id) return;
    setEventsLoaded(false);
    const unsub = onSnapshot(collection(db, "matches", selectedMatch.id, "events"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setEvents(list);
      setEventsLoaded(true);
    });
    return () => unsub();
  }, [selectedMatch?.id]);

  useEffect(() => {
    async function loadNames() {
      if (!selectedMatch) return;
      if (selectedMatch.homeTeamId) {
        const home = await getTeam(selectedMatch.homeTeamId);
        setHomeName(home?.name || "Ukjent lag");
        setHomeLogo(home?.logoUrl || null);
      }
      if (selectedMatch.awayTeamId) {
        const away = await getTeam(selectedMatch.awayTeamId);
        setAwayName(away?.name || "Ukjent lag");
        setAwayLogo(away?.logoUrl || null);
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
  const hasLiveEvents = events.some(e =>
    e.minute != null || e.type === "system" || e.type === "comment" || e.type === "image" || e.type === "whistle"
  );
  const noLiveReport   = eventsLoaded && effectivelyFinished && events.length === 0;
  const isManualResult = eventsLoaded && effectivelyFinished && events.length > 0 && !hasLiveEvents;
  const showSummaryLayout = noLiveReport || isManualResult;
  const isUpcomingInLayout = selectedMatch.status === "not_started" && !effectivelyFinished;
  const isLive = selectedMatch.status === "live" || selectedMatch.status === "pause";
  const useLiveLayout = isLive || (events.length > 0 && hasLiveEvents) || (!eventsLoaded && effectivelyFinished);

  if ((selectedMatch.status === "postponed" || (selectedMatch.status === "not_started" && !isPastMatch)) && !hasPreMatchContent) {
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

      {showGoalWidget && (
        <GoalWidget
          events={events}
          homeScore={selectedMatch.homeScore}
          awayScore={selectedMatch.awayScore}
          homeName={homeName}
          awayName={awayName}
          onClose={() => setShowGoalWidget(false)}
        />
      )}

      <main className={`page match-page${
        useLiveLayout && activeTab === "lag" ? " page--lag-wide" :
        useLiveLayout && activeTab === "tabell" ? " match-page--tabell" :
        useLiveLayout ? " match-page--rapport" :
        ""
      }`}>
        <MatchScoreCard
          status={
            selectedMatch.status === "postponed" ? "Utsatt"
            : effectivelyFinished ? "Slutt"
            : selectedMatch.status === "pause" ? "Pause"
            : selectedMatch.status === "live" ? "Live"
            : "Før kamp"
          }
          homeName={homeName}
          awayName={awayName}
          homeTeamId={selectedMatch.homeTeamId}
          awayTeamId={selectedMatch.awayTeamId}
          homeLogo={homeLogo}
          awayLogo={awayLogo}
          result={
            selectedMatch.status === "postponed"
              ? `Kl ${selectedMatch.time}`
            : effectivelyFinished
              ? (selectedMatch.homeScore != null ? `${selectedMatch.homeScore} - ${selectedMatch.awayScore}` : "–")
            : (selectedMatch.status === "live" || selectedMatch.status === "pause")
              ? `${selectedMatch.homeScore ?? 0} - ${selectedMatch.awayScore ?? 0}`
              : `Kl ${selectedMatch.time}`
          }
          resultClassName={
            selectedMatch.status === "postponed" ? "lp-result--time"
            : effectivelyFinished && selectedMatch.homeScore == null ? "lp-result--text"
            : !effectivelyFinished && selectedMatch.status !== "live" && selectedMatch.status !== "pause" ? "lp-result--time"
            : ""
          }
        >
          <p className="lp-date">
            {selectedMatch.date?.toDate?.().toLocaleDateString("no-NO")}
          </p>
        </MatchScoreCard>

        {isLive && (
          <button
            className="follow-live-btn"
            onClick={() => pin({
              id: selectedMatch.id,
              slug: selectedMatch.slug,
              homeName,
              awayName,
              homeTeamId: selectedMatch.homeTeamId,
              awayTeamId: selectedMatch.awayTeamId,
            })}
          >
            Følg live i sidebar →
          </button>
        )}

        {selectedMatch.status === "not_started" && !hasPreMatchContent && !effectivelyFinished && (
          <Countdown date={matchDate} />
        )}

        {useLiveLayout && !showSummaryLayout && (
          <div className="live-nav-desktop">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} hasFormation={hasFormation} />
          </div>
        )}

        <div className={`match-desktop-layout${!useLiveLayout && (!isUpcomingInLayout || hasFormation) ? " match-desktop-layout--has-sidebar" : useLiveLayout && activeTab === "lag" ? " match-desktop-layout--lag" : useLiveLayout && activeTab === "tabell" ? " match-desktop-layout--tabell" : useLiveLayout ? " match-desktop-layout--rapport-full" : ""}`}>
          <div className={`match-desktop-main${
            (isUpcomingInLayout && !hasFormation) || (useLiveLayout && activeTab === "rapport")
              ? " match-desktop-main--full"
              : ""
          }`}>
            <div className={`${showSummaryLayout || (isUpcomingInLayout && hasFormation) ? "tabs-hidden-desktop" : ""}${useLiveLayout && !showSummaryLayout ? " live-nav-mobile-only" : ""}`}>
              <Tabs activeTab={activeTab} setActiveTab={setActiveTab} hasFormation={hasFormation} />
            </div>

            {showSummaryLayout && activeTab === "rapport" ? (
              <>
                <section className="content-box">
                  {isManualResult ? (
                    <MatchSummary
                      events={events}
                      homeTeamId={selectedMatch.homeTeamId}
                      awayTeamId={selectedMatch.awayTeamId}
                      homeName={homeName}
                      awayName={awayName}
                      homeLogo={homeLogo}
                      awayLogo={awayLogo}
                    />
                  ) : (
                    <MatchReport
                      match={{...selectedMatch, status: "finished"}}
                      events={[]}
                      matchId={selectedMatch.id}
                      allMatches={allMatches}
                      isFinished={true}
                    />
                  )}
                </section>
                <div className="no-report-mobile-info">
                  <BeforeMatchInfo
                    match={selectedMatch}
                    allMatches={allMatches}
                    homeSeason={homeSeason}
                    awaySeason={awaySeason}
                    hideTitle={true}
                    hideKampinfo={true}
                  />
                </div>
                <section className="content-box no-report-desktop-table">
                  <TabellComponent match={selectedMatch} />
                </section>
              </>
            ) : useLiveLayout ? (
              <>
                {/* Desktop: rapport alltid synlig til venstre */}
                <section className="content-box live-rapport-desktop-only">
                  <MatchReport
                    match={{...selectedMatch, status: effectivelyFinished ? "finished" : selectedMatch.status}}
                    events={events}
                    matchId={selectedMatch.id}
                    allMatches={allMatches}
                    isFinished={effectivelyFinished}
                  />
                </section>
                {/* Mobil: tab-styrt innhold */}
                <section className={`content-box live-mobile-tabs${activeTab === "lag" ? " content-box--lag" : ""}`}>
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
              </>
            ) : (
              <>
                {isUpcomingInLayout && hasFormation && (
                  <section className="content-box content-box--lag upcoming-desktop-only">
                    <LagComponent match={selectedMatch} />
                  </section>
                )}

                {isUpcomingInLayout && !hasFormation && (
                  <div className="upcoming-full-info">
                    <BeforeMatchInfo
                      match={selectedMatch}
                      allMatches={allMatches}
                      homeSeason={homeSeason}
                      awaySeason={awaySeason}
                      hideTitle={true}
                      hideKampinfo={false}
                    />
                  </div>
                )}

                <section className={`content-box${activeTab === "lag" ? " content-box--lag" : ""}${isUpcomingInLayout && hasFormation ? " upcoming-mobile-only" : ""}${isUpcomingInLayout && !hasFormation ? " upcoming-tabs-desktop-hide" : ""}`}>
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
              </>
            )}
          </div>

          {useLiveLayout ? (
            (activeTab === "tabell" || activeTab === "lag") && (
              <aside className={`match-desktop-sidebar${activeTab === "lag" ? " match-desktop-sidebar--lag" : activeTab === "tabell" ? " match-desktop-sidebar--tabell" : ""}`}>
                {activeTab === "tabell" && (
                  <section className="content-box">
                    <TabellComponent match={selectedMatch} />
                  </section>
                )}
                {activeTab === "lag" && <LagComponent match={selectedMatch} sideLayout />}
              </aside>
            )
          ) : (!isUpcomingInLayout || hasFormation) ? (
            <aside className="match-desktop-sidebar">
              <BeforeMatchInfo
                match={selectedMatch}
                allMatches={allMatches}
                homeSeason={homeSeason}
                awaySeason={awaySeason}
                hideTitle={true}
                hideKampinfo={effectivelyFinished}
              />
            </aside>
          ) : null}
        </div>
      </main>
    </>
  );
}