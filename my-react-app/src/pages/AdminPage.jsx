import { useEffect, useState } from "react";
import { db, auth } from "../config/Firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

import LagAdministrasjon from "../components/admincomp/LagAdministrasjon";
import KampAdministrasjon from "../components/admincomp/KampAdministrasjon";
import PlayerAdmin from "../components/admincomp/PlayerAdmin";
import LiveAdmin from "../components/admincomp/LiveAdmin";
import ResultatAdmin from "../components/admincomp/ResultatAdmin";


import "../assets/style/adminPage.css";



export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("live");
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(null);

  // Sjekk admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return setIsAdmin(false);

      const ref = doc(db, "admins", user.uid);
      const snap = await getDoc(ref);
      setIsAdmin(snap.exists());
    };

    checkAdmin();
  }, [user]);

  // Hent divisjoner
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
        <button onClick={() => setActiveTab("live")}>Live</button>
        <button onClick={() => setActiveTab("teams")}>Lag</button>
        <button onClick={() => setActiveTab("matches")}>Kamper</button>
        <button onClick={() => setActiveTab("players")}>Spillere</button>
        <button onClick={() => setActiveTab("results")}>Resultater</button>

      </aside>

      <main className="admin-main">
        {loading && <p>Laster..</p>}

        {!loading && (
          <>
            {activeTab === "live" && <LiveAdmin />}
            {activeTab === "teams" && <LagAdministrasjon divisions={divisions}/>}
            {activeTab === "matches" && <KampAdministrasjon divisions={divisions} />}
            {activeTab === "players" && <PlayerAdmin />}
            {activeTab === "results" && <ResultatAdmin />}

          </>
        )}
      </main>
      

    </div>
  );
}







