import { useState } from "react";
import { db } from "../../config/Firebase";
import { addDoc, collection } from "firebase/firestore";

export default function CreateTeamForm({ divisions }) {
  const [name, setName] = useState("");
  const [division, setDivision] = useState("");

  const teamsRef = collection(db, "teams");

  const handleSubmit = async () => {
    if (!name || !division) return alert("Fyll inn alle feltene");

    try {
      await addDoc(teamsRef, {
        name,
        division,
        players: []
      });

      setName("");
      setDivision("");

      alert("Lag lagt til!");
    } catch (error) {
      console.error("Feil ved lagring av lag:", error);
    }
  };

  return (
    <section>
      <h2>Legg til lag</h2>

      <input
        placeholder="Lagnavn"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <select value={division} onChange={(e) => setDivision(e.target.value)}>
        <option value="">Velg divisjon</option>

        {divisions.map((div) => (
          <option key={div} value={div}>
            {div}
          </option>
        ))}
      </select>

      <button onClick={handleSubmit}>Legg til lag</button>
    </section>
  );
}