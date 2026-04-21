import { useState } from "react";
import { db } from "../../config/Firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AudienceQuestions({ matchId }) {
  const [showBox, setShowBox] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    await addDoc(collection(db, "matches", matchId, "questions"), {
      name,
      question: text,
      answered: false,
      createdAt: serverTimestamp()
    });

    setName("");
    setText("");
    setShowBox(false);
  }

  return (
    <div className="audience-questions">

      <button className="ask-btn" onClick={() => setShowBox(!showBox)}>
        Still et spørsmål
      </button>

      {showBox && (
        <div className="question-popup">
          <button className="close-btn" onClick={() => setShowBox(false)}>
           <span className="close-icon">×</span>
          </button>

          <form onSubmit={submit}>
            <label>Navn</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ditt navn"
            />

            <label>Spørsmål</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Hva lurer du på?"
            />

            <button type="submit">Send inn</button>
          </form>
        </div>
      )}

    </div>
  );
}

