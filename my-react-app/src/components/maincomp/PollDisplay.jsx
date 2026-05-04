import { useState, useEffect } from "react";
import { db } from "../../config/Firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

// Generer eller hent anonym bruker-ID
function getVoterId() {
  let id = localStorage.getItem("voterId");
  if (!id) {
    id = Math.random().toString(36).slice(2);
    localStorage.setItem("voterId", id);
  }
  return id;
}

export default function PollDisplay({ matchId }) {
  const [polls, setPolls] = useState([]);
  const voterId = getVoterId();

  useEffect(() => {
    if (!matchId) return;
    const ref = collection(db, "matches", matchId, "polls");
    const unsub = onSnapshot(ref, (snap) => {
      setPolls(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.active)
      );
    });
    return () => unsub();
  }, [matchId]);

  async function vote(poll, optionIndex) {
    const alreadyVoted = poll.voters?.includes(voterId);
    if (alreadyVoted) return;

    const pollRef = doc(db, "matches", matchId, "polls", poll.id);

    // Oppdater votes på riktig alternativ
    const updatedOptions = poll.options.map((opt, i) =>
      i === optionIndex ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
    );

    await updateDoc(pollRef, {
      options: updatedOptions,
      voters: arrayUnion(voterId),
    });
  }

  if (polls.length === 0) return null;

  return (
    <div className="poll-display">
      {polls.map((poll) => {
        const hasVoted = poll.voters?.includes(voterId);
        const totalVotes = poll.options.reduce(
          (sum, o) => sum + (o.votes || 0),
          0
        );

        return (
          <div key={poll.id} className="poll-display-card">
            <p className="poll-display-question">{poll.question}</p>

            <div className="poll-display-options">
              {poll.options.map((opt, i) => {
                const pct =
                  totalVotes > 0
                    ? Math.round((opt.votes / totalVotes) * 100)
                    : 0;

                return (
                  <button
                    key={i}
                    className={`poll-display-option ${hasVoted ? "voted" : ""}`}
                    onClick={() => vote(poll, i)}
                    disabled={hasVoted}
                  >
                    <div className="poll-display-option-top">
                      <span>{opt.text}</span>
                      {hasVoted && <span>{pct}%</span>}
                    </div>

                    {hasVoted && (
                      <div className="poll-display-bar-bg">
                        <div
                          className="poll-display-bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {hasVoted && (
              <p className="poll-display-total">{totalVotes} stemmer</p>
            )}
          </div>
        );
      })}
    </div>
  );
}