import { useEffect, useState } from "react";
import Countdown from "./Countdown";
import "../../assets/style/matchPage.css";
import BeforeMatchInfo from "./BeforeMatchInfo";
import MatchScoreCard from "./MatchScoreCard";
import { getSeasonMatches } from "../../services/MatchService";
import { getTeam } from "../../services/TeamService";
import { useNavigate } from "react-router-dom";
import LagComponent from "./LagComponent";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/Firebase";
import { normalizeDate } from "../../utils/normalizeDate";

export default function BeforeMatch({ match, allMatches }) {
  if (!match) return null;

  const navigate = useNavigate();
  const matchDate = normalizeDate(match.date);

  const [homeSeason, setHomeSeason] = useState([]);
  const [awaySeason, setAwaySeason] = useState([]);
  const [homeName, setHomeName] = useState("Hjemmelag");
  const [awayName, setAwayName] = useState("Bortelag");
  const [hasFormation, setHasFormation] = useState(false);
  const [activeTab, setActiveTab] = useState("Før kampen");

  useEffect(() => {
    if (!match?.id) return;
    const ref = doc(db, "matches", match.id, "formations", "home");
    const unsub = onSnapshot(ref, (snap) => setHasFormation(snap.exists()));
    return () => unsub();
  }, [match]);

  useEffect(() => {
    async function loadNames() {
      if (!match) return;
      if (match.homeTeamId) {
        const home = await getTeam(match.homeTeamId);
        setHomeName(home?.name || "Ukjent lag");
      }
      if (match.awayTeamId) {
        const away = await getTeam(match.awayTeamId);
        setAwayName(away?.name || "Ukjent lag");
      }
    }
    loadNames();
  }, [match]);

  useEffect(() => {
    async function loadSeason() {
      if (!match) return;
      const home = await getSeasonMatches(match.homeTeamId, match.season);
      const away = await getSeasonMatches(match.awayTeamId, match.season);
      setHomeSeason(home);
      setAwaySeason(away);
    }
    loadSeason();
  }, [match]);

  return (
    <>
      <header className="site-header">
        <h1
          className="live-header"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          Breddefotball Live
        </h1>
      </header>

      <div className="match-wrap">
        <MatchScoreCard
          status="Før kamp"
          homeName={homeName}
          awayName={awayName}
          homeTeamId={match.homeTeamId}
          awayTeamId={match.awayTeamId}
          result={match.time || matchDate.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })}
        >
          <Countdown date={matchDate} />
        </MatchScoreCard>


        <main className="page">
          <div className="match-desktop-layout">
            <div className="match-desktop-main">
              {hasFormation && (
                <nav className="nav">
                  <button className="nav-btn" onClick={() => setActiveTab("Før kampen")}>Før kampen</button>
                  <button className="nav-btn" onClick={() => setActiveTab("lag")}>Lag</button>
                </nav>
              )}

              {activeTab === "Før kampen" && (
                <div className="match-info-mobile-only">
                  <BeforeMatchInfo
                    match={match}
                    allMatches={allMatches}
                    homeSeason={homeSeason}
                    awaySeason={awaySeason}
                    hideTitle={true}
                  />
                </div>
              )}

              {hasFormation && activeTab === "lag" && (
                <LagComponent match={match} />
              )}
            </div>

            <aside className="match-desktop-sidebar">
              <BeforeMatchInfo
                match={match}
                allMatches={allMatches}
                homeSeason={homeSeason}
                awaySeason={awaySeason}
                hideTitle={true}
              />
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}

function MatchMeta({ match, matchDate }) {
  const parts = [];

  if (matchDate) {
    const dateStr = matchDate.toLocaleDateString("nb-NO", {
      weekday: "short", day: "numeric", month: "long",
    });
    parts.push(match?.time ? `${dateStr}, kl. ${match.time}` : dateStr);
  }

  if (match?.arena) parts.push(match.arena);
  if (match?.division) parts.push(match.division);

  if (parts.length === 0) return null;

  return (
    <p className="match-meta-strip">{parts.join(" · ")}</p>
  );
}
