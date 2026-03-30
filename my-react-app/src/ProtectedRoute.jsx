import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {auth} from "./config/Firebase"

export default function ProtectedRoute({children}){
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(null)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser)
            setLoading(false)
        })

        return() => unsub()
    }, [])
    if (loading) {
        return <p>Laster</p>
    }
    if(!user){
        return <Navigate to="/login" replace />
    }

    return children

}