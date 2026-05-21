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
import ShareButton from "../shared/ShareButton";

export default function BeforeMatch({ match, allMatches }) {
  if (!match) return null;

  const navigate = useNavigate();
  const matchDate = normalizeDate(match.date);

  const [homeSeason, setHomeSeason] = useState([]);
  const [awaySeason, setAwaySeason] = useState([]);
  const [homeName, setHomeName] = useState("Hjemmelag");
  const [awayName, setAwayName] = useState("Bortelag");
  const [hasFormation, setHasFormation] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    if (!match?.id) return;
    const ref = doc(db, "matches", match.id, "formations", "home");
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      setHasFormation(snap.exists() && Object.keys(data?.positions || {}).length > 0);
    });
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
      <header className="site-header site-header--split">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Tilbake" />
        <h1
          className="live-header live-header--compact"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          Breddefotball Live
        </h1>
        <ShareButton title={`${homeName} – ${awayName}`} />
      </header>

      <main className="page">
        <MatchScoreCard
          status="Før kamp"
          homeName={homeName}
          awayName={awayName}
          homeTeamId={match.homeTeamId}
          awayTeamId={match.awayTeamId}
          result={match.time || matchDate.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })}
          resultClassName="lp-result--time"
        >
          <Countdown date={matchDate} />
        </MatchScoreCard>

        <div className="match-desktop-layout">
          <div className={`match-desktop-main${!hasFormation ? " match-desktop-main--full" : ""}`}>

            {hasFormation && (
              <nav className="nav">
                <button className="nav-btn" onClick={() => setActiveTab("info")}>Før kampen</button>
                <button className="nav-btn" onClick={() => setActiveTab("lag")}>Lag</button>
              </nav>
            )}

            {/* Mobile only: BeforeMatchInfo */}
            {(!hasFormation || activeTab === "info") && (
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

            {/* Mobile: Lag tab */}
            {hasFormation && activeTab === "lag" && (
              <div className="upcoming-mobile-only">
                <LagComponent match={match} />
              </div>
            )}

            {/* Desktop: Lag on left when formation exists */}
            {hasFormation && (
              <div className="upcoming-desktop-only">
                <LagComponent match={match} />
              </div>
            )}

            {/* Desktop: full-width BeforeMatchInfo when no formation */}
            {!hasFormation && (
              <div className="upcoming-full-info">
                <BeforeMatchInfo
                  match={match}
                  allMatches={allMatches}
                  homeSeason={homeSeason}
                  awaySeason={awaySeason}
                  hideTitle={true}
                />
              </div>
            )}
          </div>

          {hasFormation && (
            <aside className="match-desktop-sidebar">
              <BeforeMatchInfo
                match={match}
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
