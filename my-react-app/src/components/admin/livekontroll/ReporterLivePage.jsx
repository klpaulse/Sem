import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/Firebase";
import LiveControls from "./LiveControls";


export default function ReporterLivePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);

  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "matches", id);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setMatch({ id: snap.id, ...snap.data() });
      }
    });
    return () => unsub();
  }, [id]);

  if (!match) return <p>Laster kamp...</p>;

  return (
    <LiveControls
      match={match}
      onBack={() => navigate("/reporter")}
    />
  );
}