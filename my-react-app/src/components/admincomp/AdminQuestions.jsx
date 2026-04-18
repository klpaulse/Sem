import { useState, useEffect } from "react";
import { db } from "../../config/Firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

export default function AdminQuestions({ matchId, getMinute }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  // Hent spørsmål live
  useEffect(() => {
    const q = query(
      collection(db, "matches", matchId, "questions"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [matchId]);

  // Admin svarer
  async function submitAnswer(id) {
    const answer = answers[id];
    if (!answer || !answer.trim()) return;

    const question = questions.find((q) => q.id === id);

    await updateDoc(doc(db, "matches", matchId, "questions", id), {
      answer,
      answered: true
    });

    await addDoc(collection(db, "matches", matchId, "events"), {
      type: "questionAnswer",
      name: question?.name || "Ukjent",
      question: question?.question || "",
      answer,
      minute: getMinute ? getMinute() : null,
      createdAt: serverTimestamp()
    });

    setAnswers((prev) => ({ ...prev, [id]: "" }));
  }

  async function deleteQuestion(id) {
    await deleteDoc(doc(db, "matches", matchId, "questions", id));
  }

  return (
    <div className="admin-questions">
      <h3>Publikumsspørsmål</h3>

      {/* ⭐ Ubesvarte spørsmål */}
      <h4>Ubesvarte spørsmål</h4>

      {questions.filter((q) => !q.answered).length === 0 && (
        <p>Ingen ubesvarte spørsmål.</p>
      )}

      {questions
        .filter((q) => !q.answered)
        .map((q) => (
          <div key={q.id} className="admin-question-item">
            <p><strong>{q.name} spør:</strong> {q.question}</p>

            <div className="answer-box">
              <input
                type="text"
                placeholder="Skriv svar..."
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
              />
              <button onClick={() => submitAnswer(q.id)}>Svar</button>
            </div>

            <button className="delete-btn" onClick={() => deleteQuestion(q.id)}>
              Slett
            </button>
          </div>
        ))}

    
    </div>
  );
}







