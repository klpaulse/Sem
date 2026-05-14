import { useState, useEffect } from "react";
import { db, auth } from "../../config/Firebase";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
 
/*
  Støtter tab-separert format fra fotball.no:
  Runde  Dato  Dag  Tid  Hjemmelag  Resultat  Bortelag  Bane  Turnering  Kampnummer  Spillform
 
  division settes til "7.div avd 1" (fjerner "Menn vår/høst" fra turnering-feltet)
  season settes automatisk fra årstallet i datoen
  Duplikater (samme hjemmelag + bortelag + dato) hoppes over
*/
 
function parseDate(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  let day, month, year;
  if (dateStr.includes(".")) {
    [day, month, year] = dateStr.split(".");
  } else {
    [year, month, day] = dateStr.split("-");
  }
  const d = new Date(
    `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${timeStr}:00`
  );
  return isNaN(d.getTime()) ? null : d;
}
 
// Normaliser divisjonsnavn: "7.div Menn vår avd 1" → "7.div avd 1"
function normalizeDivision(raw) {
  return raw
    .replace(/\s*(Menn|Kvinner)\s*(vår|høst|vaar|host)\s*/i, " ")
    .replace(/\s+/g, " ")
    .trim();
}
 
// Nøkkel for duplikatsjekk
function matchKey(homeId, awayId, dateObj) {
  return `${homeId}_${awayId}_${dateObj.toISOString().split("T")[0]}`;
}
 
