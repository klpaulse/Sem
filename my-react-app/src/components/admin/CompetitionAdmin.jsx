import { useEffect, useState } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, where, getDocs, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/Firebase";

const inputStyle = {
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "6px",
  color: "#fff",
  padding: "9px 12px",
  fontSize: "14px",
  width: "100%",
  boxSizing: "border-box",
};

export default function CompetitionAdmin() {
  const [competitions, setCompetitions] = useState([]);
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "competitions"), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCompetitions(list);
    });
    return () => unsub();
  }, []);

  async function addCompetition() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "competitions"), {
        title: title.trim(),
        question: question.trim() || null,
        active: true,
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setQuestion("");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(comp) {
    await updateDoc(doc(db, "competitions", comp.id), { active: !comp.active });
  }

  async function removeCompetition(id) {
    if (!window.confirm("Slette konkurransen og alle svar?")) return;
    await deleteDoc(doc(db, "competitions", id));
  }

  async function toggleSubmissions(compId) {
    if (expandedId === compId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(compId);
    if (submissions[compId]) return;
    setLoadingSubmissions(true);
    try {
      const snap = await getDocs(
        query(collection(db, "competition_submissions"), where("competitionId", "==", compId))
      );
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
      setSubmissions(prev => ({ ...prev, [compId]: list }));
    } finally {
      setLoadingSubmissions(false);
    }
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2>Konkurranser</h2>

      {competitions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {competitions.map(comp => (
            <div key={comp.id} style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${comp.active ? "rgba(46,204,113,0.25)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: "8px",
              overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px" }}>
                <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>🏆</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: comp.active ? "#fff" : "#666", fontSize: "0.9rem" }}>
                    {comp.title}
                  </div>
                  {comp.question && (
                    <div style={{ fontSize: "0.75rem", color: "#555", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {comp.question}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    className="btn-secondary btn-sm"
                    style={{ color: comp.active ? "#2ecc71" : "#888", borderColor: comp.active ? "rgba(46,204,113,0.4)" : undefined }}
                    onClick={() => toggleActive(comp)}
                  >
                    {comp.active ? "Aktiv" : "Inaktiv"}
                  </button>
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => toggleSubmissions(comp.id)}
                  >
                    Svar {expandedId === comp.id ? "▲" : "▼"}
                  </button>
                  <button className="btn-danger btn-sm" onClick={() => removeCompetition(comp.id)}>Slett</button>
                </div>
              </div>

              {expandedId === comp.id && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 14px" }}>
                  {loadingSubmissions ? (
                    <p style={{ color: "#666", fontSize: "0.82rem", margin: 0 }}>Laster svar...</p>
                  ) : !submissions[comp.id]?.length ? (
                    <p style={{ color: "#555", fontSize: "0.82rem", margin: 0 }}>Ingen svar ennå.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ fontSize: "0.72rem", color: "#555", marginBottom: "4px" }}>
                        {submissions[comp.id].length} svar totalt
                      </div>
                      {submissions[comp.id].map(s => (
                        <div key={s.id} style={{
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: "6px",
                          padding: "8px 10px",
                        }}>
                          <div style={{ fontWeight: 600, color: "#ccc", fontSize: "0.85rem" }}>{s.name}</div>
                          <div style={{ color: "#aaa", fontSize: "0.82rem", marginTop: "2px" }}>Svar: <em>{s.answer}</em></div>
                          <div style={{ color: "#555", fontSize: "0.75rem", marginTop: "2px" }}>{s.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}>
        <h4 style={{ margin: 0, color: "#aaa", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Ny konkurranse
        </h4>
        <input
          placeholder='Tittel, f.eks. "Gjett antall mål!" *'
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={inputStyle}
        />
        <textarea
          placeholder="Spørsmål / oppgavebeskrivelse (valgfritt)"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <button
          className="btn-primary"
          onClick={addCompetition}
          disabled={saving || !title.trim()}
          style={{ alignSelf: "flex-start" }}
        >
          {saving ? "Lagrer..." : "Opprett konkurranse"}
        </button>
      </div>
    </section>
  );
}
