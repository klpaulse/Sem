import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, getDocs, doc } from "firebase/firestore";
import { db } from "../config/Firebase";

import { useParams, useNavigate } from "react-router-dom";

import Countdown from "../components/Countdown";
import BeforeMatch from "../components/maincomp/BeforeMatch";
import MatchReport from "../components/MatchReport";
import Tabs from "../components/Tabs";

import { getTeam } from "../services/TeamService";

import "../assets/style/matchPage.css";
import LagComponent from "../components/maincomp/LagComponent";

export default function MatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [allMatches, setAllMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("rapport");

  const [homeName, setHomeName] = useState("Hjemmelag");
  const [awayName, setAwayName] = useState("Bortelag");

  const [hasFormation, setHasFormation] = useState(false)

  useEffect(() => {
    if (!selectedMatch?.id) return 
    const ref = doc(db, "matches", selectedMatch.id, "formations", "home")
    const unsub = onSnapshot(ref, (snap) => {
      setHasFormation(snap.exists())
    })
    return () => unsub()
  }, [selectedMatch])

  // 🔥 Hent ALLE kamper (ikke live)
  useEffect(() => {
    const fetchAll = async () => {
      const ref = collection(db, "matches");
      const snap = await getDocs(ref);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllMatches(list);
    };

    fetchAll();
  }, []);

  // ⭐ Hent DENNE kampen live
  useEffect(() => {
    if (!id) return;

    const ref = doc(db, "matches", id);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSelectedMatch({ id: snap.id, ...snap.data() });
      }
    });

    return () => unsub();
  }, [id]);

  // ⭐ Hent lagnavn basert på ID
  useEffect(() => {
    async function loadNames() {
      if (!selectedMatch) return;

      if (selectedMatch.homeTeamId) {
        const home = await getTeam(selectedMatch.homeTeamId);
        setHomeName(home?.name || "Ukjent lag");
      }

      if (selectedMatch.awayTeamId) {
        const away = await getTeam(selectedMatch.awayTeamId);
        setAwayName(away?.name || "Ukjent lag");
      }
    }

    loadNames();
  }, [selectedMatch]);

  // 🔥 Hent events live
  useEffect(() => {
    if (!selectedMatch) return;

    const q = query(
      collection(db, "matches", selectedMatch.id, "events"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(list);
    });

    return () => unsub();
  }, [selectedMatch]);

  // 🔥 Kampstatus
  if (!selectedMatch) {
    return <p>Laster kamp...</p>;
  }

  // ⭐ FØR KAMP
  if (selectedMatch.status === "not_started") {
    return (
      <BeforeMatch match={selectedMatch} allMatches={allMatches} />
    );
  }

  // ⭐ UNDER / ETTER KAMP
  return (
    <>
      <header className="header">
        <h1
          className="live-header"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          Breddefotball live
        </h1>
      </header>

      {/* Kampkort */}
      <div className="last-played-card">
        <p className="lp-status">
          {selectedMatch.status === "finished"
            ? "Slutt"
            : selectedMatch.status === "live"
            ? "Live"
            : "Kamp"}
        </p>

        <div className="lp-row">
          <span className="lp-title">{homeName}</span>

          <p className="lp-result">
            {selectedMatch.status === "not_started"
              ? `Kl ${selectedMatch.time}`
              : `${selectedMatch.homeScore ?? 0} - ${selectedMatch.awayScore ?? 0}`}
          </p>

          <span className="lp-title">{awayName}</span>
        </div>

        <p className="lp-date">
          {selectedMatch.date.toDate().toLocaleDateString("no-NO")}
        </p>
      </div>

      {/* Rapport */}
      <main className="page">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} hasFormation={hasFormation} />

        <section className="content-box">
          {activeTab === "rapport" && (
            <MatchReport match={selectedMatch} events={events} />
          )}

          {activeTab === "tabell" && (
            <TabellComponent match={selectedMatch} />
          )}

          {activeTab === "lag" && (
            <LagComponent match={selectedMatch} />
          )}
        </section>
      </main>
    </>
  );
}



