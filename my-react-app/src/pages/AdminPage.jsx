
import {db, auth} from '../config/Firebase'
import { useEffect, useState } from 'react'
import {getDocs, collection, addDoc, deleteDoc, doc} from 'firebase/firestore'
export default function AdminPage(){
    
    
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

return(
    <main>
      <h1>Administrator</h1>
      
      <input placeholder="kamp" onChange={(e) => setNewMatches(e.target.value)} />
      <input
        placeholder="dato"
        type="number"
        onChange={(e) => setNewDate(Number(e.target.value))}
      />
      <button onClick={LeggTilKamp}>Legg ut kamp</button>

      {matches.map((match) => (
        <div key={match.id}>
          <h2>{match.opponent}</h2>
          <p>Dato: {match.date}</p>
          <button onClick={() => deleteMatch(match.id)}>Slett kamp</button>
        </div>
        
      ))}
    </main>
  );
}
