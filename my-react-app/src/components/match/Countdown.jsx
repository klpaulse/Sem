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
    <p className="countdown-strip">
      Kampstart om{" "}
      {days > 0 && <><strong>{String(days).padStart(2, "0")}</strong><em>d</em>{" "}</>}
      <strong>{String(hours).padStart(2, "0")}</strong><em>t</em>{" "}
      <strong>{String(minutes).padStart(2, "0")}</strong><em>m</em>{" "}
      <strong>{String(seconds).padStart(2, "0")}</strong><em>s</em>
    </p>
  );
}
