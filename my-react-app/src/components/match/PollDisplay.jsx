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

export default function PollDisplay({
  matchId,
  sticky = false,
  singlePollId = null,
  isAdmin = false
}) {
  const [polls, setPolls] = useState([]);
  const voterId = getVoterId();

  useEffect(() => {
    if (!matchId) return;
    const ref = collection(db, "matches", matchId, "polls");
    const unsub = onSnapshot(ref, (snap) => {
      setPolls(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.active && (!singlePollId || p.id === singlePollId))
      );
    });
    return () => unsub();
  }, [matchId, singlePollId]);

  async function vote(poll, optionIndex) {
    if (isAdmin) return; // ⭐ Admin kan ikke stemme
    const alreadyVoted = poll.voters?.includes(voterId);
    if (alreadyVoted) return;

    const pollRef = doc(db, "matches", matchId, "polls", poll.id);

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
    <>
      {polls.map((poll) => {
        const hasVoted = poll.voters?.includes(voterId);
        const totalVotes = poll.options.reduce(
          (sum, o) => sum + (o.votes || 0),
          0
        );

        const isPreMatchPoll = poll.preMatch === true;

        // ⭐ Felles renderer for alternativer
        function renderOption(opt, i) {
          const pct =
            totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;

          // ⭐ ADMIN: kun resultat
          if (isAdmin) {
            return (
              <div key={i} className="poll-event-option voted">
                <div className="poll-event-option-top">
                  <span className="poll-event-option-text">{opt.text}</span>
                  <span className="poll-event-option-pct">{pct}%</span>
                </div>

                <div className="poll-event-bar-bg">
                  <div
                    className="poll-event-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          }

          // ⭐ Vanlig bruker
          return (
            <button
              key={i}
              className={`poll-event-option ${hasVoted ? "voted" : ""}`}
              onClick={() => vote(poll, i)}
              disabled={hasVoted}
              style={{ width: "100%", textAlign: "left" }}
            >
              <div className="poll-event-option-top">
                <span className="poll-event-option-text">{opt.text}</span>
                {hasVoted && <span className="poll-event-option-pct">{pct}%</span>}
              </div>

              {hasVoted && (
                <div className="poll-event-bar-bg">
                  <div
                    className="poll-event-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </button>
          );
        }

        /* ⭐ PRE-MATCH POLL (flat, sticky mulig) */
        if (isPreMatchPoll) {
          return (
            <div
              key={poll.id}
              className={`poll-event pre-match ${sticky ? "poll-sticky" : ""}`}
            >
              <p className="poll-event-question">{poll.question}</p>

              {poll.options.map(renderOption)}

              {(hasVoted || isAdmin) && (
                <p className="poll-event-total">
                  {totalVotes} {totalVotes === 1 ? "stemme" : "stemmer"}
                </p>
              )}
            </div>
          );
        }

        /* ⭐ UNDER KAMP – EVENT-BOKS */
        return (
          <div key={poll.id} className="event event-comment">
            <span className="event-icon"></span>

            <div className="event-text" style={{ width: "100%" }}>
              <div className="poll-event">
                <p className="poll-event-question">{poll.question}</p>

                {poll.options.map(renderOption)}

                {(hasVoted || isAdmin) && (
                  <p className="poll-event-total">
                    {totalVotes} {totalVotes === 1 ? "stemme" : "stemmer"}
                  </p>
                )}
              </div>
            </div>

            <span className="event-minute"></span>
          </div>
        );
      })}
    </>
  );
}
