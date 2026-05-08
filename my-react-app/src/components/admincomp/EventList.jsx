import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
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

export default function EventList({ match, isPreMatch = false }) {
  const [events, setEvents] = useState([]);
  const [polls, setPolls] = useState([]);
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);

  /* -----------------------------
      HENT LAG
  ------------------------------ */
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

  /* -----------------------------
      HENT EVENTS
  ------------------------------ */
  useEffect(() => {
    if (!match) return;

    const eventsRef = collection(db, "matches", match.id, "events");
    const qEvents = query(eventsRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(qEvents, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (isPreMatch) {
        setEvents(list.filter((e) => e.preMatch === true));
      } else {
        setEvents(list);
      }
    });

    return () => unsub();
  }, [match, isPreMatch]);

  /* -----------------------------
      HENT POLLS
  ------------------------------ */
  useEffect(() => {
    if (!match) return;

    const pollsRef = collection(db, "matches", match.id, "polls");
    const unsub = onSnapshot(pollsRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (isPreMatch) {
        setPolls(list.filter((p) => p.preMatch === true && p.active));
      } else {
        setPolls(list.filter((p) => !p.preMatch));
      }
    });

    return () => unsub();
  }, [match, isPreMatch]);

  /* -----------------------------
      KOMBINERT FEED (kun under kamp)
  ------------------------------ */
  const combinedFeed = isPreMatch
    ? events
    : [
        ...events,
        ...polls.map((p) => ({ ...p, _isPoll: true })),
      ].sort((a, b) => {
        const aTime = a.createdAt?.seconds ?? 0;
        const bTime = b.createdAt?.seconds ?? 0;
        return aTime - bTime;
      });

  /* -----------------------------
      HJELPEFUNKSJONER
  ------------------------------ */
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
    if (minute == null) return "";
    if (!match?.secondHalfStarted) {
      if (minute <= 45) return `${minute}'`;
      return `45+${minute - 45}`;
    }
    if (minute <= 90) return `${minute}'`;
    return `90+${minute - 90}`;
  }

  function getIcon(ev) {
    switch (ev.type) {
      case "goal":      return <FontAwesomeIcon icon={faFutbol} />;
      case "yellow":    return <FontAwesomeIcon icon={faSquare} className="yellow-card" />;
      case "red":       return <FontAwesomeIcon icon={faSquare} className="red-card" />;
      case "injury":    return <FontAwesomeIcon icon={faUserInjured} />;
      case "sub":       return <FontAwesomeIcon icon={faArrowsRotate} />;
      case "comment":   return <FontAwesomeIcon icon={faComment} />;
      case "corner":    return <FontAwesomeIcon icon={faFlag} />;
      case "whistle":   return <FontAwesomeIcon icon={faBullhorn} />;
      case "addedTime": return <FontAwesomeIcon icon={faClock} />;
      case "image":     return <FontAwesomeIcon icon={faImage} />;
      case "system":    return <FontAwesomeIcon icon={faCog} />;
      default:          return null;
    }
  }

  if (!homeTeam || !awayTeam) {
    return <div>Laster hendelser...</div>;
  }

  return (
    <div className="report-container">
      <div className="report-feed">
        <h3>Hendelser</h3>

        {/* ⭐ STICKY POLL FØR KAMP */}
        {isPreMatch && polls.length > 0 && (
          <div className="event event-poll sticky">
            <h4>{polls[0].question}</h4>
            {polls[0].options.map((opt, i) => (
              <p key={i} className="poll-option">{opt.text}</p>
            ))}
          </div>
        )}

        {/* ⭐ KOMBINERT FEED – polls interleaved med events under kamp */}
        {combinedFeed.map((item) => {
          if (item._isPoll) {
  return (
    <div key={item.id} className="event event-comment">
      <span className="event-icon">
        <FontAwesomeIcon icon={faComment} />
      </span>

      <div className="event-text">
        <p><strong>{item.question}</strong></p>
        {item.options.map((opt, i) => (
          <p key={i}>• {opt.text}</p>
        ))}
      </div>

      {/* ⭐ Tom kolonne – ingen minutt, men riktig layout */}
      <span className="event-minute"></span>
    </div>
  );
}


          const minute = getDisplayMinute(item.minute);

          return (
            <div key={item.id} className={`event event-${item.type}`}>
              <span className="event-icon">{getIcon(item)}</span>

              <div className="event-text">
                {item.type === "comment" && <p>{item.text}</p>}

                {item.type === "image" && (
                  <>
                    {item.text && <p>{item.text}</p>}
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="event-image-img" />
                    )}
                  </>
                )}

                {item.type === "goal" && (
                  <p>
                    ⚽ {getPlayerName(item.team, item.player)}
                    {item.assist && ` (assist: ${getPlayerName(item.team, item.assist)})`}
                    {" – "}{getTeamName(item.team)}
                    {" "}{item.homeScore}–{item.awayScore}
                  </p>
                )}

                {(item.type === "yellow" || item.type === "red") && (
                  <p>{getPlayerName(item.team, item.player)} – {getTeamName(item.team)}</p>
                )}

                {item.type === "sub" && (
                  <p>
                    Inn: {getPlayerName(item.team, item.in)} /
                    Ut: {getPlayerName(item.team, item.out)}
                    {item.comment && ` – ${item.comment}`}
                  </p>
                )}

                {item.type === "whistle" && (
                  <p>
                    {getTeamName(item.team)}
                    {item.player && ` – ${getPlayerName(item.team, item.player)}`}
                    {item.comment && ` – ${item.comment}`}
                  </p>
                )}

                {(item.type === "corner" || item.type === "injury") && (
                  <p>
                    {getTeamName(item.team)}
                    {item.text && ` – ${item.text}`}
                  </p>
                )}

                {item.type === "addedTime" && (
                  <p>+{item.minutes} min{item.text && ` – ${item.text}`}</p>
                )}

                {item.type === "system" && <p>{item.text}</p>}
              </div>

              {minute && <span className="event-minute">{minute}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}