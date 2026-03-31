
import { Route, Routes } from 'react-router-dom'
import './App.css'

import AdminPage from './pages/AdminPage'
import MatchPage from './pages/MatchPage'
import MatchDetails from './pages/MatchDetails'
import ProtectedRoute from './ProtectedRoute'

import { useEffect, useState } from 'react'
import { db, auth } from './config/Firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import Loginpage from './pages/LoginPage'



function App() {
  const [matches, setMatches] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Hent kamper globalt
  useEffect(() => {
    const matchesRef = collection(db, "matches")

    const unsubscribe = onSnapshot(matchesRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id
      }))
      setMatches(data)
    })

    return () => unsubscribe()
  }, [])

   useEffect(() => {
              const unsub = onAuthStateChanged(auth, (currentUser) => {
                  setUser(currentUser)
                  setLoading(false)
              })
              return () => unsub()
          }, [])
           if (loading) {
        return <p>Laster</p>
    }



  return (
    
    <>
    
    
    <Routes>
      <Route index element={<MatchPage matches={matches}/>} />
      <Route path="/login" element={<Loginpage />} />
      <Route path="/admin"
       element={<ProtectedRoute user={user}>
        <AdminPage /></ProtectedRoute>} />
      <Route path="/match/:id" element={<MatchDetails matches={matches} />} />
  
    </Routes>
   
    </>
  )
}

export default App
