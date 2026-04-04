export default function LiveControls({addSystemEvent, startMatch}){
    return(
        <section>
        <h3>Live kontroll</h3>
        <button onClick={startMatch}>Start kamp</button>
        <button onClick={() => addSystemEvent("pause")}>Pause</button>
        <button onClick={() => addSystemEvent ("2.omgang har startet")}>2. omgang</button>
        <button onClick={() => addSystemEvent("kampen er slutt")}>Kampslutt</button>
        </section>
    )
}