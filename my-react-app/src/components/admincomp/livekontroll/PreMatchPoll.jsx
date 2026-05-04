import { useState, useEffect } from "react";
import { db } from "../../../config/Firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";

export default function PreMatchPoll({ matchId }) {
  const [polls, setPolls] = useState([]);

  // Ny avstemning
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [saving, setSaving] = useState(false);

  // Lytt på avstemninger i Firestore
  useEffect(() => {
    if (!matchId) return;

    const ref = collection(db, "matches", matchId, "polls");
    const unsub = onSnapshot(ref, (snap) => {
      setPolls(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [matchId]);

  function updateOption(i, value) {
    const updated = [...options];
    updated[i] = value;
    setOptions(updated);
  }

  function addOption() {
    if (options.length >= 4) return;
    setOptions([...options, ""]);
  }

  function removeOption(i) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  }

  async function createPoll() {
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) return;

    setSaving(true);

    await addDoc(collection(db, "matches", matchId, "polls"), {
      question: question.trim(),
      options: validOptions.map((o) => ({
        text: o.trim(),
        votes: 0,
      })),
      active: true,
      createdAt: serverTimestamp(),
    });

    setQuestion("");
    setOptions(["", ""]);
    setSaving(false);
  }

  async function deletePoll(pollId) {
    await deleteDoc(doc(db, "matches", matchId, "polls", pollId));
  }

  async function togglePoll(poll) {
    await updateDoc(doc(db, "matches", matchId, "polls", poll.id), {
      active: !poll.active,
    });
  }

  return (
    <div className="prematch-section">
      <h3>Avstemninger</h3>

      {/* Eksisterende avstemninger */}
      {polls.map((poll) => {
        const totalVotes = poll.options.reduce((sum, o) => sum + (o.votes || 0), 0);

        return (
          <div key={poll.id} className="poll-card">
            <div className="poll-header">
              <strong>{poll.question}</strong>
              <div className="poll-actions">
                <button
                  className="poll-toggle"
                  onClick={() => togglePoll(poll)}
                >
                  {poll.active ? "⏸ Deaktiver" : "▶ Aktiver"}
                </button>
                <button
                  className="poll-delete"
                  onClick={() => deletePoll(poll.id)}
                >
                  🗑
                </button>
              </div>
            </div>

            <div className="poll-results">
              {poll.options.map((opt, i) => {
                const pct = totalVotes > 0
                  ? Math.round((opt.votes / totalVotes) * 100)
                  : 0;

                return (
                  <div key={i} className="poll-option-result">
                    <div className="poll-option-label">
                      <span>{opt.text}</span>
                      <span>{pct}% ({opt.votes || 0} stemmer)</span>
                    </div>
                    <div className="poll-bar-bg">
                      <div
                        className="poll-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="poll-total">{totalVotes} stemmer totalt</p>
            </div>
          </div>
        );
      })}

      {/* Lag ny avstemning */}
      <div className="poll-create">
        <h4>Lag ny avstemning</h4>

        <input
          type="text"
          placeholder="Spørsmål, f.eks. 'Hvem vinner i dag?'"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        {options.map((opt, i) => (
          <div key={i} className="poll-option-input">
            <input
              type="text"
              placeholder={`Alternativ ${i + 1}`}
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
            />
            {options.length > 2 && (
              <button onClick={() => removeOption(i)}>✕</button>
            )}
          </div>
        ))}

        {options.length < 4 && (
          <button className="add-option-btn" onClick={addOption}>
            + Legg til alternativ
          </button>
        )}

        <button
          className="create-poll-btn"
          onClick={createPoll}
          disabled={
            saving ||
            !question.trim() ||
            options.filter((o) => o.trim()).length < 2
          }
        >
          {saving ? "Oppretter..." : "Opprett avstemning"}
        </button>
      </div>
    </div>
  );
}