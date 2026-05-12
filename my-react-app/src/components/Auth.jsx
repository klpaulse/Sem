import { useState } from 'react'
import { auth, googleProvider } from '../config/Firebase'
import { signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { checkAdmin } from '../utils/checkAdmin'

export default function Auth() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate()
    const ADMIN_EMAILS = ["lovise_paulsen@hotmail.com"]

    async function handleAfterLogin(user) {
  const isAdmin = await checkAdmin(user.uid);
  if (isAdmin) {
    navigate("/admin");
  } else {
    navigate("/reporter");
  }
}

    const signIn = async () => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password)
            await handleAfterLogin(result.user)
        } catch (err) {
            alert(err.message)
        }
    }

    const signInWithGoogle = async () => {
        try {
           const result = await signInWithPopup(auth, googleProvider)
            await handleAfterLogin(result.user)
        } catch (err) {
            console.error(err)
        }
    }

    const logout = async () => {
        try {
            await signOut(auth)
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <section>
            <input placeholder="Email..." onChange={(e) => setEmail(e.target.value)} />
            <input placeholder="Password.." type="password" onChange={(e) => setPassword(e.target.value)} />
            <button onClick={signIn}>Logg inn</button>
            <button onClick={signInWithGoogle}>Logg inn med Google</button>
            <button onClick={logout}>Logg ut</button>
        </section>
    )
}