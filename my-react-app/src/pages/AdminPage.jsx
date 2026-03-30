
import {db, auth} from '../config/Firebase'
import { useEffect, useState } from 'react'
import { collection, addDoc, serverTimestamp,  deleteDoc, doc, onSnapshot, Timestamp, updateDoc} from 'firebase/firestore'

export default function AdminPage(){
    const [matches, setMatches]= useState([])
    const [selectedMatch, setSelectedMatch] = useState(null)

    const [location, setLocation] = useState("")
   
    
    //ny kamp states
    const [homeTeam, setHomeTeam]= useState("")
    const[awayTeam, setAwayTeam] = useState("")
    const [date, setDate]= useState("")
    const [time, setTime] =useState("")
    const [day, setDay] = useState("")

    //resultat-skjema
    const [editingMatch, setEditingMatch] = useState(null)
    const [homeScore, setHomeScore] = useState("")
    const [awayScore, setAwayScore] = useState("")

    //Live hendelser
     const [type, setType] = useState("comment")
     const [text, setText] = useState ("")
    
    
    const matchesCollectionRef = collection(db, "matches")

    //Hent alle kamper live
    useEffect(() => {
      const unsubscribe = onSnapshot(matchesCollectionRef, (snapshot) => {
        const data =  snapshot.docs.map((doc) => ({
          ... doc.data(),
          id: doc.id
        }))
        setMatches(data)
      })
      return () => unsubscribe()
    }, [])

    //Beregn minutt basert på startTime
    const calculateMinute = () => {
      if (!matches.startTime) return 0
      const start = matches.startTime.toDate()
      const now = new Date()
      return Math.floor((now - start) / 60000)
    }

    
    //Realtime oppdatering
    useEffect(() => {
    const unsubscribe = onSnapshot (matchesCollectionRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id
    }))
    setMatches(data)
  })
  return() => unsubscribe()
}, [])
     
    
    //Legg til kamp
    const LeggTilKamp = async () => {
      try {
      await addDoc(matchesCollectionRef, {
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        date: Timestamp.fromDate(new Date(date)),
        time: time,
        day: day,
        userId: auth?.currentUser?.uid, 
        homeScore: null,
        awayScore: null,
        played: false,
        startTime: null
        })

        //Tøm inputfeltene etter lagring
        setHomeTeam("")
        setAwayTeam("")
        setDate("")
        setTime("")
        setDay("")
        
    } catch (err) {
      console.error(err)
    }
    }
    
    //Slett kamp
    const deleteMatch = async (id) => {
      const matchDoc = doc(db, "matches",id )
      await deleteDoc(matchDoc)
    }
    
    //Lagre resultat
    const saveResult= async () =>{
      if (!editingMatch) return

      const matchRef = doc(db, "matches", editingMatch.id)
      await updateDoc(matchRef, {
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        played: true
      })
      setEditingMatch(null)
      setHomeScore("")
      setAwayScore("")
}

//start kamp 
const startMatch = async() => {
  if (!selectedMatch) return
  const matchRef = doc(db, "matches", selectedMatch.id)
  await updateDoc(matchRef, {
    startTime: serverTimestamp()
  })
  await addSystemEvent("Kampen har startet ")
}

//Legg til systemhendelser
const addSystemEvent = async(systemText) => {
  if (!selectedMatch) return
  const minute = calculateMinute()
  await addDoc(collection(db, "matches", selectedMatch.id, "events"), {
    type: "system",
    text: systemText, 
    minute, 
    createAt: serverTimestamp()
  })
}

//Legg til vanlige hendelse
const addEvent = async() => {
  if (!selectedMatch) return
  const minute = calculateMinute()
  await addDoc(collection(db, "matches", selectedMatch.id, "events"), {
    type,
    text,
    minute, 
    createAt: serverTimestamp()
  })
  setText("")
}

return(
    <main>
      <h1>Administrator</h1>
      {/*Velg kamp for live hendelser */}
      <h2>Velg kamp for live-oppdatering</h2>
      <select
      value={selectedMatch?.id || ""}
      onChange={(e) =>
        setSelectedMatch(matches.find((m => m.id === e.target.value)))
      }
      >
        <option value="">Velg kamp</option>
        {matches.map((m) => (
          <option key={m.id} value={m.id}>
            {m.homeTeam} vs {m.awayTeam}
          </option>
        ))}
      </select>

      {selectedMatch && (
        <>
        <h3>Live kontroll</h3>
        <button onClick={startMatch}>Start kamp</button>
        <button onClick={() => addSystemEvent("pause")}>Pause</button>
        <button onClick={() => addSystemEvent ("2.omgang har startet")}>2. omgang</button>
        <button onClick={() => addSystemEvent("kampen er slutt")}>Kampslutt</button>

        <h3>Legg til hendelse</h3>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="goal">Mål</option>
          <option value="injury">Skade</option>
          <option value="yellow">Gult kort</option>
          <option value="red">Rødt kort</option>
          <option value="comment">Kommentar</option>
          
        </select>

        <input
        type="text"
        placeholder="Beskrivelse"
        value={text}
        onChange={(e) => setText(e.target.value)} />

        <button onClick={addEvent}>Legg til hendelse</button>
        </>
      )}
      
      {/*Legg til kamp */}
      <h2>Legg til kamp </h2>
      <input placeholder="Hjemmelag"
      value={homeTeam}
       onChange={(e) => setHomeTeam(e.target.value)} />
      <input placeholder="Bortelag"
      value={awayTeam}
       onChange={(e) => setAwayTeam(e.target.value)} />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <input placeholder="dag" 
      value={day}
      onChange={(e) => setDay(e.target.value)} />
      <input
      type="time"
      value={time}
       onChange={(e) => setTime(e.target.value)} />
      <button onClick={LeggTilKamp}>Legg ut kamp</button>

      {/*Resultat-skjema */}
  
      {editingMatch && (
        <section>
        <h2>Legg inn resultat</h2>
        <p>{editingMatch.homeTeam} vs {editingMatch.awayTeam}</p>
        

        <input
        type="number"
        placeholder="Hjemmelag score"
        value={homeScore}
        onChange={(e) => setHomeScore(e.target.value)} />

        <input
        type="number"
        placeholder="Bortelag score"
        value={awayScore}
        onChange={(e) => setAwayScore(e.target.value)} />

        <button onClick={saveResult}>Lagre resultat</button>
        <button onClick={() => setEditingMatch(null)}>Avbryt</button>

        {/*Lokasjon */}
        <input
        placeholder="sted"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        />

</section>
        

      )}
      {/*Liste over kamper */}
      <h2>Alle kamper</h2>

      {matches.map((match) => (
        <div key={match.id}>
          <h2>{match.homeTeam} vs {match.awayTeam}</h2>
          {match.homeScore == null && match.date?.toDate && (
       <p>
        Dato: {match.date.toDate().toLocaleDateString("no-NO")}
        </p>

          )}
            


            {match.homeScore != null ? (
              <p>Resultat: {match.homeScore} - {match.awayScore}</p>
            ) : (
              <button onClick={() => setEditingMatch(match)}>Legg inn resultat</button>
            ) }
          
          <button onClick={() => deleteMatch(match.id)}>Slett kamp</button>
        </div>
        
      ))}
    </main>
  );
}
