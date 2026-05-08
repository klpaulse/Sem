import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFutbol,
  faSquare,
  faUserInjured,
  faComment,
  faFlag,
  faBullhorn,
  faArrowUp,
  faArrowDown,
  faQuestion,
  faArrowsRotate,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/Firebase";
import { getTeam } from "../services/TeamService";
import AudienceQuestions from "./maincomp/AudienceQuestions";
import PollDisplay from "./maincomp/PollDisplay";

export default function MatchReport({ match, events, matchId }) {
  if (!match) return null;

  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);
  const [polls, setPolls] = useState([]);

  const id = matchId || match.id;
  const isPreMatch = match.status === "not_started";

  useEffect(() => {
    async function loadTeams() {
      const home = await getTeam(match.homeTeamId);
      const away = await getTeam(match.awayTeamId);
      setHomeTeam(home);
      setAwayTeam(away);
    }
    loadTeams();
  }, [match]);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(collection(db, "matches", id, "polls"), (snap) => {
      setPolls(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [id]);

  if (!homeTeam || !awayTeam) return <div>Laster kampdata...</div>;

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
    (e) => e.type === "system" && (e.text || "").toLowerCase().includes("2. omgang")
  );

  const formatMinute = (minute) => {
    if (minute == null) return "";
    if (!isSecondHalf) {
      if (minute <= 45) return minute;
      return `45+${minute - 45}`;
    }
    if (minute <= 90) return minute;
    return `90+${minute - 90}`;
  };

  /* -----------------------------
      BYGG KOMBINERT FEED
  ------------------------------ */
  const stickyPolls = polls.filter((p) => p.preMatch === true && p.active);
  const livePolls = polls.filter((p) => !p.preMatch && p.active);

  const sortedEvents = [...events].sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return a.createdAt.seconds - b.createdAt.seconds;
  });

  const combinedFeed = isPreMatch
    ? sortedEvents
    : [
        ...sortedEvents,
        ...livePolls.map((p) => ({ ...p, _isPoll: true })),
      ].sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));

  /* -----------------------------
      RENDER EVENT
  ------------------------------ */
  function renderEvent(e) {
    const showMinute = !e.preMatch && e.minute != null;

    if (e.type === "system") {
      return (
        <div key={e.id} className="event event-system">
          {e.text}
        </div>
      );
    }

    if (e.type === "questionAnswer") {
      return (
        <div key={e.id} className="event event-question">
          <span className="event-icon"><FontAwesomeIcon icon={faQuestion} /></span>
          <div className="event-text">
            <div className="question-block">
              <p className="question-line">{e.name} spør:</p>
              <p>{e.question}</p>
            </div>
            <div className="answer-block">
              <p className="answer-line">Admin svarer:</p>
              <p>{e.answer}</p>
            </div>
          </div>
        </div>
      );
    }

    if (e.type === "goal") {
      return (
        <div key={e.id} className="event event-goal">
          <span className="event-icon"><FontAwesomeIcon icon={faFutbol} /></span>
          <div className="event-text">
            <p className="goal-title">{getTeamName(e.team)} SCORER!</p>
            <p className="goal-score">{e.homeScore ?? 0}-{e.awayScore ?? 0}</p>
            <p className="goal-detail">Mål: {getPlayerName(e.team, e.player)}</p>
            {e.assist && <p className="goal-detail">Målgivende: {getPlayerName(e.team, e.assist)}</p>}
            {e.text && <p className="goal-comment">{e.text}</p>}
          </div>
          {showMinute && <span className="event-minute">{formatMinute(e.minute)}'</span>}
        </div>
      );
    }

    if (e.type === "sub") {
      return (
        <div key={e.id} className="event event-sub">
          <span className="event-icon"><FontAwesomeIcon icon={faArrowsRotate} /></span>
          <div className="event-text">
            <p className="sub-title">Spillerbytte – {getTeamName(e.team)}</p>
            <p className="sub-in"><FontAwesomeIcon icon={faArrowUp} /> Inn: {getPlayerName(e.team, e.in)}</p>
            <p className="sub-out"><FontAwesomeIcon icon={faArrowDown} /> Ut: {getPlayerName(e.team, e.out)}</p>
            {e.comment && <p className="sub-comment">{e.comment}</p>}
          </div>
          {showMinute && <span className="event-minute">{formatMinute(e.minute)}'</span>}
        </div>
      );
    }

    if (e.type === "yellow") {
      return (
        <div key={e.id} className="event event-yellow">
          <span className="event-icon"><FontAwesomeIcon icon={faSquare} className="yellow-card" /></span>
          <div className="event-text">
            <p>Gult kort – {getTeamName(e.team)}</p>
            <p>{getPlayerName(e.team, e.player)}</p>
            {e.text && <p>{e.text}</p>}
          </div>
          {showMinute && <span className="event-minute">{formatMinute(e.minute)}'</span>}
        </div>
      );
    }

    if (e.type === "red") {
      return (
        <div key={e.id} className="event event-red">
          <span className="event-icon"><FontAwesomeIcon icon={faSquare} className="red-card" /></span>
          <div className="event-text">
            <p>Rødt kort – {getTeamName(e.team)}</p>
            <p>{getPlayerName(e.team, e.player)}</p>
            {e.text && <p>{e.text}</p>}
          </div>
          {showMinute && <span className="event-minute">{formatMinute(e.minute)}'</span>}
        </div>
      );
    }

    if (e.type === "injury") {
      return (
        <div key={e.id} className="event event-injury">
          <span className="event-icon"><FontAwesomeIcon icon={faUserInjured} /></span>
          <div className="event-text">
            <p>Skade – {getTeamName(e.team)}</p>
            {e.text && <p>{e.text}</p>}
          </div>
          {showMinute && <span className="event-minute">{formatMinute(e.minute)}'</span>}
        </div>
      );
    }

    if (e.type === "corner") {
      return (
        <div key={e.id} className="event event-corner">
          <span className="event-icon"><FontAwesomeIcon icon={faFlag} /></span>
          <div className="event-text">
            <p>Hjørnespark – {getTeamName(e.team)}</p>
            {e.player && <p>{getPlayerName(e.team, e.player)} tar corneren</p>}
            {e.text && <p>{e.text}</p>}
          </div>
          {showMinute && <span className="event-minute">{formatMinute(e.minute)}'</span>}
        </div>
      );
    }

    if (e.type === "whistle") {
      return (
        <div key={e.id} className="event event-whistle">
          <span className="event-icon"><FontAwesomeIcon icon={faBullhorn} /></span>
          <div className="event-text">
            <p>Frispark – {getTeamName(e.team)}</p>
            {e.player && <p>{getPlayerName(e.team, e.player)}</p>}
            {e.comment && <p>{e.comment}</p>}
          </div>
          {showMinute && <span className="event-minute">{formatMinute(e.minute)}'</span>}
        </div>
      );
    }

    if (e.type === "image") {
      return (
        <div key={e.id} className="event event-image">
          <span className="event-icon"><FontAwesomeIcon icon={faImage} /></span>
          <div className="event-text">
            {e.text && <p>{e.text}</p>}
            {e.imageUrl && <img src={e.imageUrl} alt="Hendelsesbilde" className="event-image-img" />}
          </div>
          {showMinute && <span className="event-minute">{formatMinute(e.minute)}'</span>}
        </div>
      );
    }

    if (e.type === "comment") {
      return (
        <div key={e.id} className="event event-comment">
          <span className="event-icon"><FontAwesomeIcon icon={faComment} /></span>
          <div className="event-text"><p>{e.text}</p></div>
          {showMinute && <span className="event-minute">{formatMinute(e.minute)}'</span>}
        </div>
      );
    }

    return null;
  }

  return (
    <div className="report-container">
      <div className="report-feed">

        <header className="report-title-row">
          <AudienceQuestions matchId={match.id} />
        </header>

        {/* ⭐ STICKY POLLS FØR KAMP */}
        {isPreMatch && stickyPolls.map((p) => (
          <PollDisplay key={p.id} matchId={id} sticky={true} singlePollId={p.id} />
        ))}

        {/* ⭐ KOMBINERT FEED */}
 {combinedFeed.map((item) =>
  item._isPoll
    ? (
        <PollDisplay
          key={item.id}
          matchId={id}
          singlePollId={item.id}
        />
      )
    : renderEvent(item)
)}


      </div>
    </div>
  );
}