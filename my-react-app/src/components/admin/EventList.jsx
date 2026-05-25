import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/Firebase";
import { getTeam } from "../../services/TeamService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFutbol, faSquare, faUserInjured, faArrowsRotate,
  faComment, faFlag, faBullhorn, faImage,
  faArrowUp, faArrowDown, faQuestion,
} from "@fortawesome/free-solid-svg-icons";
import PollDisplay from "../match/PollDisplay";

export default function EventList({ match, isPreMatch = false }) {
  const [events, setEvents] = useState([]);
  const [polls, setPolls] = useState([]);
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

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
    const q = query(collection(db, "matches", match.id, "events"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      setEvents(isPreMatch ? list.filter((e) => e.preMatch === true) : list);
    });
    return () => unsub();
  }, [match, isPreMatch]);

  useEffect(() => {
    if (!match) return;
    const unsub = onSnapshot(collection(db, "matches", match.id, "polls"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPolls(list);
    });
    return () => unsub();
  }, [match]);

  const stickyPolls = useMemo(
    () => polls.filter((p) => p.preMatch !== false && p.active !== false),
    [polls]
  );

  const livePolls = useMemo(
    () => polls.filter((p) => p.preMatch === false && p.active !== false),
    [polls]
  );

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return a.createdAt.seconds - b.createdAt.seconds;
    }),
    [events]
  );

  const combinedFeed = useMemo(() => {
    if (isPreMatch) return sortedEvents;
    return [
      ...sortedEvents,
      ...livePolls.map((p) => ({ ...p, _isPoll: true })),
    ].sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
  }, [isPreMatch, sortedEvents, livePolls]);

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

  function formatMinute(minute) {
    if (minute == null) return "";
    if (!isSecondHalf) {
      if (minute <= 45) return minute;
      return `45+${minute - 45}`;
    }
    if (minute <= 90) return minute;
    return `90+${minute - 90}`;
  }

  function getPlayers(teamId) {
    const team = teamId === match.homeTeamId ? homeTeam : awayTeam;
    return Array.isArray(team?.players) ? team.players : Object.values(team?.players || {});
  }

  function startEdit(e) {
    setEditingId(e.id);
    setEditData({
      player: e.player || "",
      playerName: e.playerName || "",
      assist: e.assist || "",
      assistName: e.assistName || "",
      in: e.in || "",
      out: e.out || "",
      playerInName: e.playerInName || "",
      playerOutName: e.playerOutName || "",
      text: e.text || "",
      comment: e.comment || "",
      minutes: e.minutes || "",
    });
  }

  async function saveEdit(e) {
    const players = getPlayers(e.team);
    const updates = {};

    if (e.type === "goal") {
      const scorer = players.find(p => p.id === editData.player);
      const assister = editData.assist ? players.find(p => p.id === editData.assist) : null;
      updates.player = editData.player || null;
      updates.playerName = scorer?.name || null;
      updates.assist = editData.assist || null;
      updates.assistName = assister?.name || null;
      updates.text = editData.text;
    } else if (e.type === "yellow" || e.type === "red") {
      const p = players.find(pl => pl.id === editData.player);
      updates.player = editData.player || null;
      updates.playerName = p?.name || null;
      updates.text = editData.text;
    } else if (e.type === "sub") {
      const pIn = players.find(p => p.id === editData.in);
      const pOut = players.find(p => p.id === editData.out);
      updates.in = editData.in || null;
      updates.out = editData.out || null;
      updates.playerInName = pIn?.name || null;
      updates.playerOutName = pOut?.name || null;
      updates.comment = editData.comment;
    } else if (e.type === "whistle") {
      const p = players.find(pl => pl.id === editData.player);
      updates.player = editData.player || null;
      updates.playerName = p?.name || null;
      updates.comment = editData.comment;
    } else if (e.type === "addedTime") {
      updates.minutes = editData.minutes;
      updates.text = editData.text;
    } else {
      updates.text = editData.text;
    }

    await updateDoc(doc(db, "matches", match.id, "events", e.id), updates);
    setEditingId(null);
  }

  function EditBtn({ e }) {
    return (
      <button className="goal-edit-btn" onClick={() => startEdit(e)}>✏️ Rediger</button>
    );
  }

  function EditActions({ e }) {
    return (
      <div className="goal-edit-actions">
        <button onClick={() => saveEdit(e)}>Lagre</button>
        <button onClick={() => setEditingId(null)}>Avbryt</button>
      </div>
    );
  }

  function PlayerSelect({ field, label, teamId, allowEmpty = true }) {
    const players = getPlayers(teamId);
    return (
      <select value={editData[field] || ""} onChange={ev => setEditData(d => ({ ...d, [field]: ev.target.value }))}>
        {allowEmpty && <option value="">{label}</option>}
        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    );
  }

  function renderEvent(e) {
    const showMinute = !e.preMatch && e.minute != null;

    if (e.type === "system") {
      return (
        <div key={e.id} className="event event-system">{e.text}</div>
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

    const isEditing = editingId === e.id;

    if (e.type === "goal") {
      return (
        <div key={e.id} className="event event-goal">
          <span className="event-icon"><FontAwesomeIcon icon={faFutbol} /></span>
          <div className="event-text">
            <p className="goal-title">{getTeamName(e.team)} SCORER!</p>
            <p className="goal-score">{e.homeScore ?? 0}-{e.awayScore ?? 0}</p>
            {!isEditing ? (
              <>
                <p className="goal-detail">Mål: {e.playerName || "Ukjent"}</p>
                {e.assistName && <p className="goal-detail">Målgivende: {e.assistName}</p>}
                {e.text && <p className="goal-comment">{e.text}</p>}
                <EditBtn e={e} />
              </>
            ) : (
              <div className="goal-edit-form">
                <PlayerSelect field="player" label="Ukjent scorer" teamId={e.team} />
                <PlayerSelect field="assist" label="Ingen assist" teamId={e.team} />
                <textarea placeholder="Kommentar" value={editData.text} onChange={ev => setEditData(d => ({ ...d, text: ev.target.value }))} />
                <EditActions e={e} />
              </div>
            )}
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
            {!isEditing ? (
              <>
                <p className="sub-in"><FontAwesomeIcon icon={faArrowUp} /> Inn: {e.playerInName || getPlayerName(e.team, e.in)}</p>
                <p className="sub-out"><FontAwesomeIcon icon={faArrowDown} /> Ut: {e.playerOutName || getPlayerName(e.team, e.out)}</p>
                {e.comment && <p className="sub-comment">{e.comment}</p>}
                <EditBtn e={e} />
              </>
            ) : (
              <div className="goal-edit-form">
                <label>Inn:</label><PlayerSelect field="in" label="Velg spiller" teamId={e.team} />
                <label>Ut:</label><PlayerSelect field="out" label="Velg spiller" teamId={e.team} />
                <textarea placeholder="Kommentar" value={editData.comment} onChange={ev => setEditData(d => ({ ...d, comment: ev.target.value }))} />
                <EditActions e={e} />
              </div>
            )}
          </div>
          {showMinute && <span className="event-minute">{formatMinute(e.minute)}'</span>}
        </div>
      );
    }

    if (e.type === "yellow" || e.type === "red") {
      return (
        <div key={e.id} className={`event event-${e.type}`}>
          <span className="event-icon"><FontAwesomeIcon icon={faSquare} className={`${e.type}-card`} /></span>
          <div className="event-text">
            <p>{e.type === "yellow" ? "Gult" : "Rødt"} kort – {getTeamName(e.team)}</p>
            {!isEditing ? (
              <>
                <p>{e.playerName || getPlayerName(e.team, e.player)}</p>
                {e.text && <p>{e.text}</p>}
                <EditBtn e={e} />
              </>
            ) : (
              <div className="goal-edit-form">
                <PlayerSelect field="player" label="Velg spiller" teamId={e.team} />
                <textarea placeholder="Kommentar" value={editData.text} onChange={ev => setEditData(d => ({ ...d, text: ev.target.value }))} />
                <EditActions e={e} />
              </div>
            )}
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
            {!isEditing ? (
              <>
                {e.player && <p>{getPlayerName(e.team, e.player)}</p>}
                {e.comment && <p>{e.comment}</p>}
                <EditBtn e={e} />
              </>
            ) : (
              <div className="goal-edit-form">
                <PlayerSelect field="player" label="Ingen spiller" teamId={e.team} />
                <textarea placeholder="Kommentar" value={editData.comment} onChange={ev => setEditData(d => ({ ...d, comment: ev.target.value }))} />
                <EditActions e={e} />
              </div>
            )}
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
            {!isEditing ? (
              <>{e.text && <p>{e.text}</p>}<EditBtn e={e} /></>
            ) : (
              <div className="goal-edit-form">
                <textarea placeholder="Tekst" value={editData.text} onChange={ev => setEditData(d => ({ ...d, text: ev.target.value }))} />
                <EditActions e={e} />
              </div>
            )}
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
            {!isEditing ? (
              <>{e.text && <p>{e.text}</p>}<EditBtn e={e} /></>
            ) : (
              <div className="goal-edit-form">
                <textarea placeholder="Tekst" value={editData.text} onChange={ev => setEditData(d => ({ ...d, text: ev.target.value }))} />
                <EditActions e={e} />
              </div>
            )}
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
            {!isEditing ? (
              <>{e.text && <p>{e.text}</p>}{e.imageUrl && <img src={e.imageUrl} alt="Hendelsesbilde" className="event-image-img" />}<EditBtn e={e} /></>
            ) : (
              <div className="goal-edit-form">
                {e.imageUrl && <img src={e.imageUrl} alt="" className="event-image-img" />}
                <textarea placeholder="Bildetekst" value={editData.text} onChange={ev => setEditData(d => ({ ...d, text: ev.target.value }))} />
                <EditActions e={e} />
              </div>
            )}
          </div>
          {showMinute && <span className="event-minute">{formatMinute(e.minute)}'</span>}
        </div>
      );
    }

    if (e.type === "comment") {
      return (
        <div key={e.id} className="event event-comment">
          <span className="event-icon"><FontAwesomeIcon icon={faComment} /></span>
          <div className="event-text">
            {!isEditing ? (
              <><p>{e.text}</p><EditBtn e={e} /></>
            ) : (
              <div className="goal-edit-form">
                <textarea value={editData.text} onChange={ev => setEditData(d => ({ ...d, text: ev.target.value }))} />
                <EditActions e={e} />
              </div>
            )}
          </div>
          {showMinute && <span className="event-minute">{formatMinute(e.minute)}'</span>}
        </div>
      );
    }

    return null;
  }

  if (!homeTeam || !awayTeam) return <div>Laster hendelser...</div>;

  return (
    <div className="report-container">
      {/* Sticky polls øverst */}
      {stickyPolls.map((p) => (
        <PollDisplay key={p.id} matchId={match.id} singlePollId={p.id} isAdmin={true}/>
      ))}

      <div className="report-feed">
        {combinedFeed.map((item) =>
          item._isPoll
            ? <PollDisplay key={item.id} matchId={match.id} singlePollId={item.id} isAdmin={true} />
            : renderEvent(item)
        )}
      </div>
    </div>
  );
}