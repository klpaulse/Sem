import { useState } from "react";
import Substitution from "./Substitution";

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

  // Hent spillere basert på valgt lag
  const players =
    fkTeam === homeTeamId
      ? selectedMatch.homePlayers || []
      : fkTeam === awayTeamId
      ? selectedMatch.awayPlayers || []
      : [];

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
              <select
                value={fkPlayer}
                onChange={(e) => setFkPlayer(e.target.value)}
              >
                <option value="">Velg spiller</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
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

      {/* ⭐ LAGVALG (for mål, kort, corner) */}
      {type !== "comment" && type !== "sub" && type !== "whistle" && (
        <>
          <label>Lag</label>
          <select
            value={eventTeam}
            onChange={(e) => setEventTeam(e.target.value)}
          >
            <option value="">Velg lag</option>
            <option value={homeTeamId}>{selectedMatch.homeTeamName}</option>
            <option value={awayTeamId}>{selectedMatch.awayTeamName}</option>
          </select>
        </>
      )}

      {/* ⭐ TEKSTFELT (ikke for bytte eller frispark) */}
      {type !== "sub" && type !== "whistle" && (
        <>
          <label>Tekst</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Valgfri kommentar"
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