import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../config/Firebase";
import { useLocation, useNavigate } from "react-router-dom";
import "../../assets/style/goalNotifier.css";

function playPling() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    [1046, 1318].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, now + i * 0.13);
      g.gain.linearRampToValueAtTime(0.22, now + i * 0.13 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.13 + 0.7);
      o.start(now + i * 0.13);
      o.stop(now + i * 0.13 + 0.7);
    });
  } catch (_) {}
}

export default function GoalNotifier({ matches, teamsMap }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [toasts, setToasts] = useState([]);

  const seenIds = useRef(new Set());
  const readyMatches = useRef(new Set());
  const locationRef = useRef(location.pathname);
  const teamsMapRef = useRef(teamsMap);

  useEffect(() => { locationRef.current = location.pathname; }, [location.pathname]);
  useEffect(() => { teamsMapRef.current = teamsMap; }, [teamsMap]);

  const liveMatches = matches.filter(m => m.status === "live");
  const liveMatchIds = liveMatches.map(m => m.id).join(",");

  useEffect(() => {
    if (!liveMatches.length) return;

    const unsubs = liveMatches.map(match => {
      const q = query(
        collection(db, "matches", match.id, "events"),
        orderBy("createdAt", "asc")
      );

      return onSnapshot(q, snap => {
        const isReady = readyMatches.current.has(match.id);

        snap.docs.forEach(d => {
          const eventId = d.id;
          const data = d.data();

          if (seenIds.current.has(eventId)) return;
          seenIds.current.add(eventId);

          if (isReady && data.type === "goal") {
            const path = locationRef.current;
            const isCurrentMatch =
              path === `/match/${match.id}` ||
              path === `/match/${match.slug}`;
            if (isCurrentMatch) return;

            const map = teamsMapRef.current;
            const homeName = map[match.homeTeamId] || "Hjemmelag";
            const awayName = map[match.awayTeamId] || "Bortelag";
            const scoringTeam = data.goalData?.team === match.homeTeamId
              ? homeName
              : awayName;

            const toast = {
              id: eventId,
              homeName,
              awayName,
              scoringTeam,
              matchSlug: match.slug || match.id,
            };

            playPling();
            setToasts(prev => [...prev, toast]);
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== eventId));
            }, 7000);
          }
        });

        readyMatches.current.add(match.id);
      });
    });

    return () => unsubs.forEach(u => u());
  }, [liveMatchIds]);

  if (!toasts.length) return null;

  return (
    <div className="goal-notif-stack">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="goal-notif"
          onClick={() => navigate(`/match/${toast.matchSlug}`)}
        >
          <span className="goal-notif__ball">⚽</span>
          <div className="goal-notif__body">
            <strong className="goal-notif__title">MÅL! {toast.scoringTeam} scorer</strong>
            <span className="goal-notif__match">{toast.homeName} – {toast.awayName}</span>
          </div>
          <button
            className="goal-notif__close"
            onClick={e => { e.stopPropagation(); setToasts(prev => prev.filter(t => t.id !== toast.id)); }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
