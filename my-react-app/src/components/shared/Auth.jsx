import { useState } from 'react'
import { auth, googleProvider } from '../../config/Firebase'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { checkAdmin } from '../../utils/checkAdmin'
import "../../assets/style/loginPage.css"

export default function Auth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  async function handleAfterLogin(user) {
    const isAdmin = await checkAdmin(user.uid)
    navigate(isAdmin ? "/admin" : "/reporter")
  }

  const signInWithGoogle = async () => {
    setError("")
    try {
      const result = await signInWithPopup(auth, googleProvider)
      await handleAfterLogin(result.user)
    } catch {
      setError("Innlogging med Google feilet")
    }
  }

  const signIn = async () => {
    setError("")
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      await handleAfterLogin(result.user)
    } catch {
      setError("Feil e-post eller passord")
    }
  }

  return (
    <section>
      {error && <p className="admin-login-error">{error}</p>}

      <input
        className="login-input"
        placeholder="E-post..."
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="login-input"
        placeholder="Passord..."
        type="password"
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && signIn()}
      />
      <button className="login-btn login-btn--email" onClick={signIn}>
        Logg inn
      </button>
      <button className="login-btn login-btn--google" onClick={signInWithGoogle}>
        Logg inn med Google
      </button>
    </section>
  )
}
