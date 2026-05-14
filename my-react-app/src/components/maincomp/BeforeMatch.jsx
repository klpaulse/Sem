import { useEffect, useState } from "react";
import Countdown from "../Countdown";
import "../../assets/style/matchPage.css";
import BeforeMatchInfo from "./BeforeMatchInfo";
import { getSeasonMatches } from "../../services/MatchService";
import { getTeam } from "../../services/TeamService";
import { useNavigate } from "react-router-dom";
import LagComponent from "./LagComponent";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/Firebase";
import { normalizeDate } from "../../utils/normalizeDate";
import { CURRENT_SEASON } from "../../config/season";

export default function BeforeMatch({ match, allMatches}) {
  if (!match) return null;

  const navigate = useNavigate();
  const matchDate = normalizeDate(match.date);

  const [homeSeason, setHomeSeason] = useState([]);
  const [awaySeason, setAwaySeason] = useState([]);

  const [homeName, setHomeName] = useState("Hjemmelag");
  const [awayName, setAwayName] = useState("Bortelag");
  const [hasFormation, setHasFormation] = useState(false)
  const [activeTab, setActiveTab] = useState("Før kampen")

  useEffect(() => {
    if(!match?.id) return
    const ref = doc(db, "matches", match.id, "formations", "home")
    const unsub = onSnapshot(ref, (snap) => {
      setHasFormation(snap.exists())
    })
    return () => unsub()
  }, [match])

  // ⭐ Hent lagnavn basert på ID
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

  // ⭐ Hent sesongstatistikk
  useEffect(() => {
    async function loadSeason() {
      if (!match) return;

      const home = await getSeasonMatches(match.homeTeamId, CURRENT_SEASON);
      const away = await getSeasonMatches(match.awayTeamId, CURRENT_SEASON);
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
      

      {/* Kampkort */}
      <div className="last-played-card">
        <p className="lp-status">Før kamp</p>
        <div className="lp-row">
          <span className="lp-title">{homeName}</span>
        <p className="lp-result">
          {match.time ||
            matchDate.toLocaleTimeString("no-NO", {
              hour: "2-digit",
              minute: "2-digit",
            })}
        </p>
        <span className="lp-title">{awayName}</span>
        </div>

       

        <Countdown date={matchDate} />
      </div>

<section className="page">
       {hasFormation && (
    <nav className="nav">
      <button
        className="nav-btn"
        onClick={() => setActiveTab("Før kampen")}
      >
        Før kampen
      </button>
      <button
        className="nav-btn"
        onClick={() => setActiveTab("lag")}
      >
        Lag
      </button>
    </nav>
  )}

  {activeTab === "Før kampen" && (
    <BeforeMatchInfo
      match={match}
      allMatches={allMatches}
      homeSeason={homeSeason}
      awaySeason={awaySeason}
    />
  )}

  {hasFormation && activeTab === "lag" && (
    <LagComponent match={match} />
  )}

</section>
</>
  );
}
