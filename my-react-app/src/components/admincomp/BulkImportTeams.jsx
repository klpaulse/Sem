import { useState } from "react";
import { db } from "../../config/Firebase";
import { collection, addDoc } from "firebase/firestore";


export default function BulkImportTeams() {
  const [division, setDivision] = useState("");
  const [teamText, setTeamText] = useState("");

  const teamsRef = collection(db, "teams");

  const handleImport = async () => {
    if (!division) return alert("Velg en divisjon");
    if (!teamText.trim()) return alert("Skriv inn minst ett lag");

    const teamNames = teamText
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    for (const name of teamNames) {
      const docRef = await addDoc(teamsRef, {
        name,
        division,
      });
     
    }

    setTeamText("");
    alert("Lag importert!");
  };

  return (
    <div className="bulk-container">
      <label>Velg divisjon</label>
      <select
        value={division}
        onChange={(e) => setDivision(e.target.value)}
      >
        <option value="">Velg divisjon</option>
        <option value="7.div avd 2">7.div avd 2</option>
        <option value="7.div avd 1">7.div avd 1</option>
        <option value="6.div">6.div</option>
        <option value="5.div">5.div</option>
        <option value="4.div">4.div</option>
      </select>

      <label>Lag (ett per linje)</label>
      <textarea
        value={teamText}
        onChange={(e) => setTeamText(e.target.value)}
        placeholder=""
      />

      <button onClick={handleImport}>Importer lag</button>
    </div>
  );
}