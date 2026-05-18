import { useEffect, useState } from "react";
import { normalizeDate } from "../../utils/normalizeDate";

export default function Countdown({ date }) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!date) return;
    const interval = setInterval(() => {
      const kampTid = normalizeDate(date);
      if (!kampTid) return;
      const remaining = Math.max(0, kampTid.getTime() - Date.now());
      setTimeRemaining(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [date]);

  const seconds = Math.floor((timeRemaining / 1000) % 60);
  const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);
  const hours   = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
  const days    = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));

  return (
    <div className="countdown">
      <span className="countdown-label">Kampstart om</span>
      <span className="countdown-inline">
        {days > 0 && <><span className="countdown-num">{String(days).padStart(2, "0")}</span><span className="countdown-unit-label">d</span>{" "}</>}
        <span className="countdown-num">{String(hours).padStart(2, "0")}</span><span className="countdown-unit-label">t</span>{" "}
        <span className="countdown-num">{String(minutes).padStart(2, "0")}</span><span className="countdown-unit-label">m</span>{" "}
        <span className="countdown-num">{String(seconds).padStart(2, "0")}</span><span className="countdown-unit-label">s</span>
      </span>
    </div>
  );
}
