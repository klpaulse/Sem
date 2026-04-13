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
  if (!match) return null;

  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);

  // Hent lagene
  useEffect(() => {
    async function loadTeams() {
      const home = await getTeam(match.homeTeamId);
      const away = await getTeam(match.awayTeamId);

      setHomeTeam(home);
      setAwayTeam(away);
    }
    loadTeams();
  }, [match]);

  if (!homeTeam || !awayTeam) {
    return <div>Laster kampdata...</div>;
  }

  // Robust spilleroppslag
  function getPlayerName(teamId, playerId) {
    const team = teamId === match.homeTeamId ? homeTeam : awayTeam;

    const players = Array.isArray(team?.players)
      ? team.players
      : Object.values(team?.players || {});

    const found = players.find((p) => p.id === playerId);

    return found?.name || playerId;
  }

  function getTeamName(teamId) {
    if (teamId === match.homeTeamId) return homeTeam?.name;
    if (teamId === match.awayTeamId) return awayTeam?.name;
    return "Ukjent lag";
  }

  const isSecondHalf = events.some(
    (e) =>
      e.type === "system" &&
      (e.text || "").toLowerCase().includes("2. omgang")
  );

  const formatMinute = (minute) => {
    if (!isSecondHalf) {
      if (minute <= 45) return minute;
      return `45+${minute - 45}`;
    }
    if (minute <= 90) return minute;
    return `90+${minute - 90}`;
  };

  const getIcon = (type) => {
    switch (type) {
      case "goal":
        return <FontAwesomeIcon icon={faFutbol} />;
      case "yellow":
        return <FontAwesomeIcon icon={faSquare} style={{ color: "#f4d03f" }} />;
      case "red":
        return <FontAwesomeIcon icon={faSquare} style={{ color: "#e74c3c" }} />;
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
      default:
        return null;
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="report-container">
        <div className="report-feed">
          <h3>Kampen er ferdig</h3>
          <p>Det ble ikke ført live‑rapport for denne kampen.</p>
        </div>
      </div>
    );
  }

  const sortedEvents = [...events].sort((a, b) => a.minute - b.minute);

  return (
    <div className="report-container">
      <div className="report-feed">
        <h3>{match.status === "finished" ? "Kampreferat" : "Live oppdatering"}</h3>

        {sortedEvents.map((e) => {

          // ⭐ SYSTEM
          if (e.type === "system") {
            return (
              <div key={e.id} className="event event-system">
                {e.text}
              </div>
            );
          }

          // ⭐ SPILLERBYTTE
          if (e.type === "sub") {
            return (
              <div key={e.id} className="event event-sub">
                <span className="event-icon">{getIcon("sub")}</span>

                <div className="event-text">
                  <p className="sub-title">
                    Spillerbytte – {getTeamName(e.team)}
                  </p>

                  <p className="sub-in">
                    Inn: {getPlayerName(e.team, e.in)}
                  </p>

                  <p className="sub-out">
                    Ut: {getPlayerName(e.team, e.out)}
                  </p>

                  {e.comment && (
                    <p className="sub-comment">{e.comment}</p>
                  )}
                </div>

                <span className="event-minute">{formatMinute(e.minute)}'</span>
              </div>
            );
          }

          // ⭐ FRISPARK (whistle)
          if (e.type === "whistle") {
            return (
              <div key={e.id} className="event event-whistle">
                <span className="event-icon">{getIcon("whistle")}</span>

                <div className="event-text">
                  <p>Frispark til {getTeamName(e.team)}</p>

                  {e.player && (
                    <p className="sub-in">
                    {getPlayerName(e.team, e.player)}
                    </p>
                  )}

                  {e.comment && (
                    <p className="sub-comment">{e.comment}</p>
                  )}
                </div>

                <span className="event-minute">{formatMinute(e.minute)}'</span>
              </div>
            );
          }

          // ⭐ STANDARD-EVENTER (mål, kort, corner, kommentar)
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
