import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFutbol,
  faSquare,
  faUserInjured,
  faComment,
  faFlag,
  faBell,
  faRightLeft,
} from "@fortawesome/free-solid-svg-icons";

import { getTeam } from "../services/TeamService";

export default function MatchReport({ match, events }) {
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);

  // Hent lag basert på ID
  useEffect(() => {
    if (!match) return;

    async function loadTeams() {
      const home = await getTeam(match.homeTeam);
      const away = await getTeam(match.awayTeam);

      setHomeTeam(home);
      setAwayTeam(away);
    }

    loadTeams();
  }, [match]);

  if (!match || !homeTeam || !awayTeam) {
    return <p>Laster kamp...</p>;
  }

  // Sjekk om vi er i 2. omgang
  const isSecondHalf = events.some(
    (e) => e.type === "system" && (e.text || "").toLowerCase().includes("2.omgang")
  );

  // Formatér minutt
  const formatMinute = (minute) => {
    if (!isSecondHalf) {
      if (minute <= 45) return minute;
      return `45+${minute - 45}`;
    }
    if (minute <= 90) return minute;
    return `90+${minute - 90}`;
  };

  // Ikoner
  const getIcon = (type) => {
    switch (type) {
      case "goal":
        return <FontAwesomeIcon icon={faFutbol} />;
      case "yellow":
        return <FontAwesomeIcon icon={faSquare} />;
      case "red":
        return <FontAwesomeIcon icon={faSquare} />;
      case "injury":
        return <FontAwesomeIcon icon={faUserInjured} />;
      case "comment":
        return <FontAwesomeIcon icon={faComment} />;
      case "corner":
        return <FontAwesomeIcon icon={faFlag} />;
      case "whistle":
        return <FontAwesomeIcon icon={faBell} />;
      case "sub":
        return <FontAwesomeIcon icon={faRightLeft} />;
      case "system":
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="report-container">
      {/* Toppseksjon */}
      <div className="report-header">
        <h2>
          {homeTeam.teamName} – {awayTeam.teamName}
        </h2>
      </div>

      {/* Live feed */}
      <div className="report-feed">
        <h3>Live oppdatering</h3>

        {events.length === 0 && <p>Ingen hendelser ennå.</p>}

        {events.map((e) => {
          // Systemmeldinger (pause, slutt, 2.omgang osv.)
          if (e.type === "system") {
            return (
              <div key={e.id} className="event event-system">
                {e.text}
              </div>
            );
          }

          // Bytter
          if (e.type === "sub") {
            return (
              <div key={e.id} className="event event-sub">
                <span className="event-icon">{getIcon("sub")}</span>

                <div className="event-text">
                  <p className="sub-title">Spillerbytte – {e.team}</p>
                  <p className="sub-in">Inn: {e.in}</p>
                  <p className="sub-out">Ut: {e.out}</p>
                  {e.comment && <p className="sub-comment">{e.comment}</p>}
                </div>

                <span className="event-minute">{formatMinute(e.minute)}'</span>
              </div>
            );
          }

          // Vanlige hendelser
          return (
            <div key={e.id} className={`event event-${e.type}`}>
              <span className="event-icon">{getIcon(e.type)}</span>

              <div className="event-text">
                <p>{e.text}</p>
              </div>

              <span className="event-minute">{formatMinute(e.minute)}'</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
