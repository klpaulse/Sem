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

// 🔥 Felles dato-normalisering
function normalizeDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (d.toDate) return d.toDate(); // Firestore Timestamp
  return new Date(d); // ISO string
}

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
    console.log("match.id:", match?.id)
    if(!match?.id) return 
    const ref = doc(db, "matches", match.id, "formations", "home")
    const unsub = onSnapshot(ref, (snap) => {
      console.log("hasFormation:", snap.exists())
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

      const home = await getSeasonMatches(match.homeTeamId, "2026");
      const away = await getSeasonMatches(match.awayTeamId, "2026");
         console.log("homeTeamId:", match.homeTeamId);
      console.log("awayTeamId:", match.awayTeamId);
      console.log("homeSeason:", home);
      console.log("awaySeason:", away);

      setHomeSeason(home);
      setAwaySeason(away);
    }

    loadSeason();
  }, [match]);

  return (
    <section className="page">
      <h1
        className="live-header"
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }}
      >
        Breddefotball Live
      </h1>
      

      {/* Kampkort */}
      <div className="last-played-card">
        <div className="lp-row">
          <span className="lp-title">{homeName}</span>
          <span className="lp-title">{awayName}</span>
        </div>

        <p className="dato">
          {match.time ||
            matchDate.toLocaleTimeString("no-NO", {
              hour: "2-digit",
              minute: "2-digit",
            })}
        </p>
        <div className="countdown">
        <Countdown date={matchDate} />
      </div>
      </div>

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
  );
}
