import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../config/Firebase";

export default function SponsorAdmin() {
  const [sponsors, setSponsors] = useState([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editLogoFile, setEditLogoFile] = useState(null);
  const addLogoRef = useRef(null);
  const editLogoRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "sponsors"), snap => {
      setSponsors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  async function uploadLogo(file, name) {
    const fileRef = ref(storage, `sponsors/${Date.now()}_${name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  }

  async function addSponsor() {
    if (!name.trim() || !url.trim()) return;
    setSaving(true);
    try {
      let logoUrl = null;
      if (logoFile) logoUrl = await uploadLogo(logoFile, name);
      await addDoc(collection(db, "sponsors"), {
        name: name.trim(),
        url: url.trim(),
        tagline: tagline.trim() || null,
        logoUrl,
        active: true,
      });
      setName(""); setUrl(""); setTagline(""); setLogoFile(null);
      if (addLogoRef.current) addLogoRef.current.value = "";
    } finally {
      setSaving(false);
    }
  }

  async function saveSponsor(sponsor) {
    setSaving(true);
    try {
      let logoUrl = sponsor.logoUrl;
      if (editLogoFile) logoUrl = await uploadLogo(editLogoFile, editName);
      await updateDoc(doc(db, "sponsors", sponsor.id), {
        name: editName.trim(),
        url: editUrl.trim(),
        tagline: editTagline.trim() || null,
        logoUrl,
      });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(sponsor) {
    await updateDoc(doc(db, "sponsors", sponsor.id), { active: !sponsor.active });
  }

  async function removeSponsor(id) {
    await deleteDoc(doc(db, "sponsors", id));
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2>Sponsorer / Samarbeidspartnere</h2>

      {/* Eksisterende sponsorer */}
      {sponsors.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sponsors.map(s => (
            <div key={s.id} style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${s.active ? "rgba(46,204,113,0.25)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: "8px",
              overflow: "hidden",
            }}>
              {editingId === s.id ? (
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    placeholder="Navn"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Nettside (https://...)"
                    value={editUrl}
                    onChange={e => setEditUrl(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Slagord (valgfritt)"
                    value={editTagline}
                    onChange={e => setEditTagline(e.target.value)}
                    style={inputStyle}
                  />
                  <div>
                    <input
                      ref={editLogoRef}
                      type="file"
                      accept="image/*,image/heic,image/heif"
                      style={{ display: "none" }}
                      onChange={e => setEditLogoFile(e.target.files[0] || null)}
                    />
                    <button type="button" className="lagadmin-file-btn" onClick={() => editLogoRef.current?.click()}>
                      {editLogoFile ? "✓ " + editLogoFile.name : "Bytt logo"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn-primary btn-sm" onClick={() => saveSponsor(s)} disabled={saving}>
                      {saving ? "Lagrer..." : "Lagre"}
                    </button>
                    <button className="btn-secondary btn-sm" onClick={() => setEditingId(null)}>Avbryt</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px" }}>
                  {s.logoUrl && (
                    <img src={s.logoUrl} alt={s.name} style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "4px", background: "#fff", padding: "2px", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: s.active ? "#fff" : "#666", fontSize: "0.9rem" }}>{s.name}</div>
                    {s.tagline && <div style={{ fontSize: "0.75rem", color: "#888" }}>{s.tagline}</div>}
                    <div style={{ fontSize: "0.72rem", color: "#555" }}>{s.url}</div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button
                      className="btn-secondary btn-sm"
                      style={{ color: s.active ? "#2ecc71" : "#888", borderColor: s.active ? "rgba(46,204,113,0.4)" : undefined }}
                      onClick={() => toggleActive(s)}
                    >
                      {s.active ? "Aktiv" : "Inaktiv"}
                    </button>
                    <button className="btn-secondary btn-sm" onClick={() => {
                      setEditingId(s.id);
                      setEditName(s.name);
                      setEditUrl(s.url);
                      setEditTagline(s.tagline || "");
                      setEditLogoFile(null);
                    }}>Rediger</button>
                    <button className="btn-danger btn-sm" onClick={() => removeSponsor(s.id)}>Slett</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legg til ny sponsor */}
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
          Legg til sponsor
        </h4>
        <input placeholder="Navn på bedrift *" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        <input placeholder="Nettside (https://...) *" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
        <input placeholder="Slagord, f.eks. «Vår lokale samarbeidspartner»" value={tagline} onChange={e => setTagline(e.target.value)} style={inputStyle} />
        <div>
          <input
            ref={addLogoRef}
            type="file"
            accept="image/*,image/heic,image/heif"
            style={{ display: "none" }}
            onChange={e => setLogoFile(e.target.files[0] || null)}
          />
          <button type="button" className="lagadmin-file-btn" onClick={() => addLogoRef.current?.click()}>
            {logoFile ? "✓ " + logoFile.name : "Last opp logo (valgfritt)"}
          </button>
        </div>
        <button
          className="btn-primary"
          onClick={addSponsor}
          disabled={saving || !name.trim() || !url.trim()}
          style={{ alignSelf: "flex-start" }}
        >
          {saving ? "Lagrer..." : "Legg til"}
        </button>
      </div>
    </section>
  );
}

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
