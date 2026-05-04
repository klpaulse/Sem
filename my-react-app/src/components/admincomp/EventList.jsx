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
  faCog,
  faClock,
  faImage,
  faArrowUp,
  faArrowDown
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function EventList({ match }) {
  const [events, setEvents] = useState([]);
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);

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

  useEffect(() => {
    if (!match) return;

    const eventsRef = collection(db, "matches", match.id, "events");

    const unsub = onSnapshot(eventsRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      list.sort((a, b) => {
        // Pre-match events (ingen minute) kommer først
        if (a.minute == null && b.minute == null) {
          return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        }
        if (a.minute == null) return -1;
        if (b.minute == null) return 1;
        return a.minute - b.minute;
      });

      setEvents(list);
    });

    return () => unsub();
  }, [match]);

  function getPlayerName(teamId, playerId) {
    const team =
      teamId === match.homeTeamId
        ? homeTeam
        : teamId === match.awayTeamId
        ? awayTeam
        : null;

    if (!team || !team.players) return playerId;

    let players = team.players;

    if (!Array.isArray(players)) {
      players = Object.entries(players).map(([id, value]) => {
        if (typeof value === "string") return { id, name: value };
        return value;
      });
    }

    if (Array.isArray(players) && typeof players[0] === "string") {
      players = players.map((id) => ({ id, name: id }));
    }

    const player = players.find((p) => p.id === playerId);
    return player?.name || playerId;
  }

  function getTeamName(teamId) {
    if (teamId === match.homeTeamId) return homeTeam?.name;
    if (teamId === match.awayTeamId) return awayTeam?.name;
    return "Ukjent lag";
  }

  function getDisplayMinute(minute) {
    if (minute == null) return ""; // ingen minutt for pre-match
    if (!match?.secondHalfStarted) {
      if (minute <= 45) return `${minute}'`;
      return `45+${minute - 45}`;
    }
    if (minute <= 90) return `${minute}'`;
    return `90+${minute - 90}`;
  }

  function getIcon(ev) {
    switch (ev.type) {
      case "goal":        return <FontAwesomeIcon icon={faFutbol} />;
      case "yellow":      return <FontAwesomeIcon icon={faSquare} className="yellow-card" />;
      case "red":         return <FontAwesomeIcon icon={faSquare} className="red-card" />;
      case "injury":      return <FontAwesomeIcon icon={faUserInjured} />;
      case "sub":         return <FontAwesomeIcon icon={faArrowsRotate} />;
      case "comment":     return <FontAwesomeIcon icon={faComment} />;
      case "corner":      return <FontAwesomeIcon icon={faFlag} />;
      case "whistle":     return <FontAwesomeIcon icon={faBullhorn} />;
      case "addedTime":   return <FontAwesomeIcon icon={faClock} />;
      case "image":       return <FontAwesomeIcon icon={faImage} />;
      case "system":      return <FontAwesomeIcon icon={faCog} />;
      case "questionAnswer": return <FontAwesomeIcon icon={faComment} />;
      default:            return null;
    }
  }

  if (!homeTeam || !awayTeam) {
    return <div>Laster hendelser...</div>;
  }

  return (
    <div className="report-container">
      <div className="report-feed">
        <h3>Hendelser</h3>

        {events.map((ev) => {
          const minute = getDisplayMinute(ev.minute);

          return (
            <div key={ev.id} className={`event event-${ev.type}`}>

              <span className="event-icon">{getIcon(ev)}</span>

              <div className="event-text">

                {ev.type === "system" && (
                  <p className="system-text">{ev.text}</p>
                )}

                {ev.type === "goal" && (
                  <>
                    <p className="goal-title">{getTeamName(ev.team)} SCORER!</p>
                    <p className="goal-score">{ev.homeScore}-{ev.awayScore}</p>
                    <p className="goal-detail">Mål: {getPlayerName(ev.team, ev.player)}</p>
                    {ev.assist && (
                      <p className="goal-detail">
                        Målgivende: {getPlayerName(ev.team, ev.assist)}
                      </p>
                    )}
                    {ev.text && <p className="goal-comment">{ev.text}</p>}
                  </>
                )}

                {ev.type === "sub" && (
                  <>
                    <p className="sub-title">Spillerbytte – {getTeamName(ev.team)}</p>
                    <p className="sub-in">
                      <FontAwesomeIcon icon={faArrowUp} /> Inn: {getPlayerName(ev.team, ev.in)}
                    </p>
                    <p className="sub-out">
                      <FontAwesomeIcon icon={faArrowDown} /> Ut: {getPlayerName(ev.team, ev.out)}
                    </p>
                    {ev.comment && <p className="sub-comment">{ev.comment}</p>}
                  </>
                )}

                {ev.type === "yellow" && (
                  <>
                    <p>Gult kort – {getTeamName(ev.team)}</p>
                    <p>{getPlayerName(ev.team, ev.player)}</p>
                    {ev.text && <p>{ev.text}</p>}
                  </>
                )}

                {ev.type === "red" && (
                  <>
                    <p>Rødt kort – {getTeamName(ev.team)}</p>
                    <p>{getPlayerName(ev.team, ev.player)}</p>
                    {ev.text && <p>{ev.text}</p>}
                  </>
                )}

                {ev.type === "injury" && (
                  <>
                    <p>Skade – {getTeamName(ev.team)}</p>
                    {ev.text && <p>{ev.text}</p>}
                  </>
                )}

                {ev.type === "corner" && (
                  <>
                    <p>Hjørnespark – {getTeamName(ev.team)}</p>
                    {ev.player && (
                      <p>{getPlayerName(ev.team, ev.player)} tar corneren</p>
                    )}
                    {ev.text && <p>{ev.text}</p>}
                  </>
                )}

                {ev.type === "whistle" && (
                  <>
                    <p>Frispark – {getTeamName(ev.team)}</p>
                    {ev.player && <p>{getPlayerName(ev.team, ev.player)}</p>}
                    {ev.comment && <p>{ev.comment}</p>}
                  </>
                )}

                {ev.type === "addedTime" && (
                  <>
                    <p>Det er lagt til <strong>{ev.minutes}</strong> minutter</p>
                    {ev.text && <p>{ev.text}</p>}
                  </>
                )}

                {ev.type === "comment" && <p>{ev.text}</p>}

                {ev.type === "image" && (
                  <>
                    {ev.text && <p>{ev.text}</p>}
                    {ev.imageUrl && (
                      <img
                        src={ev.imageUrl}
                        alt="Hendelsesbilde"
                        className="event-image-img"
                      />
                    )}
                  </>
                )}

                {ev.type === "questionAnswer" && (
                  <>
                    <p><strong>{ev.name} spør:</strong> {ev.question}</p>
                    <p><strong>Svar:</strong> {ev.answer}</p>
                  </>
                )}
              </div>

              {/* Vis kun minutt hvis det finnes */}
              {minute && (
                <span className="event-minute">{minute}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}