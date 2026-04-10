import { useEffect, useState } from "react";
import { db, auth } from "../../config/Firebase";
import { addDoc, Timestamp, collection, getDocs } from "firebase/firestore";

export default function CreateMatchForm() {
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");

  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);

  const [selectedHomeTeam, setSelectedHomeTeam] = useState("");
  const [selectedAwayTeam, setSelectedAwayTeam] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");

  const matchesRef = collection(db, "matches");

  // Hent alle lag og bygg liste over divisjoner
  useEffect(() => {
    const fetchTeams = async () => {
      const teamsRef = collection(db, "teams");
      const snapshot = await getDocs(teamsRef);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTeams(data);

      // Finn unike divisjoner
      const uniqueDivs = [...new Set(data.map((t) => t.division))];
      setDivisions(uniqueDivs);
    };

    fetchTeams();
  }, []);

  // Filtrer lag når divisjon velges
  useEffect(() => {
    if (!selectedDivision) {
      setFilteredTeams([]);
      return;
    }

    const filtered = teams.filter((t) => t.division === selectedDivision);
    setFilteredTeams(filtered);
  }, [selectedDivision, teams]);

  const addMatch = async () => {
    if (!selectedDivision) return alert("Velg divisjon");
    if (!selectedHomeTeam || !selectedAwayTeam)
      return alert("Velg begge lag");
    if (selectedHomeTeam === selectedAwayTeam)
      return alert("Et lag kan ikke spille mot seg selv");
    if (!date || !time) return alert("Velg dato og tid");

    const fullDate = new Date(`${date}T${time}`);

    const homeTeamObj = filteredTeams.find((t) => t.id === selectedHomeTeam);
    const awayTeamObj = filteredTeams.find((t) => t.id === selectedAwayTeam);

    try {
      await addDoc(matchesRef, {
        division: selectedDivision,
        
        homeTeamId: homeTeamObj.id,
        awayTeamId: awayTeamObj.id,

        homeTeamName: homeTeamObj.name,
        awayTeamName: awayTeamObj.name,

        date: Timestamp.fromDate(fullDate),
        time: time,                                  // klokkeslett
    
        homeScore: null,
        awayScore: null,
        played: false,
        goalScorers: [],
        userId: auth?.currentUser?.uid,
      });

      // Reset
      setSelectedHomeTeam("");
      setSelectedAwayTeam("");
      setDate("");
      setTime("");
      setVenue("");

      alert("Kamp lagt til!");
    } catch (err) {
      console.error(err);
      alert("Feil ved lagring av kamp");
    }
  };

  return (
    <section>
      <h2>Legg til kamp</h2>

      {/* Velg divisjon */}
      <select
        value={selectedDivision}
        onChange={(e) => setSelectedDivision(e.target.value)}
      >
        <option value="">Velg divisjon</option>
        {divisions.map((div) => (
          <option key={div} value={div}>
            {div}
          </option>
        ))}
      </select>

      {/* Hjemmelag */}
      <select
        value={selectedHomeTeam}
        onChange={(e) => setSelectedHomeTeam(e.target.value)}
        disabled={!selectedDivision}
      >
        <option value="">Velg hjemmelag</option>
        {filteredTeams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>

      {/* Bortelag */}
      <select
        value={selectedAwayTeam}
        onChange={(e) => setSelectedAwayTeam(e.target.value)}
        disabled={!selectedDivision}
      >
        <option value="">Velg bortelag</option>
        {filteredTeams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>

      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      <input
        placeholder="Bane / sted"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
      />

      <button onClick={addMatch}>Legg til kamp</button>
    </section>
  );
}