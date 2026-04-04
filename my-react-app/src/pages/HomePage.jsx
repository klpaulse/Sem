import { useEffect, useState } from "react";
import { db } from "../config/Firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import Calandar from "../components/homecomp/Calandar";
import DivisionList from "../components/homecomp/DivisionList";
import "../assets/style/homePage.css";

export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  // Hent ALLE kamper fra Firestore
  useEffect(() => {
    const fetchMatches = async () => {
      const matchesRef = collection(db, "matches");
      const matchesSnap = await getDocs(matchesRef);

      const matchesData = matchesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sorter kampene etter dato
      matchesData.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return a.date.toDate() - b.date.toDate();
      });

      setMatches(matchesData);
    };

    fetchMatches();
  }, []);

  // Filtrer dagens kamper
  const todaysMatches = matches.filter(m => {
    if (!m.date) return false;
    const matchDate = m.date.toDate().toDateString();
    const selected = selectedDate.toDateString();
    return matchDate === selected;
  });

  // Gruppér kamper etter divisjon (GENERELT)
  const matchesByDivision = matches.reduce((acc, match) => {
    const division = match.division || "Ukjent divisjon";

    if (!acc[division]) acc[division] = [];
    acc[division].push(match);

    return acc;
  }, {});

  return (
    <section className="home-page">
    
      <h1>Breddefotball live</h1>

      {/* Kalender */}
      <Calandar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />


      {/* Divisjonsliste (GENERELL) */}
      <DivisionList
        matchesByDivision={matchesByDivision}
        navigate={navigate}
        selectedDate={selectedDate}
      />
    </section>
  );
}