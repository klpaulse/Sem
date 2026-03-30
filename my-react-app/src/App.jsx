
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Auth from './components/Auth'
import AdminPage from './pages/AdminPage'
import MatchPage from './pages/MatchPage'
import MatchDetails from './pages/MatchDetails'

import { useEffect, useState } from 'react'
import { db } from './config/Firebase'
import { collection, onSnapshot } from 'firebase/firestore'

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
    <Auth/>
    
    <Routes>
      <Route index element={<MatchPage matches={matches}/>} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/match/:id" element={<MatchDetails matches={matches} />} />
  
    </Routes>
    </>
  )
}

export default App
