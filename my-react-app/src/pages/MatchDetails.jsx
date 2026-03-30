import { Link, useParams } from "react-router-dom";

export default function MatchDetails({matches}){
    const {id} = useParams()

    if(!matches || matches.length === 0) {
        return <p>Laster kamp...</p>
    }

    const match = matches.find(m => m.id === id)
    if(!match){
        return <p>Kamp ikke funnet</p>
    }

    const date = match.date?.toDate
    ? match.date.toDate().toLocaleDateString("no-NO")
    : "Ukjent dato";


    return(
        <main>
     <h1>{match.homeTeam} vs {match.awayTeam}</h1>

    <p>Dato: {date}</p>
      <p>Tid: {match.time}</p>
      <p>Dag: {match.day}</p>

      <h3>Spillested</h3>
      <p>{match.location || "Ikke oppgitt"}</p>
      <Link to ="/">
      <button>Tilbake</button>
      </Link>

        </main>
    )
}