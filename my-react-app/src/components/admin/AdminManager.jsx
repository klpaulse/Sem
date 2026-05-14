import { useEffect, useState } from "react";
import { db } from "../config/Firebase";
import { collection, getDocs, setDoc, deleteDoc, doc } from "firebase/firestore"

export default function AdminManager(){
    const [admins, setAdmins] = useState([])
    const [uid, setUid] = useState("")

    const loadAdmins = async () => {
    const snap = await getDocs(collection(db, "admins"));
    const list = snap.docs.map(d => ({ id: d.id }));
    setAdmins(list);
  };

  const addAdmin = async () => {
    if (!uid.trim()) return;
    await setDoc(doc(db, "admins", uid.trim()), {});
    setUid("");
    loadAdmins();
  };

  const removeAdmin = async (id) => {
    await deleteDoc(doc(db, "admins", id));
    loadAdmins();
  };

  useEffect(() => {
    loadAdmins();
  }, []);

   return (
    <div style={{ padding: "20px" }}>
      <h1>Adminstyring</h1>

      <h2>Legg til admin</h2>
      <input
        type="text"
        placeholder="Lim inn UID"
        value={uid}
        onChange={(e) => setUid(e.target.value)}
      />
      <button onClick={addAdmin}>Legg til</button>

      <h2>Eksisterende admins</h2>
      <ul>
        {admins.map(a => (
          <li key={a.id}>
            {a.id}
            <button onClick={() => removeAdmin(a.id)}>Fjern</button>
          </li>
        ))}
      </ul>
    </div>
  );


}