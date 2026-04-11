import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFutbol,
  faSquare,
  faUserInjured,
  faComment,
  faFlag,
  faBell,
  faRightLeft,
} from "@fortawesome/free-solid-svg-icons";

export default function MatchReport({ match, events }) {
  if (!match) return null;

  // Finn målscorere
  const goalEvents = events
    ?.filter((e) => e.type === "goal")
    .sort((a, b) => a.minute - b.minute) || [];

  // Sjekk om vi er i 2. omgang
  const isSecondHalf = events.some(
    (e) => e.type === "system" && (e.text || "").toLowerCase().includes("2. omgang")
  );

  const formatMinute = (minute) => {
    if (!isSecondHalf) {
      if (minute <= 45) return minute;
      return `45+${minute - 45}`;
    }
    if (minute <= 90) return minute;
    return `90+${minute - 90}`;
  };

  const getIcon = (type) => {
    switch (type) {
      case "goal":
        return <FontAwesomeIcon icon={faFutbol} />;
      case "yellow":
        return <FontAwesomeIcon icon={faSquare} style={{ color: "#f4d03f" }} />;
      case "red":
        return <FontAwesomeIcon icon={faSquare} style={{ color: "#e74c3c" }} />;
      case "injury":
        return <FontAwesomeIcon icon={faUserInjured} />;
      case "comment":
        return <FontAwesomeIcon icon={faComment} />;
      case "corner":
        return <FontAwesomeIcon icon={faFlag} />;
      case "whistle":
        return <FontAwesomeIcon icon={faBell} />;
      case "sub":
        return <FontAwesomeIcon icon={faRightLeft} />;
      default:
        return null;
    }
  };

  // ⭐ INGEN HENDELSER → vis ferdig‑melding
  if (!events || events.length === 0) {
    return (
      <div className="report-container">
        <div className="report-feed">
          <h3>Kampen er ferdig</h3>
          <p>Det ble ikke ført live‑rapport for denne kampen.</p>
        </div>
      </div>
    );
  }

  // ⭐ HOVEDVISNING (live eller ferdig kamp med hendelser)
  return (
    <div className="report-container">
      <div className="report-feed">
        <h3>{match.status === "finished" ? "Kampreferat" : "Live oppdatering"}</h3>

        {events.map((e) => {
          if (e.type === "system") {
            return (
              <div key={e.id} className="event event-system">
                {e.text}
              </div>
            );
          }

          if (e.type === "sub") {
            return (
              <div key={e.id} className="event event-sub">
                <span className="event-icon">{getIcon("sub")}</span>

                <div className="event-text">
                  <p className="sub-title">Spillerbytte – {e.team}</p>
                  <p className="sub-in">Inn: {e.in}</p>
                  <p className="sub-out">Ut: {e.out}</p>
                  {e.comment && <p className="sub-comment">{e.comment}</p>}
                </div>

                <span className="event-minute">{formatMinute(e.minute)}'</span>
              </div>
            );
          }

          return (
            <div key={e.id} className={`event event-${e.type}`}>
              <span className="event-icon">{getIcon(e.type)}</span>

              <div className="event-text">
                <p>{e.text}</p>
              </div>

              <span className="event-minute">{formatMinute(e.minute)}'</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
