import { useState } from "react";
import { db } from "../../config/Firebase";
import { addDoc, collection } from "firebase/firestore";

export default function CreateTeamForm() {
  const [name, setName] = useState("");
  const [division, setDivision] = useState("");

  const teamsRef = collection(db, "teams");

  const handleSubmit = async () => {
    if (!name || !division) return alert("Fyll inn alle feltene");

    try {
        const docRef = await addDoc(teamsRef,{ 
        name,
        division
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
        <option value="7.div avd 2">7.div avd 2</option>
        <option value="7.div avd 1">7.div avd 1</option>
        <option value="6.div">6.div</option>
        <option value="5.div">5.div</option>
        <option value="4.div">4.div</option>
      </select>

      <button onClick={handleSubmit}>Legg til lag</button>
    </section>
  );
}