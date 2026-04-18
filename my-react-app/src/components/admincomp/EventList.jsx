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

  // ⭐ Hent lagnavn
  function getTeamName(teamId) {
    if (teamId === match.homeTeamId) return homeTeam?.name;
    if (teamId === match.awayTeamId) return awayTeam?.name;
    return "Ukjent lag";
  }

  if (!homeTeam || !awayTeam) {
    return <div>Laster hendelser...</div>;
  }

  // ⭐ Minutt-format
  function getDisplayMinute(minute) {
    if (!match?.secondHalfStarted) {
      if (minute <= 45) return `${minute}'`;
      return `45+${minute - 45}`;
    }

    if (minute <= 90) return `${minute}'`;
    return `90+${minute - 90}`;
  }

  // ⭐ Ikoner
  function getIcon(ev) {
    switch (ev.type) {
      case "goal":
        return <FontAwesomeIcon icon={faFutbol} />;
      case "yellow":
        return <FontAwesomeIcon icon={faSquare} className="yellow-card" />;
      case "red":
        return <FontAwesomeIcon icon={faSquare} className="red-card" />;
      case "injury":
        return <FontAwesomeIcon icon={faUserInjured} />;
      case "sub":
        return <FontAwesomeIcon icon={faArrowsRotate} />;
      case "comment":
        return <FontAwesomeIcon icon={faComment} />;
      case "corner":
        return <FontAwesomeIcon icon={faFlag} />;
      case "whistle":
        return <FontAwesomeIcon icon={faBullhorn} />;
      case "addedTime":
        return <FontAwesomeIcon icon={faClock} />;
      case "image":
        return <FontAwesomeIcon icon={faImage} />;
      case "system":
        return <FontAwesomeIcon icon={faCog} />;
      case "questionAnswer":
        return <FontAwesomeIcon icon={faComment} />;
      default:
        return null;
    }
  }

  return (
    <div className="report-container">
      <div className="report-feed">

        <h3>Hendelser</h3>

        {events.map((ev) => (
          <div key={ev.id} className={`event event-${ev.type}`}>

            {/* Ikon */}
            <span className="event-icon">{getIcon(ev)}</span>

            {/* Tekst */}
            <div className="event-text">

              {/* ⭐ SYSTEM */}
              {ev.type === "system" && (
                <p className="system-text">{ev.text}</p>
              )}

              {/* ⭐ MÅL */}
              {ev.type === "goal" && (
                <>
                  <p className="goal-title">{getTeamName(ev.team)} SCORER!</p>
                  <p className="goal-score">
                    {ev.homeScore}-{ev.awayScore}
                  </p>
                  <p className="goal-detail">
                    Mål: {getPlayerName(ev.team, ev.player)}
                  </p>
                  {ev.assist && (
                    <p className="goal-detail">
                      Målgivende: {getPlayerName(ev.team, ev.assist)}
                    </p>
                  )}
                  {ev.text && <p className="goal-comment">{ev.text}</p>}
                </>
              )}

              {/* ⭐ BYTTE */}
              {ev.type === "sub" && (
                <>
                  <p className="sub-title">Spillerbytte – {getTeamName(ev.team)}</p>
                  <p className="sub-in">
                    <FontAwesomeIcon icon={faArrowUp} /> Inn:{" "}
                    {getPlayerName(ev.team, ev.in)}
                  </p>
                  <p className="sub-out">
                    <FontAwesomeIcon icon={faArrowDown} /> Ut:{" "}
                    {getPlayerName(ev.team, ev.out)}
                  </p>
                  {ev.comment && <p className="sub-comment">{ev.comment}</p>}
                </>
              )}

              {/* ⭐ GULT KORT */}
              {ev.type === "yellow" && (
                <>
                  <p>Gult kort – {getTeamName(ev.team)}</p>
                  <p>{getPlayerName(ev.team, ev.player)}</p>
                  {ev.text && <p>{ev.text}</p>}
                </>
              )}

              {/* ⭐ RØDT KORT */}
              {ev.type === "red" && (
                <>
                  <p>Rødt kort – {getTeamName(ev.team)}</p>
                  <p>{getPlayerName(ev.team, ev.player)}</p>
                  {ev.text && <p>{ev.text}</p>}
                </>
              )}

              {/* ⭐ SKADE */}
              {ev.type === "injury" && (
                <>
                  <p>Skade – {getTeamName(ev.team)}</p>
                  {ev.text && <p>{ev.text}</p>}
                </>
              )}

              {/* ⭐ CORNER */}
              {ev.type === "corner" && (
                <>
                  <p>Hjørnespark – {getTeamName(ev.team)}</p>
                  {ev.player && (
                    <p>{getPlayerName(ev.team, ev.player)} tar corneren</p>
                  )}
                  {ev.text && <p>{ev.text}</p>}
                </>
              )}

              {/* ⭐ FRISPARK */}
              {ev.type === "whistle" && (
                <>
                  <p>Frispark – {getTeamName(ev.team)}</p>
                  {ev.player && <p>{getPlayerName(ev.team, ev.player)}</p>}
                  {ev.comment && <p>{ev.comment}</p>}
                </>
              )}

              {/* ⭐ TILLEGGSTID */}
              {ev.type === "addedTime" && (
                <>
                  <p>
                    Det er lagt til <strong>{ev.minutes}</strong> minutter
                  </p>
                  {ev.text && <p>{ev.text}</p>}
                </>
              )}

              {/* ⭐ KOMMENTAR */}
              {ev.type === "comment" && <p>{ev.text}</p>}

              {/* ⭐ BILDE */}
              {ev.type === "image" && (
                <>
                  <p>Bildehendelse</p>
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

              {/* ⭐ PUBLIKUMSSPØRSMÅL */}
              {ev.type === "questionAnswer" && (
                <>
                  <p>
                    <strong>{ev.name} spør:</strong> {ev.question}
                  </p>
                  <p>
                    <strong>Svar:</strong> {ev.answer}
                  </p>
                </>
              )}
            </div>

            {/* Minutt */}
            <span className="event-minute">{getDisplayMinute(ev.minute)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}








