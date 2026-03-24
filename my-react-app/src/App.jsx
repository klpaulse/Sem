
import { Route, Routes } from 'react-router-dom'
import './App.css'

function App() {


  return (
    <Routes>
      <Route index element={<h1>hei</h1>} />
      <Route path=":movie" element={<h1>hade</h1>} />
  
    </Routes>
  )
}

export default App
