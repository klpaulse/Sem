
import { Navigate } from "react-router-dom";
import { auth } from "./config/Firebase";
import { useEffect, useState } from "react";
import { checkAdmin } from "./utils/checkAdmin";

export default function ProtectedRoute({children}){
    const [allowed, setAllowed] = useState(null)
    
useEffect(() => {
    const user = auth.currentUser

    if (!user) {
      setAllowed(false);
      return;
    }
    checkAdmin(user.uid).then(isAdmin => {
      setAllowed(isAdmin);
    });
  }, []);
  if (allowed === null) {
    return <p>Laster...</p>;
  }

    if(!allowed){
        return <Navigate to="/login" replace />
    }

    return children

}