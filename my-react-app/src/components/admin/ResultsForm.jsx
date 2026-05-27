import { useEffect, useState, useId } from "react";
import { db } from "../../config/Firebase";
import { doc, updateDoc, collection, addDoc, getDocs, deleteDoc, arrayUnion } from "firebase/firestore";
import { getTeam, clearTeamCache } from "../../services/TeamService";

function emptyEntry(teamId, extra = {}) {
  return { teamId, playerId: "", playerName: "", manual: false, ...extra };
}

function emptySub(teamId) {
  return {
    teamId,
    playerOutId: "", playerOutName: "", manualOut: false,
    playerInId:  "", playerInName:  "", manualIn:  false,
  };
}

export default function ResultsForm({ editingMatch, setEditingMatch }) {
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [homeManualNames, setHomeManualNames] = useState([]);
  const [awayManualNames, setAwayManualNames] = useState([]);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [goals, setGoals] = useState([]);
  const [cards, setCards] = useState([]);
  const [subs,  setSubs]  = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const matchId = editingMatch?.id;

  useEffect(() => {
    if (!matchId) return;
    setHomeScore(editingMatch.homeScore ?? 0);
    setAwayScore(editingMatch.awayScore ?? 0);
    setGoals([]); setCards([]); setSubs([]);
    setSaveError(null);
    async function load() {
      const [home, away] = await Promise.all([
        getTeam(editingMatch.homeTeamId),
        getTeam(editingMatch.awayTeamId),
      ]);
      setHomeTeam(home);
      setAwayTeam(away);
      const sort = arr => [...(arr || [])].sort((a, b) => a.name?.localeCompare(b.name, "no"));
      setHomePlayers(sort(home?.players));
      setAwayPlayers(sort(away?.players));
      setHomeManualNames(home?.manualNames || []);
      setAwayManualNames(away?.manualNames || []);

      const eventsSnap = await getDocs(collection(db, "matches", matchId, "events"));
      const loadedGoals = [], loadedCards = [], loadedSubs = [];
      eventsSnap.docs.forEach(d => {
        const e = d.data();
        if (e.type === "goal" || e.type === "own_goal") {
          loadedGoals.push({
            teamId: e.team || "",
            playerId: e.player || "",
            playerName: e.playerName || "",
            manual: !e.player,
            ownGoal: e.type === "own_goal",
          });
        } else if (e.type === "yellow" || e.type === "red" || e.type === "dismissal") {
          loadedCards.push({
            teamId: e.team || "",
            playerId: e.player || "",
            playerName: e.playerName || "",
            manual: !e.player,
            cardType: e.type,
          });
        } else if (e.type === "sub") {
          loadedSubs.push({
            teamId: e.team || "",
            playerOutId: e.out || "",
            playerOutName: e.playerOutName || "",
            manualOut: !e.out,
            playerInId: e.in || "",
            playerInName: e.playerInName || "",
            manualIn: !e.in,
          });
        }
      });
      setGoals(loadedGoals);
      setCards(loadedCards);
      setSubs(loadedSubs);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const playersFor = teamId =>
    teamId === editingMatch.homeTeamId ? homePlayers : awayPlayers;

  const manualNamesFor = teamId =>
    teamId === editingMatch.homeTeamId ? homeManualNames : awayManualNames;

  const opposingTeamId = teamId =>
    teamId === editingMatch.homeTeamId ? editingMatch.awayTeamId : editingMatch.homeTeamId;

  // --- Mål ---
  function addGoal(teamId) {
    setGoals(prev => [...prev, emptyEntry(teamId)]);
    if (teamId === editingMatch.homeTeamId) setHomeScore(s => s + 1);
    else setAwayScore(s => s + 1);
  }
  function addOwnGoal(teamId) {
    setGoals(prev => [...prev, emptyEntry(teamId, { ownGoal: true })]);
    if (teamId === editingMatch.homeTeamId) setHomeScore(s => s + 1);
    else setAwayScore(s => s + 1);
  }
  function removeGoal(index) {
    const g = goals[index];
    if (g.teamId === editingMatch.homeTeamId) setHomeScore(s => Math.max(0, s - 1));
    else setAwayScore(s => Math.max(0, s - 1));
    setGoals(prev => prev.filter((_, i) => i !== index));
  }
  const updateGoal = (index, patch) =>
    setGoals(prev => prev.map((g, i) => i === index ? { ...g, ...patch } : g));

  // --- Kort ---
  function addCard(teamId, cardType) {
    setCards(prev => [...prev, emptyEntry(teamId, { cardType })]);
  }
  const removeCard = index => setCards(prev => prev.filter((_, i) => i !== index));
  const updateCard = (index, patch) =>
    setCards(prev => prev.map((c, i) => i === index ? { ...c, ...patch } : c));

  // --- Bytter ---
  const addSub    = teamId => setSubs(prev => [...prev, emptySub(teamId)]);
  const removeSub = index  => setSubs(prev => prev.filter((_, i) => i !== index));
  const updateSub = (index, patch) =>
    setSubs(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s));

  // --- Lagre ---
  async function saveResult() {
    setSaving(true);
    setSaveError(null);
    const season = editingMatch.season != null ? String(editingMatch.season) : null;
    const division = editingMatch.division || null;

    try {
      await updateDoc(doc(db, "matches", editingMatch.id), {
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        played: true,
        status: "finished",
      });

      const eventsRef = collection(db, "matches", editingMatch.id, "events");
      for (const e of (await getDocs(eventsRef)).docs) await deleteDoc(e.ref);

      for (const g of goals) {
        // For own goals, the scorer is from the opposing team
        const scorerTeamId = g.ownGoal ? opposingTeamId(g.teamId) : g.teamId;
        const name = g.manual
          ? g.playerName.trim()
          : playersFor(scorerTeamId).find(p => p.id === g.playerId)?.name || null;
        if (g.playerId || name) {
          await addDoc(eventsRef, {
            type: g.ownGoal ? "own_goal" : "goal",
            team: g.teamId,
            player: g.playerId || null,
            playerName: name,
            season,
            division,
            createdAt: new Date(),
          });
        }
      }

      for (const c of cards) {
        const name = c.manual
          ? c.playerName.trim()
          : playersFor(c.teamId).find(p => p.id === c.playerId)?.name || null;
        if (c.playerId || name) {
          await addDoc(eventsRef, {
            type: c.cardType === "yellow" ? "yellow" : "red",
            team: c.teamId,
            player: c.playerId || null,
            playerName: name,
            season,
            division,
            createdAt: new Date(),
          });
        }
      }

      for (const s of subs) {
        const outName = s.manualOut
          ? s.playerOutName.trim()
          : playersFor(s.teamId).find(p => p.id === s.playerOutId)?.name || null;
        const inName = s.manualIn
          ? s.playerInName.trim()
          : playersFor(s.teamId).find(p => p.id === s.playerInId)?.name || null;
        if (s.playerOutId || outName || s.playerInId || inName) {
          await addDoc(eventsRef, {
            type: "sub",
            team: s.teamId,
            out: s.playerOutId || null,
            playerOutName: outName,
            in: s.playerInId || null,
            playerInName: inName,
            season,
            division,
            createdAt: new Date(),
          });
        }
      }

      // Save new manually typed names to the correct team
      const newNamesForTeam = { [editingMatch.homeTeamId]: [], [editingMatch.awayTeamId]: [] };
      goals.forEach(g => {
        if (!g.manual || !g.playerName.trim()) return;
        const tid = g.ownGoal ? opposingTeamId(g.teamId) : g.teamId;
        newNamesForTeam[tid]?.push(g.playerName.trim());
      });
      cards.forEach(c => {
        if (c.manual && c.playerName.trim()) newNamesForTeam[c.teamId]?.push(c.playerName.trim());
      });
      subs.forEach(s => {
        if (s.manualOut && s.playerOutName.trim()) newNamesForTeam[s.teamId]?.push(s.playerOutName.trim());
        if (s.manualIn  && s.playerInName.trim())  newNamesForTeam[s.teamId]?.push(s.playerInName.trim());
      });

      for (const [tid, names] of Object.entries(newNamesForTeam)) {
        if (names.length > 0) {
          await updateDoc(doc(db, "teams", tid), { manualNames: arrayUnion(...names) });
          clearTeamCache(tid);
        }
      }

      setEditingMatch(null);
    } catch (err) {
      console.error("Lagring feilet:", err);
      setSaveError("Lagring feilet: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!homeTeam || !awayTeam) return <p>Laster...</p>;

  const teams = [
    { team: homeTeam, teamId: editingMatch.homeTeamId },
    { team: awayTeam, teamId: editingMatch.awayTeamId },
  ];

  return (
    <div className="results-form">
      <h2>Legg inn resultat</h2>

      {/* SCOREBOARD */}
      <div className="results-scoreboard">
        {teams.map(({ team, teamId }) => (
          <div key={teamId} className="results-team">
            <span className="results-team-name">{team.name}</span>
            <div className="results-score-controls">
              <button className="score-btn minus"
                onClick={() => teamId === editingMatch.homeTeamId
                  ? setHomeScore(s => Math.max(0, s - 1))
                  : setAwayScore(s => Math.max(0, s - 1))}>−</button>
              <span className="results-score">
                {teamId === editingMatch.homeTeamId ? homeScore : awayScore}
              </span>
              <button className="score-btn plus"
                onClick={() => teamId === editingMatch.homeTeamId
                  ? setHomeScore(s => s + 1)
                  : setAwayScore(s => s + 1)}>+</button>
            </div>
          </div>
        ))}
      </div>

      {/* MÅLSCORERE */}
      <div className="results-scorers">
        {teams.map(({ team, teamId }) => {
          const teamGoals = goals.map((g, i) => ({ ...g, index: i })).filter(g => g.teamId === teamId);
          const oppId = opposingTeamId(teamId);
          return (
            <div key={teamId} className="results-scorers-col">
              <h3>{team.name}</h3>
              {teamGoals.map(g => (
                <EntryRow key={g.index} entry={g}
                  players={g.ownGoal ? playersFor(oppId) : playersFor(teamId)}
                  icon={g.ownGoal ? "🥅" : "⚽"}
                  suggestions={g.ownGoal ? manualNamesFor(oppId) : manualNamesFor(teamId)}
                  onChange={patch => updateGoal(g.index, patch)}
                  onRemove={() => removeGoal(g.index)} />
              ))}
              <div className="card-btns">
                <button className="add-scorer-btn" onClick={() => addGoal(teamId)}>+ Mål</button>
                <button className="add-scorer-btn add-scorer-btn--og" onClick={() => addOwnGoal(teamId)}>+ Selvmål</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* KORT */}
      <div className="results-cards-header">Kort</div>
      <div className="results-scorers">
        {teams.map(({ team, teamId }) => {
          const teamCards = cards.map((c, i) => ({ ...c, index: i })).filter(c => c.teamId === teamId);
          return (
            <div key={teamId} className="results-scorers-col">
              <h3>{team.name}</h3>
              {teamCards.map(c => (
                <EntryRow key={c.index} entry={c} players={playersFor(teamId)}
                  icon={c.cardType === "yellow" ? "🟨" : c.cardType === "dismissal" ? "🟥🚫" : "🟥"}
                  suggestions={manualNamesFor(teamId)}
                  onChange={patch => updateCard(c.index, patch)}
                  onRemove={() => removeCard(c.index)} />
              ))}
              <div className="card-btns">
                <button className="add-scorer-btn add-scorer-btn--yellow" onClick={() => addCard(teamId, "yellow")}>+ Gult</button>
                <button className="add-scorer-btn add-scorer-btn--red"    onClick={() => addCard(teamId, "red")}>+ Rødt</button>
                <button className="add-scorer-btn add-scorer-btn--red"    onClick={() => addCard(teamId, "dismissal")}>+ Utvisning</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* BYTTER */}
      <div className="results-cards-header">Bytter</div>
      <div className="results-scorers">
        {teams.map(({ team, teamId }) => {
          const teamSubs = subs.map((s, i) => ({ ...s, index: i })).filter(s => s.teamId === teamId);
          return (
            <div key={teamId} className="results-scorers-col">
              <h3>{team.name}</h3>
              {teamSubs.map(s => (
                <SubRow key={s.index} sub={s} players={playersFor(teamId)}
                  suggestions={manualNamesFor(teamId)}
                  onChange={patch => updateSub(s.index, patch)}
                  onRemove={() => removeSub(s.index)} />
              ))}
              <button className="add-scorer-btn" onClick={() => addSub(teamId)}>+ Bytte</button>
            </div>
          );
        })}
      </div>

      {/* HANDLINGER */}
      {saveError && <p style={{ color: "#e74c3c", fontSize: "0.82rem", margin: 0 }}>{saveError}</p>}
      <div className="results-actions">
        <button className="save-btn" onClick={saveResult} disabled={saving}>
          {saving ? "Lagrer..." : "Lagre resultat"}
        </button>
        <button className="cancel-btn" onClick={() => setEditingMatch(null)}>Avbryt</button>
      </div>
    </div>
  );
}

function PlayerPicker({ value, name, manual, players, placeholder, suggestions = [], onSelect, onName, onToggle }) {
  const uid = useId();
  const listId = uid + "-suggestions";
  return (
    <div className="sub-picker">
      {manual ? (
        <>
          <input className="scorer-name-input" type="text" placeholder={placeholder}
            list={listId} value={name} onChange={e => onName(e.target.value)} autoFocus />
          {suggestions.length > 0 && (
            <datalist id={listId}>
              {suggestions.map(s => <option key={s} value={s} />)}
            </datalist>
          )}
        </>
      ) : (
        <select value={value} onChange={e => onSelect(e.target.value)}>
          <option value="">{placeholder}</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
      <button className="scorer-manual-toggle" title={manual ? "Velg fra liste" : "Ikke i troppen"}
        onClick={onToggle}>
        {manual ? "↩" : "✏️"}
      </button>
    </div>
  );
}

function SubRow({ sub, players, suggestions = [], onChange, onRemove }) {
  return (
    <div className="sub-row">
      <span className="scorer-icon">⇄</span>
      <div className="sub-players">
        <PlayerPicker
          value={sub.playerOutId} name={sub.playerOutName} manual={sub.manualOut}
          players={players} placeholder="Ut" suggestions={suggestions}
          onSelect={v  => onChange({ playerOutId: v })}
          onName={n    => onChange({ playerOutName: n })}
          onToggle={()  => onChange({ manualOut: !sub.manualOut, playerOutId: "", playerOutName: "" })}
        />
        <span className="sub-arrow">↓</span>
        <PlayerPicker
          value={sub.playerInId} name={sub.playerInName} manual={sub.manualIn}
          players={players} placeholder="Inn" suggestions={suggestions}
          onSelect={v  => onChange({ playerInId: v })}
          onName={n    => onChange({ playerInName: n })}
          onToggle={()  => onChange({ manualIn: !sub.manualIn, playerInId: "", playerInName: "" })}
        />
      </div>
      <button className="remove-scorer" onClick={onRemove}>✕</button>
    </div>
  );
}

function EntryRow({ entry, players, icon, suggestions = [], onChange, onRemove }) {
  const uid = useId();
  const listId = uid + "-suggestions";
  return (
    <div className="scorer-row">
      <span className="scorer-icon">{icon}</span>
      {entry.manual ? (
        <>
          <input className="scorer-name-input" type="text" placeholder="Spillernavn"
            list={listId} value={entry.playerName}
            onChange={e => onChange({ playerName: e.target.value })} autoFocus />
          {suggestions.length > 0 && (
            <datalist id={listId}>
              {suggestions.map(s => <option key={s} value={s} />)}
            </datalist>
          )}
        </>
      ) : (
        <select value={entry.playerId} onChange={e => onChange({ playerId: e.target.value })}>
          <option value="">Velg spiller</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
      <button className="scorer-manual-toggle"
        title={entry.manual ? "Velg fra liste" : "Ikke i troppen"}
        onClick={() => onChange({ manual: !entry.manual, playerId: "", playerName: "" })}>
        {entry.manual ? "↩" : "✏️"}
      </button>
      <button className="remove-scorer" onClick={onRemove}>✕</button>
    </div>
  );
}
