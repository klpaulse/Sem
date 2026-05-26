import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../config/Firebase";

export default function AnnouncementAdmin() {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "announcements", "active"), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setCurrent(data);
      } else {
        setCurrent(null);
      }
    });
    return () => unsub();
  }, []);

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    await setDoc(doc(db, "announcements", "active"), {
      text: text.trim(),
      url: url.trim() || null,
    });
    setText("");
    setUrl("");
    setSaving(false);
  }

  async function remove() {
    await deleteDoc(doc(db, "announcements", "active"));
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h2>Kunngjøring på forsiden</h2>

      {current && (
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "8px",
          padding: "12px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.82rem", color: "#aaa" }}>Aktiv kunngjøring:</span>
            <strong style={{ color: "#fff", fontSize: "0.95rem" }}>{current.text}</strong>
            {current.url && (
              <span style={{ fontSize: "0.78rem", color: "#666" }}>{current.url}</span>
            )}
          </div>
          <button className="btn-danger btn-sm" onClick={remove}>Fjern</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <label style={{ fontSize: "0.82rem", color: "#aaa" }}>Tekst</label>
        <input
          type="text"
          placeholder='F.eks. "Bli med på dagens konkurranse!"'
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()}
          style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "6px",
            color: "#fff",
            padding: "10px 12px",
            fontSize: "14px",
          }}
        />

        <label style={{ fontSize: "0.82rem", color: "#aaa" }}>Lenke (valgfritt)</label>
        <input
          type="text"
          placeholder="https://..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "6px",
            color: "#fff",
            padding: "10px 12px",
            fontSize: "14px",
          }}
        />

        <button
          className="btn-primary"
          onClick={save}
          disabled={saving || !text.trim()}
          style={{ alignSelf: "flex-start" }}
        >
          {saving ? "Lagrer..." : current ? "Erstatt kunngjøring" : "Publiser"}
        </button>
      </div>
    </section>
  );
}
