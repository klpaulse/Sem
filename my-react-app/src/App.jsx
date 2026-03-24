
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Auth from './components/Auth'
import {db, auth} from './config/Firebase'
import { useEffect, useState } from 'react'
import {getDocs, collection, addDoc, deleteDoc, doc} from 'firebase/firestore'

function App() {
const [matches, setMatches]= useState([])

//ny kamp states
const [newMatches, setNewMatches]= useState("")
const [newDate, setNewDate]= useState(0)


const matchesCollectionRef = collection(db, "matches")

useEffect(() => {
const getMatches= async () => {
  try{
  const data = await getDocs(matchesCollectionRef)
  const filteredData = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
  setMatches(filteredData)
}catch (err){
  console.error(err)
}
}
getMatches()
}, [])

const LeggTilKamp = async () => {
  try {
  await addDoc(matchesCollectionRef, {
    opponent: newMatches,
     date: newDate,
     userId: auth?.currentUser?.uid, 
    })
    setMatches()
} catch (err) {
  console.error(err)
}
}

const deleteMatch = async (id) => {
  const matchDoc = doc(db, "matches",id )
  await deleteDoc(matchDoc)
}

const updateMatchName = async () =>{

}

  return (
    
    <><Auth/>
    <>
    <input placeholder="kamp" onChange={(e) => setNewMatches(e.target.value)}></input>
    <input placeholder="dato" type="number" onChange={(e) => setNewDate(number(e.target.value))}></input>
    <button onClick={LeggTilKamp}>legg ut kamp</button>
    </>
  
      {matches.map((matches) => (
        <>
        <h1>{matches.opponent}</h1>
        <p>Dato: {matches.date}</p>

        <button onClick={() => deleteMatch(matches.id)}>Slett kamp</button>

       

        </>
      ))}
    

    <Routes>
      <Route index element={<h1>hei</h1>} />
      <Route path=":movie" element={<h1>hade</h1>} />
  
    </Routes>
    </>
  )
}

export default App
