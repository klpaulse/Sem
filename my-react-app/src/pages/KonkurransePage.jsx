import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../config/Firebase";
import "../assets/style/konkurranse.css";

export default function KonkurransePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDoc(doc(db, "competitions", id)).then(snap => {
      setCompetition(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || !answer.trim() || !email.trim()) return;
    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "competition_submissions"), {
        competitionId: id,
        competitionTitle: competition.title,
        name: name.trim(),
        answer: answer.trim(),
        email: email.trim(),
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="kp-page"><p className="kp-loading">Laster...</p></div>;

  if (!competition) return (
    <div className="kp-page">
      <p className="kp-loading">Fant ikke konkurransen.</p>
      <button className="back-btn" onClick={() => navigate("/")} aria-label="Tilbake" />
    </div>
  );

  return (
    <div className="kp-page">
      <button className="back-btn" onClick={() => navigate("/")} aria-label="Tilbake" />

      <div className="kp-card">
        <div className="kp-icon">🏆</div>
        <h1 className="kp-title">{competition.title}</h1>

        {competition.question && (
          <p className="kp-question">{competition.question}</p>
        )}

        {!competition.active ? (
          <div className="kp-closed">Denne konkurransen er avsluttet.</div>
        ) : submitted ? (
          <div className="kp-success">
            <span className="kp-success__check">✓</span>
            <p>Svaret ditt er registrert — lykke til!</p>
          </div>
        ) : (
          <form className="kp-form" onSubmit={submit}>
            <input
              className="kp-input"
              type="text"
              placeholder="Navn *"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <input
              className="kp-input"
              type="text"
              placeholder="Svar *"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              required
            />
            <input
              className="kp-input"
              type="email"
              placeholder="E-postadresse *"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {error && <p className="kp-error">{error}</p>}
            <button
              className="kp-submit"
              type="submit"
              disabled={saving || !name.trim() || !answer.trim() || !email.trim()}
            >
              {saving ? "Sender..." : "Send inn svar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
