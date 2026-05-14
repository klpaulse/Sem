import { useEffect, useState } from 'react'
import { auth, googleProvider } from '../config/Firebase'
import { 
    signInWithEmailAndPassword, 
    signInWithPopup 
} from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { checkAdmin } from '../utils/checkAdmin'
import "../assets/style/loginPage.css"

export default function Auth() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate()

    async function handleAfterLogin(user) {
        const isAdmin = await checkAdmin(user.uid)
        if (isAdmin) {
            navigate("/admin")
        } else {
            navigate("/reporter")
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
    

    // Email + passord login
    const signIn = async () => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password)
            await handleAfterLogin(result.user)
        } catch (err) {
            alert(err.message)
        }
    }



    return (
        <section>
            <input 
                className="login-input"
                placeholder="Email..." 
                onChange={(e) => setEmail(e.target.value)} 
            />

            <input 
                className="login-input"
                placeholder="Password.." 
                type="password" 
                onChange={(e) => setPassword(e.target.value)} 
            />

            <button 
                className="login-btn login-btn--email" 
                onClick={signIn}
            >
                Logg inn
            </button>

            <button 
                className="login-btn login-btn--google"
                onClick={signInWithGoogle}
            >
                Logg inn med Google
            </button>
        </section>
    )
}
