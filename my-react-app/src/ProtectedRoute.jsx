import { Navigate } from "react-router-dom";
import { auth } from "./config/Firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { checkAdmin } from "./utils/checkAdmin";

export default function ProtectedRoute({ children }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAllowed(false);
        return;
      }
      const isAdmin = await checkAdmin(user.uid);
      setAllowed(isAdmin);
    });
    return () => unsubscribe();
  }, []);

  if (allowed === null) return <p>Laster...</p>;
  if (!allowed) return <Navigate to="/admin-login" replace />;
  return children;
}
