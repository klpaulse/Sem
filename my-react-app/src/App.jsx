
import { Route, Routes } from 'react-router-dom'
import './App.css'

import AdminPage from './pages/AdminPage'
import MatchPage from './pages/MatchPage'
import MatchDetails from './pages/MatchDetails'
import ProtectedRoute from './ProtectedRoute'

import { useEffect, useState } from 'react'
import { db } from './config/Firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import Loginpage from './pages/LoginPage'


function App() {
  const [matches, setMatches] = useState([])

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



  return (
    
    <>
    
    
    <Routes>
      <Route index element={<MatchPage matches={matches}/>} />
      <Route path="/login" element={<Loginpage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="/match/:id" element={<MatchDetails matches={matches} />} />
  
    </Routes>
    </>
  )
}

export default App
