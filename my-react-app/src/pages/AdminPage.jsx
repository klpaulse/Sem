import { useEffect, useState } from "react";
import { db } from "../config/Firebase";
import { collection, getDocs } from "firebase/firestore";

import LagAdministrasjon from "../components/admincomp/LagAdministrasjon";
import KampAdministrasjon from "../components/admincomp/KampAdministrasjon";

import "../assets/style/adminPage.css";

export default function AdminPage() {
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    const fetchDivisions = async () => {
      const teamsRef = collection(db, "teams");
      const snapshot = await getDocs(teamsRef);

      const allTeams = snapshot.docs.map((doc) => doc.data());
      const uniqueDivs = [...new Set(allTeams.map((t) => t.division))];

      setDivisions(uniqueDivs);
    };

    fetchDivisions();
  }, []);

  return (
    <main className="adminpage-container">
      <h1 className="adminpage-title">Administrator</h1>

      {/* LAGADMIN */}
      <LagAdministrasjon divisions={divisions} />

      {/* KAMPADMIN */}
      <KampAdministrasjon divisions={divisions} />
    </main>
  );
}
