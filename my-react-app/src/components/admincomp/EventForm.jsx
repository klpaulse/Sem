import Substitution from "./Substitution";
import { useEffect, useState } from "react";
import { getTeam } from "../../services/TeamService";

export default function EventForm({
  type,
  setType,
  text,
  setText,
  selectedMatch,
  subTeam,
  setSubTeam,
  subIn,
  setSubIn,
  subOut,
  setSubOut,
  subComment,
  setSubComment,
  addEvent,
  eventTeam,
  setEventTeam
}) {
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);

  // Hent lag basert på ID
  useEffect(() => {
    if (!selectedMatch) return;

    async function loadTeams() {
      const home = await getTeam(selectedMatch.homeTeam);
      const away = await getTeam(selectedMatch.awayTeam);

      setHomeTeam(home);
      setAwayTeam(away);
    }

    loadTeams();
  }, [selectedMatch]);

  return (
    <section>
      <h3>Legg til hendelse</h3>

      {/* TYPE */}
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="goal">Mål</option>
        <option value="injury">Skade</option>
        <option value="yellow">Gult kort</option>
        <option value="red">Rødt kort</option>
        <option value="comment">Kommentar</option>
        <option value="corner">Corner</option>
        <option value="whistle">Fløyte</option>
        <option value="sub">Spillerbytte</option>
      </select>

      {/* BYTTE */}
      {type === "sub" && (
        <Substitution
          selectedMatch={selectedMatch}
          subTeam={subTeam}
          setSubTeam={setSubTeam}
          subIn={subIn}
          setSubIn={setSubIn}
          subOut={subOut}
          setSubOut={setSubOut}
          subComment={subComment}
          setSubComment={setSubComment}
        />
      )}

      {/* LAGVALG FOR ALLE ANDRE HENDELSER */}
      {type !== "sub" && homeTeam && awayTeam && (
        <select
          value={eventTeam || ""}
          onChange={(e) => setEventTeam(e.target.value)}
        >
          <option value="">Velg lag</option>
          <option value={selectedMatch.homeTeam}>{homeTeam.teamName}</option>
          <option value={selectedMatch.awayTeam}>{awayTeam.teamName}</option>
        </select>
      )}

      {/* TEKSTFELT */}
      {type !== "sub" && (
        <input
          type="text"
          placeholder="Beskrivelse"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}

      <button onClick={addEvent}>Legg til hendelse</button>
    </section>
  );
}