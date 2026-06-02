import { useEffect, useState } from "react";
import { db, auth } from "../config/Firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

import LagAdministrasjon from "../components/admin/LagAdministrasjon";
import KampAdministrasjon from "../components/admin/KampAdministrasjon";
import LiveAdmin from "../components/admin/LiveAdmin";
import ResultatAdmin from "../components/admin/ResultatAdmin";
import AnnouncementAdmin from "../components/admin/AnnouncementAdmin";
import SponsorAdmin from "../components/admin/SponsorAdmin";
import CompetitionAdmin from "../components/admin/CompetitionAdmin";
import LiveControls from "../components/admin/livekontroll/LiveControls";

import { loadOrCreateMatchData } from "../components/admin/useMatchData";

import "../assets/style/adminPage.css";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("live");
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(null);

  const [inLiveMode, setInLiveMode] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return setIsAdmin(false);
      const ref = doc(db, "admins", user.uid);
      const snap = await getDoc(ref);
      setIsAdmin(snap.exists());
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    const teamsRef = collection(db, "teams");
    const unsub = onSnapshot(teamsRef, (snapshot) => {
      const allTeams = snapshot.docs.map((doc) => doc.data());
      const uniqueDivs = [...new Set(allTeams.map((t) => t.division))];
      uniqueDivs.sort();
      setDivisions(uniqueDivs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (isAdmin === null) return <p>Sjekker tilgang...</p>;
  if (!user) return <p>Du må logge inn for å få tilgang</p>;
  if (!isAdmin) return <p>Du har ikke administratorrettigheter</p>;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        {!inLiveMode && (
          <>
            <button className={activeTab === "live" ? "active" : ""} onClick={() => setActiveTab("live")}>Live</button>
            <button className={activeTab === "teams" ? "active" : ""} onClick={() => setActiveTab("teams")}>Lag</button>
            <button className={activeTab === "matches" ? "active" : ""} onClick={() => setActiveTab("matches")}>Kamper</button>
            <button className={activeTab === "results" ? "active" : ""} onClick={() => setActiveTab("results")}>Resultater</button>
            <button className={activeTab === "announcement" ? "active" : ""} onClick={() => setActiveTab("announcement")}>Kunngjøring</button>
            <button className={activeTab === "sponsors" ? "active" : ""} onClick={() => setActiveTab("sponsors")}>Sponsorer</button>
            <button className={activeTab === "competitions" ? "active" : ""} onClick={() => setActiveTab("competitions")}>Konkurranser</button>
          </>
        )}
      </aside>

      <main className="admin-main">

        {loading && <p>Laster..</p>}

        {!loading && (
          <>
            {inLiveMode && selectedMatch && (
              <LiveControls
                match={selectedMatch}
                onBack={() => {
                  setInLiveMode(false);
                  setSelectedMatch(null);
                }}
              />
            )}

            {!inLiveMode && (
              <>
                {activeTab === "live" && (
                  <LiveAdmin
                    onSelectMatch={async (match) => {
                      const fullData = await loadOrCreateMatchData(match.id);
                      setSelectedMatch({ id: match.id, ...match, ...fullData });
                      setInLiveMode(true);
                    }}
                  />
                )}
                {activeTab === "teams" && <LagAdministrasjon divisions={divisions} />}
                {activeTab === "matches" && <KampAdministrasjon divisions={divisions} />}
                {activeTab === "results" && <ResultatAdmin />}
                {activeTab === "announcement" && <AnnouncementAdmin />}
                {activeTab === "sponsors" && <SponsorAdmin />}
                {activeTab === "competitions" && <CompetitionAdmin />}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}