import { useState, useEffect } from "react";

export default function SimpleEventForm({
  type,
  text,
  setText,
  homeTeam,
  awayTeam,
  simpleData,
  setSimpleData
}) {
  const [selectedTeam, setSelectedTeam] = useState(simpleData.team || "");

  // ⭐ Nullstill når parent-data endres
  useEffect(() => {
    setSelectedTeam(simpleData.team || "");
  }, [simpleData]);

  // Oppdater team kun for corner/injury
  useEffect(() => {
    if (type === "corner" || type === "injury") {
      setSimpleData({ ...simpleData, team: selectedTeam });
    }
  }, [selectedTeam, type]);

  return (
    <div className="simple-event-form">

      {/* ⭐ Lagvalg kun for corner og injury */}
      {(type === "corner" || type === "injury") && (
        <>
          <label>Lag</label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="">Velg lag</option>
            <option value={homeTeam.id}>{homeTeam.name}</option>
            <option value={awayTeam.id}>{awayTeam.name}</option>
          </select>
        </>
      )}

      {/* ⭐ Tilleggstid */}
      {type === "addedTime" && (
        <>
          <label>Tilleggstid</label>
          <select
            value={simpleData.minutes || ""}
            onChange={(e) =>
              setSimpleData({ ...simpleData, minutes: e.target.value })
            }
          >
            <option value="">Velg minutter</option>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n} minutter</option>
            ))}
          </select>
        </>
      )}

      {/* ⭐ Kommentar */}
      <label>Kommentar</label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          type === "addedTime"
            ? "Valgfritt (f.eks. 'Mye stopp i spillet')"
            : "Valgfritt"
        }
      />
    </div>
  );
}



