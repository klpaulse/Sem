import { useEffect, useState } from "react";
import Substitution from "./Substitution";
import { getTeam } from "../../services/TeamService";

export default function EventForm({
  type,
  setType,
  text,
  setText,
  selectedMatch,
  homeTeamId,
  awayTeamId,

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
  setEventTeam,

  fkTeam,
  setFkTeam,
  fkPlayer,
  setFkPlayer,
  fkComment,
  setFkComment
}) {
  if (!selectedMatch) return <p>Laster kamp...</p>;

  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);

  useEffect(() => {
    async function loadTeams() {
      const home = await getTeam(homeTeamId);
      const away = await getTeam(awayTeamId);

      setHomeTeam(home);
      setAwayTeam(away);
    }
    loadTeams();
  }, [homeTeamId, awayTeamId]);

  const getPlayersForTeam = (teamId) => {
    const team = teamId === homeTeamId ? homeTeam : awayTeam;
    if (!team) return [];
    return Array.isArray(team.players)
      ? team.players
      : Object.values(team.players || {});
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Registrer hendelse</h3>

      {/* TYPE */}
      <label>Hendelsestype</label>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="goal">Mål</option>
        <option value="yellow">Gult kort</option>
        <option value="red">Rødt kort</option>
        <option value="injury">Skade</option>
        <option value="comment">Kommentar</option>
        <option value="corner">Corner</option>
        <option value="whistle">Frispark</option>
        <option value="sub">Spillerbytte</option>
      </select>

      {/* ⭐ MÅL */}
      {type === "goal" && (
        <>
          <label>Lag som scorer</label>
          <select value={eventTeam} onChange={(e) => setEventTeam(e.target.value)}>
            <option value="">Velg lag</option>
            <option value={homeTeamId}>{selectedMatch.homeTeamName}</option>
            <option value={awayTeamId}>{selectedMatch.awayTeamName}</option>
          </select>

          {eventTeam && (
            <>
              <label>Målscorer</label>
              <select value={subIn} onChange={(e) => setSubIn(e.target.value)}>
                <option value="">Velg spiller</option>
                {getPlayersForTeam(eventTeam).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <label>Målgivende (valgfritt)</label>
              <select value={subOut} onChange={(e) => setSubOut(e.target.value)}>
                <option value="">Ingen</option>
                {getPlayersForTeam(eventTeam).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </>
          )}

          <label>Kommentar (valgfritt)</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Eks: langskudd, heading, straffe..."
          />
        </>
      )}

      {/* ⭐ GULT / RØDT KORT */}
      {(type === "yellow" || type === "red") && (
        <>
          <label>Lag</label>
          <select value={eventTeam} onChange={(e) => setEventTeam(e.target.value)}>
            <option value="">Velg lag</option>
            <option value={homeTeamId}>{selectedMatch.homeTeamName}</option>
            <option value={awayTeamId}>{selectedMatch.awayTeamName}</option>
          </select>

          {eventTeam && (
            <>
              <label>Spiller som får kortet</label>
              <select value={subIn} onChange={(e) => setSubIn(e.target.value)}>
                <option value="">Velg spiller</option>
                {getPlayersForTeam(eventTeam).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </>
          )}

          <label>Kommentar (valgfritt)</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Valgfri kommentar"
          />
        </>
      )}

      {/* ⭐ FRISPARK */}
      {type === "whistle" && (
        <>
          <label>Lag som får frispark</label>
          <select value={fkTeam} onChange={(e) => setFkTeam(e.target.value)}>
            <option value="">Velg lag</option>
            <option value={homeTeamId}>{selectedMatch.homeTeamName}</option>
            <option value={awayTeamId}>{selectedMatch.awayTeamName}</option>
          </select>

          {fkTeam && (
            <>
              <label>Spiller som tar frisparket</label>
              <select value={fkPlayer} onChange={(e) => setFkPlayer(e.target.value)}>
                <option value="">Velg spiller</option>
                {getPlayersForTeam(fkTeam).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </>
          )}

          <label>Kommentar (valgfritt)</label>
          <input
            type="text"
            value={fkComment}
            onChange={(e) => setFkComment(e.target.value)}
            placeholder="Eks: fra 20 meter"
          />
        </>
      )}

      {/* ⭐ CORNER, SKADE */}
      {(type === "corner" || type === "injury") && (
        <>
          <label>Lag</label>
          <select value={eventTeam} onChange={(e) => setEventTeam(e.target.value)}>
            <option value="">Velg lag</option>
            <option value={homeTeamId}>{selectedMatch.homeTeamName}</option>
            <option value={awayTeamId}>{selectedMatch.awayTeamName}</option>
          </select>

          <label>Kommentar (valgfritt)</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </>
      )}

      {/* ⭐ KOMMENTAR */}
      {type === "comment" && (
        <>
          <label>Kommentar</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Skriv kommentar"
          />
        </>
      )}

      {/* ⭐ SPILLERBYTTE */}
      {type === "sub" && (
        <Substitution
          selectedMatch={selectedMatch}
          homeTeamId={homeTeamId}
          awayTeamId={awayTeamId}
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

      <button style={{ marginTop: "15px" }} onClick={addEvent}>
        Legg til hendelse
      </button>
    </div>
  );
}