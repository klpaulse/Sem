import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../config/Firebase";
import { getTeam } from "../../services/TeamService";

export default function EventList({ match }) {
  const [events, setEvents] = useState([]);
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);

  // Hent lagene basert på homeTeamId og awayTeamId
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

  // Hent events live
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

  // ⭐ Robust spilleroppslag (fungerer for både array og map)
  function getPlayerName(teamId, playerId) {
    const team = teamId === match.homeTeamId ? homeTeam : awayTeam;

    // Spillere kan være array eller map → gjør det alltid til array
    const players = Array.isArray(team?.players)
      ? team.players
      : Object.values(team?.players || {});

    return players.find((p) => p.id === playerId)?.name || playerId;
  }

  // Slå opp lagnavn
  function getTeamName(teamId) {
    if (teamId === match.homeTeamId) return homeTeam?.name;
    if (teamId === match.awayTeamId) return awayTeam?.name;
    return "Ukjent lag";
  }

  if (!homeTeam || !awayTeam) {
    return <div>Laster hendelser...</div>;
  }

console.log("HOME TEAM:", homeTeam);
console.log("AWAY TEAM:", awayTeam);
  return (
    <section>
      <h3>Hendelser</h3>

      {events.map((ev) => (
        <div
          key={ev.id}
          style={{
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #444",
            borderRadius: "6px",
            background: "#1c1c1c"
          }}
        >
          {/* TYPE + MINUTT */}
          <strong>
            {ev.type === "goal" && "⚽ Mål"}
            {ev.type === "yellow" && "🟨 Gult kort"}
            {ev.type === "red" && "🟥 Rødt kort"}
            {ev.type === "injury" && "🤕 Skade"}
            {ev.type === "comment" && "💬 Kommentar"}
            {ev.type === "corner" && "🏳️ Corner"}
            {ev.type === "whistle" && "🎺 Fløyte"}
            {ev.type === "sub" && "🔄 Spillerbytte"}
            {ev.type === "system" && "⚙️ System"}
            {ev.type === "pause" && "⏸️ Pause"}
            {ev.type === "2omgang" && "▶️ 2. omgang"}
          </strong>

          <span style={{ marginLeft: "10px", opacity: 0.7 }}>
            {ev.minute}'
          </span>

          {/* LAG */}
          {ev.team && (
            <div style={{ marginTop: "4px", opacity: 0.8 }}>
              Lag: {getTeamName(ev.team)}
            </div>
          )}

          {/* SPILLERBYTTE */}
          {ev.type === "sub" && (
            <div style={{ marginTop: "6px" }}>
              Inn:{" "}
              <strong>
                {getPlayerName(ev.team, ev.in)}
              </strong>
              <br />
              Ut:{" "}
              <strong>
                {getPlayerName(ev.team, ev.out)}
              </strong>

              {ev.comment && (
                <div style={{ marginTop: "4px", opacity: 0.8 }}>
                  {ev.comment}
                </div>
              )}
            </div>
          )}

          {/* MÅL / ANDRE HENDELSER */}
          {ev.type !== "sub" && ev.text && (
            <div style={{ marginTop: "6px" }}>{ev.text}</div>
          )}
        </div>
      ))}
    </section>
  );
}