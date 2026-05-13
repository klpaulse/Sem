import { useState } from 'react'
import { auth } from '../config/Firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { checkAdmin } from '../utils/checkAdmin'
import "../assets/style/adminLogin.css"
import "../assets/style/loginPage.css"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const signIn = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const isAdmin = await checkAdmin(result.user.uid)
      if (isAdmin) {
        navigate("/admin")
      } else {
        setError("Du har ikke administratortilgang")
      }
    } catch (err) {
      setError("Feil e-post eller passord")
    }
  }

  return (
    <main className="admin-login-page">
      <h1 className="live-header">Breddefotball Live</h1>
      <div className="admin-login-card">
        <h2>Admin</h2>
        <p>Kun for administratorer</p>

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
        <button
          className="login-btn login-btn--email"
          onClick={signIn}
        >
          Logg inn som admin
        </button>
      </div>
    </main>
  )
}