export default function NextMatch({matches}){
    if(!matches ||  matches.length === 0){
        return <p>Ingen kamper lagt til ennå.</p>
    }

    const next=[...matches].sort((a, b) => a.date - b.date)[0]
    return(
        <section>
          <h3>{next.opponent}</h3> 
          <p>Dato: {next.date}</p> 
        </section>
    )
}