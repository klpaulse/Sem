import { useEffect, useState } from "react";
import { db, auth } from "../config/Firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

import LagAdministrasjon from "../components/admincomp/LagAdministrasjon";
import KampAdministrasjon from "../components/admincomp/KampAdministrasjon";
import AdminMatches from "../components/admincomp/AdminMatches";   // ⬅️ NY

import "../assets/style/adminPage.css";

export default function AdminPage() {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔐 Admin-sjekk
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const ref = doc(db, "admins", user.uid);
      const snap = await getDoc(ref);

      setIsAdmin(snap.exists());
    };

    checkAdmin();
  }, [user]);

  // LIVE: hent divisjoner basert på lag
  useEffect(() => {
    const teamsRef = collection(db, "teams");

    const unsubscribe = onSnapshot(teamsRef, (snapshot) => {
      const allTeams = snapshot.docs.map((doc) => doc.data());
      const uniqueDivs = [...new Set(allTeams.map((t) => t.division))];

      uniqueDivs.sort();
      setDivisions(uniqueDivs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔐 Admin-beskyttelse
  if (isAdmin === null) return <p>Sjekker tilgang...</p>;
  if (!user) return <p>Du må logge inn for å få tilgang</p>;
  if (!isAdmin) return <p>Du har ikke administratorrettigheter</p>;

  return (
    <main className="adminpage-container">
      <h1 className="adminpage-title">Administrator</h1>

      {loading ? (
        <p>Laster divisjoner...</p>
      ) : (
        <>
          <section className="admin-section">
            <h2 className="admin-section-title">Lagadministrasjon</h2>
            <LagAdministrasjon divisions={divisions} />
          </section>

          <section className="admin-section">
            <h2 className="admin-section-title">Kampadministrasjon</h2>
            <KampAdministrasjon divisions={divisions} />
          </section>

          {/* ⬅️ NY — kampresultat-administrasjon */}
          <section className="admin-section">
            <h2 className="admin-section-title">Resultatadministrasjon</h2>
            <AdminMatches />   {/* ⬅️ NY */}
          </section>
        </>
      )}
    </main>
  );
}
