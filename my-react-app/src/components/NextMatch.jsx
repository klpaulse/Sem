import { Link } from "react-router-dom";
import Countdown from "./Countdown"

export default function NextMatch({matches}){
    if(!matches || matches.length === 0) {
        return <p>Ingen kamper lagt til ennå.</p>
    }
    
const now = new Date()

const upcoming = matches.filter(m => {
    if (!m.date) return false

    const baseDate = m.date.toDate ? m.date.toDate() : new Date(m.date);
    if(isNaN(baseDate)) return false

    const datePart = baseDate.toISOString().split("T")[0];
    const matchDateTime = new Date(`${datePart}T${m.time}`);
    return matchDateTime >= now;
  });

if (upcoming.length === 0){
    return <p>Ingen kommende kamper</p>
}
 const sorted = upcoming.sort((a, b) => {
    const aBase = a.date.toDate ? a.date.toDate() : new Date(a.date);
    const bBase = b.date.toDate ? b.date.toDate() : new Date(b.date);

    const aDate = new Date(`${aBase.toISOString().split("T")[0]}T${a.time}`);
    const bDate = new Date(`${bBase.toISOString().split("T")[0]}T${b.time}`);
    return aDate - bDate
  });

 const next= sorted[0]

 const nextBase = next.date.toDate ? next.date.toDate() : new Date(next.date);
const datePart = nextBase.toISOString().split("T")[0];
 const kampDato = new Date(`${datePart}T${next.time}`);



 
    
    return(
        <>
        <section className="next-match">
          <h2 className="match-title">{next.homeTeam} - {next.awayTeam}</h2> 
          <p className="dato"> {next.day} {kampDato.toLocaleDateString("no-NO")}-kl {next.time}</p> 

       
        <Countdown 
        date={next.date}
        time={next.time}
        />
    
       <div className="knapp-linje">
        <Link to={`/match/${next.id}`}>
        <button className="knapp-kampdetaljer">Se kampdetaljer</button>
        </Link>
        </div>

        </section>
        </>
    )
}