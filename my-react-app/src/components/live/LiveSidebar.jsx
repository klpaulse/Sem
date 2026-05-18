import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../config/Firebase";
import { doc, onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import { useLiveSidebar } from "../../context/LiveSidebarContext";
import "../../assets/style/liveSidebar.css";

const EVENT_ICONS = {
  goal: "⚽",
  yellow_card: "🟨",
  red_card: "🟥",
  substitution: "🔄",
  comment: "💬",
  image: "📷",
  var: "📺",
};

function resolveEventText(event, pinned) {
  if (event.type === "goal" && event.player && pinned) {
    const isHome = event.team === pinned.homeTeamId;
    const team = isHome ? pinned.homeTeam : pinned.awayTeam;
    const players = Array.isArray(team?.players)
      ? team.players
      : Object.values(team?.players || {});
    const player = players.find((p) => p.id === event.player);
    return player?.name || (isHome ? pinned.homeName : pinned.awayName);
  }
  return event.text || event.type;
}

export default function LiveSidebar() {
  const { pinned, unpin } = useLiveSidebar();
  const navigate = useNavigate();
  const { slug } = useParams();

  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!pinned?.id) return;

    const matchUnsub = onSnapshot(doc(db, "matches", pinned.id), (snap) => {
      if (snap.exists()) setMatch({ id: snap.id, ...snap.data() });
    });

    const eventsUnsub = onSnapshot(
      query(
        collection(db, "matches", pinned.id, "events"),
        orderBy("createdAt", "desc"),
        limit(8)
      ),
      (snap) => setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      matchUnsub();
      eventsUnsub();
    };
  }, [pinned?.id]);

  if (!pinned) return null;

  const isOnSamePage = slug === pinned.slug || slug === pinned.id;
  if (isOnSamePage) return null;

  const status = match?.status || "live";
  const statusLabel =
    status === "live" ? "Live"
    : status === "pause" ? "Pause"
    : status === "finished" ? "Slutt"
    : "Live";

  const homeScore = match?.homeScore ?? 0;
  const awayScore = match?.awayScore ?? 0;

  return (
    <aside className="live-sidebar">
      <div className="live-sidebar-header">
        <span className={`live-sidebar-badge live-sidebar-badge--${status}`}>
          {status === "live" && <span className="live-sidebar-dot" />}
          {statusLabel}
        </span>
        <button className="live-sidebar-close" onClick={unpin} aria-label="Lukk">✕</button>
      </div>

      <button
        className="live-sidebar-score"
        onClick={() => navigate(`/match/${pinned.slug || pinned.id}`)}
      >
        <span className="live-sidebar-team">{pinned.homeName}</span>
        <span className="live-sidebar-result">{homeScore} – {awayScore}</span>
        <span className="live-sidebar-team">{pinned.awayName}</span>
      </button>

      <div className="live-sidebar-events">
        {events.length === 0 ? (
          <p className="live-sidebar-empty">Ingen hendelser ennå.</p>
        ) : (
          events.map((e) => (
            <div key={e.id} className="live-sidebar-event">
              <span className="live-sidebar-event-icon">
                {EVENT_ICONS[e.type] || "•"}
              </span>
              <span className="live-sidebar-event-text">{resolveEventText(e, pinned)}</span>
              {e.minute && (
                <span className="live-sidebar-event-min">{e.minute}'</span>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
