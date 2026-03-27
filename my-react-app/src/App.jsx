
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Auth from './components/Auth'
import AdminPage from './pages/AdminPage'
import MatchPage from './pages/MatchPage'


function App() {


  return (
    
    <>
    <Auth/>
    
    <Routes>
      <Route index element={<MatchPage/>} />
      <Route path="/admin" element={<AdminPage />} />
  
    </Routes>
    </>
  )
}

export default App
