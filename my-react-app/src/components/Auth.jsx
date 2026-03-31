import { useState } from 'react'
import {auth, googleProvider} from '../config/Firebase'
import {signInWithEmailAndPassword, signInWithPopup, signOut} from 'firebase/auth'

export default function Auth(){
    const [email, setEmail] =useState("")
    const[password, setPassword]=useState("")

   

    const signIn = async () =>{
        try{
        await signInWithEmailAndPassword(auth, email, password)
        }catch (err) {
              alert(err.message)
            console.error(err)
        }

    }
     const signInWithGoogle = async () =>{
        try{
        await signInWithPopup(auth, googleProvider)
        }catch (err) {
            console.error(err)
        }

    }
    const logout = async () =>{
        try{
        await signOut(auth)
        }catch (err) {
            console.error(err)
        }

    }


    return(
        <section>
        <input placeholder="Email..." onChange={(e) => setEmail(e.target.value)}></input>
        <input placeholder="Password.."type="password" onChange={(e) => setPassword(e.target.value)}></input>
        <button onClick={signIn}>Logg inn</button>
        <button onClick={signInWithGoogle}>Logg inn med Google</button>
        <button onClick={logout}>Logg ut</button>
        </section>
        
    )
}