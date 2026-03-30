export default function Upcoming({matches}){
const now = new Date();
const upcoming = matches
.filter(m => {
    if(!m.date) return false

    const baseDate = m.date.toDate? m.date.toDate() : new Date(m.date)
    if(isNaN(baseDate)) return false
    const datePart = baseDate.toISOString().split("T")[0]
    const matchDateTime = new Date(`${datePart}T{m.time}`)

    return matchDateTime >= now
})
.sort((a, b) => {
    const aBase = a.date.to.toDate ? a.date.toDate() : new Date(a.date)
    const bBase = b.date.toDate ? b.date.toDate() : new Date(b.date)

    const aDate = new Date(`${aBase.toISOString().split("T")[0]}T${a.time}`)
    const bDate = new Date(`${bBase.toISOString().split("T")[0]}T${b.time}`)

    return aDate - bDate
})

 const rest = upcoming.slice(1);

 return(
    <section>
        <h2>Kommende kamper</h2>
        {rest.length === 0 & <p> Ingen flere kommende kamper </p>}
        {rest.map((m, index) => {
        const baseDate = m.date.toDate ? m.date.toDate() : new Date(m.date);
        const datePart = baseDate.toISOString().split("T")[0];
        const kampDato = new Date(`${datePart}T${m.time}`);

    
     return (
          <div key={index} style={{ marginBottom: "1rem" }}>
            <p>
              {m.day} {kampDato.toLocaleDateString("no-NO")} – {m.time}
            </p>
            <p>{m.homeTeam} vs {m.awayTeam}</p>
          </div>
        );
      })}
    </section>

 )
}
