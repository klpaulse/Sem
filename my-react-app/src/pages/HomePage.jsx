import { useEffect, useState } from "react";
import { db } from "../config/Firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import Calandar from "../components/homecomp/Calandar";
import DivisionList from "../components/homecomp/DivisionList";
import "../assets/style/homePage.css";

export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  // LIVE-OPPDATERING AV KAMPER
  useEffect(() => {
    const matchesRef = collection(db, "matches");

    const unsubscribe = onSnapshot(matchesRef, (snapshot) => {
      const matchesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sorter kampene etter dato
      matchesData.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return a.date.toDate() - b.date.toDate();
      });

      setMatches(matchesData);
    });

    return () => unsubscribe();
  }, []);

  // Filtrer dagens kamper
  const todaysMatches = matches.filter((m) => {
    if (!m.date) return false;
    const matchDate = m.date.toDate().toDateString();
    const selected = selectedDate.toDateString();
    return matchDate === selected;
  });

  // Gruppér kamper etter divisjon
  const matchesByDivision = todaysMatches.reduce((acc, match) => {
    const division = match.division || "Ukjent divisjon";

    if (!acc[division]) acc[division] = [];
    acc[division].push(match);

    return acc;
  }, {});

  return (
    <main className="page">
      <h1 className="live-header">
  Breddefotball Live
</h1>

      <section className="calandar-section">
        <Calandar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </section>

      <section className="division-section">
        <DivisionList
          matchesByDivision={matchesByDivision}
          navigate={navigate}
          selectedDate={selectedDate}
        />
      </section>
    </main>
  );
}