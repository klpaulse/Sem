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

import { loadOrCreateMatchData } from "../components/admincomp/useMatchData";

export default function MatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [allMatches, setAllMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("rapport");

  const [homeName, setHomeName] = useState("Hjemmelag");
  const [awayName, setAwayName] = useState("Bortelag");

  const [hasFormation, setHasFormation] = useState(false);

  // ⭐ Hent eller opprett kampdata
  useEffect(() => {
    if (!id) return;

    async function load() {
      const data = await loadOrCreateMatchData(id);
      setSelectedMatch({ id, ...data });
    }

    load();
  }, [id]);

  // ⭐ Hent ALLE kamper
  useEffect(() => {
    const fetchAll = async () => {
      const ref = collection(db, "matches");
      const snap = await getDocs(ref);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllMatches(list);
    };

    fetchAll();
  }, []);

  // ⭐ Hent events live
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

  // ⭐ Hent lagnavn
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

  // ⭐ Sjekk om formasjon finnes
  useEffect(() => {
    if (!selectedMatch?.id) return;
    const ref = doc(db, "matches", selectedMatch.id, "formations", "home");
    const unsub = onSnapshot(ref, (snap) => {
      setHasFormation(snap.exists());
    });
    return () => unsub();
  }, [selectedMatch]);

  // ⭐ Kampstatus
  if (!selectedMatch) return <p>Laster kamp...</p>;

  const now = new Date();

  const matchDate = selectedMatch.date?.toDate
    ? selectedMatch.date.toDate()
    : new Date(selectedMatch.date);

  const matchTimePassed = now > matchDate;

  const isFinished =
    selectedMatch.status === "finished" || matchTimePassed;

  // ⭐ FØR KAMP
  if (selectedMatch.status === "not_started" && !matchTimePassed) {
    return (
      <BeforeMatch
        match={selectedMatch}
        allMatches={allMatches}
        hasFormation={hasFormation}
      />
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
            : isFinished
            ? "slutt"
            : "Kamp"}
        </p>

        <div className="lp-row">
          <span className="lp-title">{homeName}</span>

          {/* ⭐ RIKTIG RESULTATLOGIKK */}
          <p className="lp-result">
            {selectedMatch.status === "live"
              ? `${selectedMatch.homeScore ?? 0} - ${selectedMatch.awayScore ?? 0}` // LIVE-STILLING
              : isFinished
                ? (
                    selectedMatch.homeScore !== null &&
                    selectedMatch.awayScore !== null
                      ? `${selectedMatch.homeScore} - ${selectedMatch.awayScore}` // SLUTT MED RESULTAT
                      : "Stilling kommer" // SLUTT UTEN RESULTAT
                  )
                : selectedMatch.status === "not_started"
                  ? `Kl ${selectedMatch.time}` // FØR KAMP
                  : "Stilling kommer" // fallback
            }
          </p>

          <span className="lp-title">{awayName}</span>
        </div>

        <p className="lp-date">
          {selectedMatch.date?.toDate?.().toLocaleDateString("no-NO")}
        </p>
      </div>

      {/* ⭐ COUNTDOWN KUN FØR KAMPEN ER FERDIG */}
      {!isFinished && selectedMatch.status !== "live" && (
        <Countdown match={selectedMatch} />
      )}

      {/* ⭐ Rapport */}
      <main className="page">
        <Tabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasFormation={hasFormation}
        />

        <section className="content-box">
          {activeTab === "rapport" && (
            events.length > 0 ? (
              <MatchReport match={selectedMatch} events={events} />
            ) : (
              <p className="no-live">Det har ikke vært noe live i denne kampen.</p>
            )
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
