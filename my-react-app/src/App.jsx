import { Route, Routes, useLocation } from 'react-router-dom'
import './App.css'

import AdminPage from './pages/AdminPage'
import MatchPage from './pages/MatchPage'

import { useEffect, useState } from 'react'
import { db, auth } from './config/Firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage'
import LiveControls from './components/admin/livekontroll/LiveControls.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import ProtectedReporterRoute from './components/admin/ProtectedReporterRoute.jsx'
import ReporterPage from './components/admin/ReporterPage.jsx'
import ReporterLivePage from './components/admin/livekontroll/ReporterLivePage.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import TeamPage from './pages/TeamPage.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import ReactGA from "react-ga4"
import Footer from './components/shared/Footer.jsx'

function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
  ReactGA.send({
    hitType: "pageview",
    page: location.pathname
  })
  }, [location])
  return null
}

function App() {
  const [matches, setMatches] = useState([])
  const [divisions, setDivisions] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const location = useLocation()

  // LIVE: hent kamper
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

  // LIVE: hent divisjoner basert på lag
  useEffect(() => {
    const teamsRef = collection(db, "teams")

    const unsubscribe = onSnapshot(teamsRef, (snapshot) => {
      const allTeams = snapshot.docs.map((doc) => doc.data())
      const uniqueDivs = [...new Set(allTeams.map((t) => t.division))]
      uniqueDivs.sort()
      setDivisions(uniqueDivs)
    })

    return () => unsubscribe()
  }, [])

  // Auth
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
      <ErrorBoundary>
        <Routes>
          <Route
            index
            element={<HomePage matches={matches} divisions={divisions} />}
          />

          {/* Tving remount når URL endrer seg */}
          <Route
            path="/match/:slug"
            element={<MatchPage key={location.key} />}
          />

          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage matches={matches} divisions={divisions} />
              </ProtectedRoute>
            }
          />

          <Route path="/reporter" element={
             <ProtectedReporterRoute>
              <ReporterPage matches={matches} />
          </ProtectedReporterRoute>}
          />

          <Route path="/reporter/live/:id" element={
            <ProtectedReporterRoute matchId={true}>
              <ReporterLivePage/>
            </ProtectedReporterRoute>
          } />

          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/lag/:slug" element={<TeamPage />} />

        </Routes>
        <Footer />
      </ErrorBoundary>
    </>
  )
}
export {AnalyticsTracker}
export default App

