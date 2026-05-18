import { useEffect, useState } from "react";
import { db, auth } from "../../config/Firebase";
import { addDoc, Timestamp, collection, getDocs } from "firebase/firestore";
import { generateSlug } from "../../utils/generateSlug";

export default function CreateMatchForm({ divisions, onAdded }) {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedHomeTeam, setSelectedHomeTeam] = useState("");
  const [selectedAwayTeam, setSelectedAwayTeam] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [reporters, setReporters] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getDocs(collection(db, "teams")).then(snap => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    setFilteredTeams(selectedDivision ? teams.filter(t => t.division === selectedDivision) : []);
    setSelectedHomeTeam("");
    setSelectedAwayTeam("");
  }, [selectedDivision, teams]);

  const addMatch = async () => {
    setError("");
    if (!selectedDivision) return setError("Velg divisjon");
    if (!selectedHomeTeam || !selectedAwayTeam) return setError("Velg begge lag");
    if (selectedHomeTeam === selectedAwayTeam) return setError("Hjemme- og bortelag kan ikke være like");
    if (!date || !time) return setError("Velg dato og tid");

    const fullDate = new Date(`${date}T${time}`);
    const homeTeamObj = filteredTeams.find(t => t.id === selectedHomeTeam);
    const awayTeamObj = filteredTeams.find(t => t.id === selectedAwayTeam);
    const slug = generateSlug(homeTeamObj.name, awayTeamObj.name, fullDate, time);

    try {
      await addDoc(collection(db, "matches"), {
        division: selectedDivision,
        homeTeamId: homeTeamObj.id,
        awayTeamId: awayTeamObj.id,
        slug,
        date: Timestamp.fromDate(fullDate),
        time,
        arena: venue,
        status: "not_started",
        events: [],
        homeScore: null,
        awayScore: null,
        played: false,
        goalScorers: [],
        reporters,
        userId: auth?.currentUser?.uid,
      });

      setSelectedHomeTeam("");
      setSelectedAwayTeam("");
      setDate("");
      setTime("");
      setVenue("");
      setReporters([]);
      setReporterEmail("");
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onAdded?.(); }, 1200);
    } catch {
      setError("Noe gikk galt, prøv igjen");
    }
  };

  const addReporter = () => {
    if (!reporterEmail.trim() || reporters.includes(reporterEmail)) return;
    setReporters([...reporters, reporterEmail]);
    setReporterEmail("");
  };

  return (
    <div className="kampadmin-add-form">
      <div className="kampadmin-form-row">
        <div className="kampadmin-field">
          <label>Divisjon</label>
          <select value={selectedDivision} onChange={e => setSelectedDivision(e.target.value)}>
            <option value="">Velg divisjon</option>
            {(divisions || []).map(div => <option key={div} value={div}>{div}</option>)}
          </select>
        </div>
      </div>

      <div className="kampadmin-form-row">
        <div className="kampadmin-field">
          <label>Hjemmelag</label>
          <select value={selectedHomeTeam} onChange={e => setSelectedHomeTeam(e.target.value)} disabled={!selectedDivision}>
            <option value="">Velg hjemmelag</option>
            {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="kampadmin-field">
          <label>Bortelag</label>
          <select value={selectedAwayTeam} onChange={e => setSelectedAwayTeam(e.target.value)} disabled={!selectedDivision}>
            <option value="">Velg bortelag</option>
            {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div className="kampadmin-form-row">
        <div className="kampadmin-field">
          <label>Dato</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="kampadmin-field">
          <label>Tid</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
        <div className="kampadmin-field">
          <label>Bane / sted</label>
          <input placeholder="Valgfritt" value={venue} onChange={e => setVenue(e.target.value)} />
        </div>
      </div>

      <div className="kampadmin-field">
        <label>Reportere</label>
        <div className="kampadmin-reporter-row">
          <input
            placeholder="E-post til reporter"
            value={reporterEmail}
            onChange={e => setReporterEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addReporter()}
          />
          <button type="button" className="btn-secondary btn-sm" onClick={addReporter}>Legg til</button>
        </div>
        {reporters.length > 0 && (
          <div className="kampadmin-reporter-list">
            {reporters.map(email => (
              <span key={email} className="kampadmin-reporter-chip">
                {email}
                <button onClick={() => setReporters(reporters.filter(r => r !== email))}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="kampadmin-error">{error}</p>}
      {success && <p className="kampadmin-success">Kamp lagt til!</p>}

      <button className="btn-primary" onClick={addMatch}>Legg til kamp</button>
    </div>
  );
}