export default function BulkImportMatches() {
  const [rawText, setRawText] = useState("");
  const [teams, setTeams] = useState([]);
  const [existingMatches, setExistingMatches] = useState([]);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
 
  useEffect(() => {
    async function load() {
      const [teamsSnap, matchesSnap] = await Promise.all([
        getDocs(collection(db, "teams")),
        getDocs(collection(db, "matches")),
      ]);
      setTeams(teamsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setExistingMatches(
        matchesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    }
    load();
  }, []);
 
  function findTeam(name) {
    const n = name.trim().toLowerCase();
    return teams.find((t) => t.name.trim().toLowerCase() === n) || null;
  }
 
  function parseLine(line) {
    const parts = line.includes("\t")
      ? line.split("\t").map((p) => p.trim())
      : line.split(";").map((p) => p.trim());
 
    if (parts.length >= 11) {
      // Tab-format: Runde Dato Dag Tid Hjemmelag Resultat Bortelag Bane Turnering Kampnummer Spillform
      return {
        round: parts[0],
        dateStr: parts[1],
        timeStr: parts[3],
        homeName: parts[4],
        awayName: parts[6],
        arena: parts[7],
        divisionRaw: parts[8],
      };
    } else if (parts.length >= 6) {
      // Semikolon-format: Dato Tid Hjemmelag Bortelag Bane Divisjon
      return {
        round: "",
        dateStr: parts[0],
        timeStr: parts[1],
        homeName: parts[2],
        awayName: parts[3],
        arena: parts[4],
        divisionRaw: parts[5],
      };
    }
    return null;
  }
 
  function parseCsv() {
    setResult(null);
 
    const existingKeys = new Set(
      existingMatches
        .map((m) => {
          const d = m.date?.toDate ? m.date.toDate() : new Date(m.date);
          return matchKey(m.homeTeamId, m.awayTeamId, d);
        })
        .filter(Boolean)
    );
 
    // Støtter \n, \r\n og Excel-format der rader er på én linje separert med tall+tab
    // Splitter på linjeskift ELLER på mønsteret " 1\t", " 2\t" osv (Excel én-linje-format)
    let rawLines = rawText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
 
    // Hvis alt kom på én linje (Excel-kopiert) – splitt på runde-tall etterfulgt av tab
    if (rawLines.length <= 2) {
      rawLines = rawText
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\s+(\d+)\t/g, "\n$1\t")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    }
 
    const lines = rawLines;
 
    const rows = [];
 
    for (const line of lines) {
      if (
        line.toLowerCase().startsWith("runde") ||
        line.toLowerCase().startsWith("dato")
      )
        continue;
 
      const parsed = parseLine(line);
      if (!parsed) {
        rows.push({ raw: line, error: "Ukjent format – for få kolonner" });
        continue;
      }
 
      const { round, dateStr, timeStr, homeName, awayName, arena, divisionRaw } = parsed;
      const division = normalizeDivision(divisionRaw);
      const homeTeam = findTeam(homeName);
      const awayTeam = findTeam(awayName);
      const dateObj = parseDate(dateStr, timeStr);
 
      let error = null;
      let duplicate = false;
 
      if (!dateObj) {
        error = "Ugyldig dato/tid";
      } else if (!homeTeam) {
        error = `Fant ikke: "${homeName}"`;
      } else if (!awayTeam) {
        error = `Fant ikke: "${awayName}"`;
      } else if (homeTeam.id === awayTeam.id) {
        error = "Hjemme- og bortelag er like";
      } else {
        const key = matchKey(homeTeam.id, awayTeam.id, dateObj);
        if (existingKeys.has(key)) duplicate = true;
      }
 
      rows.push({
        raw: line,
        round,
        dateStr,
        timeStr,
        homeName,
        awayName,
        arena,
        division,
        homeTeam,
        awayTeam,
        dateObj,
        error,
        duplicate,
      });
    }
 
    setPreview(rows);
  }
 
  const newRows = preview.filter((r) => !r.error && !r.duplicate);
  const duplicateRows = preview.filter((r) => r.duplicate);
  const errorRows = preview.filter((r) => r.error);
 
  async function importMatches() {
    if (newRows.length === 0) return;
    setImporting(true);
    setResult(null);
 
    const matchesRef = collection(db, "matches");
    let count = 0;
 
    for (const row of newRows) {
      await addDoc(matchesRef, {
        division: row.division,
        homeTeamId: row.homeTeam.id,
        awayTeamId: row.awayTeam.id,
        date: Timestamp.fromDate(row.dateObj),
        time: row.timeStr,
        arena: row.arena,
        round: row.round,
        season: String(row.dateObj.getFullYear()),
        status: "not_started",
        events: [],
        homeScore: null,
        awayScore: null,
        played: false,
        goalScorers: [],
        userId: auth?.currentUser?.uid || "",
      });
      count++;
    }
 
    setImporting(false);
    setResult({ count, duplicates: duplicateRows.length, errors: errorRows.length });
    setPreview([]);
    setRawText("");
  }
 
  return (
    <section className="bulk-import">
      <h3>Bulk-import av kamper</h3>
 
      <p className="bulk-hint">
        Kopier og lim inn direkte fra fotball.no. Kamper som allerede finnes blir stående.
      </p>
 
      <textarea
        className="bulk-textarea"
        rows={12}
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="Lim inn terminliste her direkte fra fotball.no..."
      />
 
      <button onClick={parseCsv} disabled={!rawText.trim() || teams.length === 0}>
        {teams.length === 0 ? "Laster lag..." : "Forhåndsvis"}
      </button>
 
      {preview.length > 0 && (
        <div className="bulk-preview">
          <h4>
            Forhåndsvisning —{" "}
            <span className="text-ok">{newRows.length} nye</span>,{" "}
            <span className="text-warn">{duplicateRows.length} finnes allerede</span>,{" "}
            <span className="text-error">{errorRows.length} feil</span>
          </h4>
 
          <table className="bulk-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Runde</th>
                <th>Dato</th>
                <th>Tid</th>
                <th>Hjemmelag</th>
                <th>Bortelag</th>
                <th>Bane</th>
                <th>Divisjon</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr
                  key={i}
                  className={
                    row.error ? "row-error" : row.duplicate ? "row-duplicate" : "row-ok"
                  }
                >
                  <td>
                    {row.error ? (
                      <span className="badge badge-error" title={row.error}>✗ {row.error}</span>
                    ) : row.duplicate ? (
                      <span className="badge badge-warn">⚠ Finnes allerede</span>
                    ) : (
                      <span className="badge badge-ok">✓ Ny</span>
                    )}
                  </td>
                  <td>{row.round}</td>
                  <td>{row.dateStr}</td>
                  <td>{row.timeStr}</td>
                  <td className={!row.homeTeam ? "text-error" : ""}>{row.homeName}</td>
                  <td className={!row.awayTeam ? "text-error" : ""}>{row.awayName}</td>
                  <td>{row.arena}</td>
                  <td>{row.division}</td>
                </tr>
              ))}
            </tbody>
          </table>
 
          {newRows.length > 0 && (
            <button className="btn-import" onClick={importMatches} disabled={importing}>
              {importing
                ? "Importerer..."
                : `Importer ${newRows.length} ny${newRows.length !== 1 ? "e kamper" : " kamp"}`}
            </button>
          )}
 
          {newRows.length === 0 && !errorRows.length && (
            <p className="bulk-result">⚠ Alle kamper finnes allerede – ingenting å importere.</p>
          )}
        </div>
      )}
 
      {result && (
        <div className="bulk-result">
          ✅ Importerte {result.count} kamper.
          {result.duplicates > 0 && <span> {result.duplicates} fantes allerede og ble hoppet over.</span>}
          {result.errors > 0 && <span> {result.errors} hadde feil og ble ikke importert.</span>}
        </div>
      )}
    </section>
  );
}