import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFutbol,
  faSquare,
  faUserInjured,
  faComment,
  faFlag,
  faBullhorn,
  faArrowUp,
  faArrowDown
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

      // ⭐ MÅL
if (e.type === "goal") {
  return (
    <div key={e.id} className="event event-goal">

      {/* IKON I VENSTRE KOLONNE */}
      <span className="event-icon">
        <FontAwesomeIcon icon={faFutbol} />
      </span>

      {/* TEKST */}
      <div className="event-text">

        {/* TITTEL */}
        <p className="goal-title">
          {getTeamName(e.team)} SCORER!
        </p>

        {/* STILLING */}
        <p className="goal-score">
          {e.homeScore}-{e.awayScore}
        </p>

        {/* MÅLSCORER */}
        <p className="goal-detail">
          Mål: {getPlayerName(e.team, e.player)}
        </p>

        {/* ASSIST */}
        {e.assist && (
          <p className="goal-detail">
            Målgivende: {getPlayerName(e.team, e.assist)}
          </p>
        )}

        {/* KOMMENTAR */}
        {e.text && (
          <p className="goal-comment">{e.text}</p>
        )}
      </div>

      {/* MINUTT */}
      <span className="event-minute">
        {formatMinute(e.minute)}'
      </span>
    </div>
  );
}

          // ⭐ SPILLERBYTTE
if (e.type === "sub") {
  return (
    <div key={e.id} className="event event-sub">

      {/* IKON I VENSTRE KOLONNE */}
      <span className="event-icon">
        <FontAwesomeIcon icon={faArrowUp} className="sub-in-icon" />
      </span>

      <div className="event-text">
        <p className="sub-title">
          Spillerbytte – {getTeamName(e.team)}
        </p>

        <p className="sub-in">
          <FontAwesomeIcon icon={faArrowUp} className="sub-in-icon" />
          Inn: {getPlayerName(e.team, e.in)}
        </p>

        <p className="sub-out">
          <FontAwesomeIcon icon={faArrowDown} className="sub-out-icon" />
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

          // ⭐ GULT KORT
          if (e.type === "yellow") {
            return (
              <div key={e.id} className="event event-yellow">
                <span className="event-icon">
                  <FontAwesomeIcon icon={faSquare} className="yellow-card" />
                </span>

                <div className="event-text">
                  <p>Gult kort til {getTeamName(e.team)}</p>
                  <p>{getPlayerName(e.team, e.player)}</p>
                  {e.text && <p>{e.text}</p>}
                </div>

                <span className="event-minute">{formatMinute(e.minute)}'</span>
              </div>
            );
          }

          // ⭐ RØDT KORT
          if (e.type === "red") {
            return (
              <div key={e.id} className="event event-red">
                <span className="event-icon">
                  <FontAwesomeIcon icon={faSquare} className="red-card" />
                </span>

                <div className="event-text">
                  <p>Rødt kort til {getTeamName(e.team)}</p>
                  <p>{getPlayerName(e.team, e.player)}</p>
                  {e.text && <p>{e.text}</p>}
                </div>

                <span className="event-minute">{formatMinute(e.minute)}'</span>
              </div>
            );
          }

          // ⭐ SKADE
          if (e.type === "injury") {
            return (
              <div key={e.id} className="event event-injury">
                <span className="event-icon">
                  <FontAwesomeIcon icon={faUserInjured} />
                </span>

                <div className="event-text">
                  <p>Skade – {getTeamName(e.team)}</p>
                  {e.text && <p>{e.text}</p>}
                </div>

                <span className="event-minute">{formatMinute(e.minute)}'</span>
              </div>
            );
          }

          // ⭐ CORNER
          if (e.type === "corner") {
            return (
              <div key={e.id} className="event event-corner">
                <span className="event-icon">
                  <FontAwesomeIcon icon={faFlag} />
                </span>

                <div className="event-text">
                  <p>Hjørnespark til {getTeamName(e.team)}</p>
                  {e.player && (
                    <p>{getPlayerName(e.team, e.player)} tar corneren</p>
                  )}
                  {e.text && <p>{e.text}</p>}
                </div>

                <span className="event-minute">{formatMinute(e.minute)}'</span>
              </div>
            );
          }

          // ⭐ FRISPARK
          if (e.type === "whistle") {
            return (
              <div key={e.id} className="event event-whistle">
                <span className="event-icon">
                  <FontAwesomeIcon icon={faBullhorn} />
                </span>

                <div className="event-text">
                  <p>Frispark til {getTeamName(e.team)}</p>
                  {e.player && <p>{getPlayerName(e.team, e.player)}</p>}
                  {e.comment && <p>{e.comment}</p>}
                </div>

                <span className="event-minute">{formatMinute(e.minute)}'</span>
              </div>
            );
          }

          // ⭐ KOMMENTAR
          if (e.type === "comment") {
            return (
              <div key={e.id} className="event event-comment">
                <span className="event-icon">
                  <FontAwesomeIcon icon={faComment} />
                </span>

                <div className="event-text">
                  <p>{e.text}</p>
                </div>

                <span className="event-minute">{formatMinute(e.minute)}'</span>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
