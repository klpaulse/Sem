import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../config/Firebase";

export default function SponsorBanner() {
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "sponsors"), where("active", "==", true));
    const unsub = onSnapshot(q, snap => {
      setSponsors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  if (!sponsors.length) return null;

  return (
    <div className="sponsor-section">
      <p className="sponsor-label">Samarbeidspartnere</p>
      <div className="sponsor-list">
        {sponsors.map(s => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="sponsor-card"
            title={s.name}
          >
            <span className="sponsor-card__name">{s.name}</span>
            {s.logoUrl && (
              <img src={s.logoUrl} alt={s.name} className="sponsor-card__logo" />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
