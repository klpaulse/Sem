import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/Firebase";

const inputStyle = {
  background: "#1a1a1a", border: "1px solid #333", borderRadius: "6px",
  color: "#fff", padding: "9px 12px", fontSize: "14px",
  width: "100%", boxSizing: "border-box",
};

export default function PushAdmin() {
  const [tokenCount, setTokenCount] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "fcm_tokens"), snap => {
      setTokenCount(snap.size);
    });
    return () => unsub();
  }, []);

  async function sendNotification() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    try {
      // Cloud Function plukker opp denne og sender til alle tokens
      await addDoc(collection(db, "notifications_queue"), {
        title: title.trim(),
        body: body.trim(),
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setBody("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } finally {
      setSending(false);
    }
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2>Push-varsler</h2>

      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <span style={{ fontSize: "1.4rem" }}>🔔</span>
        <div>
          <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.9rem" }}>
            {tokenCount === null ? "Laster..." : `${tokenCount} abonnent${tokenCount !== 1 ? "er" : ""}`}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#555", marginTop: "2px" }}>
            enheter som har slått på push-varsler
          </div>
        </div>
      </div>

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
          Send manuell varsling
        </h4>
        <input placeholder="Tittel *" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
        <input placeholder="Melding *" value={body} onChange={e => setBody(e.target.value)} style={inputStyle} />

        {sent && <p style={{ color: "#2ecc71", fontSize: "0.82rem", margin: 0 }}>✓ Varsling sendt til alle abonnenter.</p>}

        <button
          className="btn-primary"
          onClick={sendNotification}
          disabled={sending || !title.trim() || !body.trim()}
          style={{ alignSelf: "flex-start" }}
        >
          {sending ? "Sender..." : "Send til alle"}
        </button>
      </div>
    </section>
  );
}
