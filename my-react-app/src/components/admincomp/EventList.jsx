import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../config/Firebase";
import { getTeam } from "../../services/TeamService";

import {
  faFutbol,
  faSquare,
  faUserInjured,
  faArrowsRotate,
  faComment,
  faFlag,
  faBullhorn,
  faCog
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function EventList({ match }) {
  const [events, setEvents] = useState([]);
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);

  // ⭐ Hent lag
  useEffect(() => {
    if (!match) return;


    async function loadTeams() {
      const home = await getTeam(match.homeTeamId);
      const away = await getTeam(match.awayTeamId);

      setHomeTeam(home);
      setAwayTeam(away);
    }

    loadTeams();
  }, [match]);

  // ⭐ Hent hendelser live
  useEffect(() => {
    if (!match) return;

    const eventsRef = collection(db, "matches", match.id, "events");

    const unsub = onSnapshot(eventsRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => a.minute - b.minute);
      setEvents(list);
    });

    return () => unsub();
  }, [match]);

  // ⭐ Hent spillernavn
  function getPlayerName(teamId, playerId) {
    const team =
      teamId === match.homeTeamId
        ? homeTeam
        : teamId === match.awayTeamId
        ? awayTeam
        : null;

    if (!team) return playerId;

    const players = Array.isArray(team.players)
      ? team.players
      : Object.values(team.players || {});

    return players.find((p) => p.id === playerId)?.name || playerId;
  }

  // ⭐ Hent lagnavn
  function getTeamName(teamId) {
    if (teamId === match.homeTeamId) return homeTeam?.name;
    if (teamId === match.awayTeamId) return awayTeam?.name;
    return "Ukjent lag";
  }

  if (!homeTeam || !awayTeam) {
    return <div>Laster hendelser...</div>;
    // ⭐ GLOBAL DEBUG
console.log("EVENTLIST – EVENTS:", events);
console.log("HOME TEAM PLAYERS:", homeTeam?.players);
console.log("AWAY TEAM PLAYERS:", awayTeam?.players);
  }

  // ⭐ Ikoner
  function getIcon(ev) {
    switch (ev.type) {
      case "goal":
        return <FontAwesomeIcon icon={faFutbol} className="event-icon" />;
      case "yellow":
        return <FontAwesomeIcon icon={faSquare} className="event-icon yellow-card" />;
      case "red":
        return <FontAwesomeIcon icon={faSquare} className="event-icon red-card" />;
      case "injury":
        return <FontAwesomeIcon icon={faUserInjured} className="event-icon" />;
      case "sub":
        return <FontAwesomeIcon icon={faArrowsRotate} className="event-icon" />;
      case "comment":
        return <FontAwesomeIcon icon={faComment} className="event-icon" />;
      case "corner":
        return <FontAwesomeIcon icon={faFlag} className="event-icon" />;
      case "whistle":
        return <FontAwesomeIcon icon={faBullhorn} className="event-icon" />;
      case "system":
        return <FontAwesomeIcon icon={faCog} className="event-icon" />;
      default:
        return null;
    }
  }

  return (
    <section>
      <h3>Hendelser</h3>

      {events.map((ev) => (
        
        <div key={ev.id} className={`event event-${ev.type}`}>
          {/* Ikon */}
          <div className="event-icon">{getIcon(ev)}</div>

          {/* Tekst */}
          <div className="event-text">
            {/* Tittel */}
            <p>
              {ev.type === "goal" && `${getTeamName(ev.team)} SCORER!`}
              {ev.type === "yellow" && `Gult kort – ${getTeamName(ev.team)}`}
              {ev.type === "red" && `Rødt kort – ${getTeamName(ev.team)}`}
              {ev.type === "injury" && `Skade – ${getTeamName(ev.team)}`}
              {ev.type === "sub" && `Bytte – ${getTeamName(ev.team)}`}
              {ev.type === "corner" && `Corner – ${getTeamName(ev.team)}`}
              {ev.type === "whistle" && `Frispark – ${getTeamName(ev.team)}`}
              {ev.type === "comment" && `Kommentar`}
              {ev.type === "system" && `${ev.text}`}
            </p>

            {/* ⭐ MÅL */}
            {ev.type === "goal" && (
              <>
                <p className="goal-detail">
                  Mål: <strong>{getPlayerName(ev.team, ev.player)}</strong>
                </p>

                {ev.assist && (
                  <p className="goal-detail">
                    Assist: <strong>{getPlayerName(ev.team, ev.assist)}</strong>
                  </p>
                )}
              </>
            )}

            {/* ⭐ BYTTE */}
            {ev.type === "sub" && (
              <>
                <p>
                  Inn: <strong>{getPlayerName(ev.team, ev.in)}</strong>
                </p>
                <p>
                  Ut: <strong>{getPlayerName(ev.team, ev.out)}</strong>
                </p>
              </>
            )}

            {/* ⭐ Kommentar */}
            {ev.text && ev.type !== "system" && ev.type !== "sub" && (
              <p>{ev.text}</p>
            )}
          </div>

          {/* Minutt */}
          <div className="event-minute">{ev.minute}'</div>
        </div>
      ))}
    </section>
  );
}