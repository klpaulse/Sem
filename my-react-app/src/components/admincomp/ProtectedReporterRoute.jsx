import { Navigate, useParams } from "react-router-dom";
import { auth, db } from "../../config/Firebase";
import { useEffect, useState } from "react";
import { checkAdmin } from "../../utils/checkAdmin";
import { doc, getDoc } from "firebase/firestore";

export default function ProtectedReporterRoute({ children, matchId = false }) {
  const [allowed, setAllowed] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    async function check() {
      const user = auth.currentUser;
      if (!user) { setAllowed(false); return; }

      // Admin har alltid tilgang
      const isAdmin = await checkAdmin(user.uid);
      if (isAdmin) { setAllowed(true); return; }

      // Reporter – sjekk om de er lagt til på kampen
      if (matchId && id) {
        const matchSnap = await getDoc(doc(db, "matches", id));
        if (matchSnap.exists()) {
          const reporters = matchSnap.data().reporters || [];
          setAllowed(reporters.includes(user.email));
          return;
        }
      }

      // Reporter uten spesifikk kamp – sjekk om de er reporter for noen kamp
      const { getDocs, collection, query, where } = await import("firebase/firestore");
      const snap = await getDocs(
        query(collection(db, "matches"), where("reporters", "array-contains", user.email))
      );
      setAllowed(!snap.empty);
    }

    check();
  }, [id]);

  if (allowed === null) return <p>Laster...</p>;
  if (!allowed) return <Navigate to="/login" replace />;
  return children;
}