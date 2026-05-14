import { Navigate, useParams } from "react-router-dom";
import { auth, db } from "../../config/Firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { checkAdmin } from "../../utils/checkAdmin";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";

export default function ProtectedReporterRoute({ children, matchId = false }) {
  const [allowed, setAllowed] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { setAllowed(false); return; }

      const isAdmin = await checkAdmin(user.uid);
      if (isAdmin) { setAllowed(true); return; }

      if (matchId && id) {
        const matchSnap = await getDoc(doc(db, "matches", id));
        if (matchSnap.exists()) {
          const reporters = matchSnap.data().reporters || [];
          setAllowed(reporters.includes(user.email));
          return;
        }
      }

      const snap = await getDocs(
        query(collection(db, "matches"), where("reporters", "array-contains", user.email))
      );
      setAllowed(!snap.empty);
    });

    return () => unsubscribe();
  }, [id]);

  if (allowed === null) return <p>Laster...</p>;
  if (!allowed) return <Navigate to="/login" replace />;
  return children;
}
