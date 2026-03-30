export default function Tabs({activeTab, setActiveTab, upcomingRef}){
return(
    <nav style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <button onClick={() => setActiveTab("rapport")}>Rapport</button>
        <button onClick={() => {
         setActiveTab("kamper")
        setTimeout(() => {
        upcomingRef.current?.scrollIntoView({behavior: "smooth"})
         }, 50)
         }}>
            Kamper</button>
        <button onClick={() => setActiveTab("spillere")}>Spillere</button>
        <button onClick={() => setActiveTab("nyheter")}>Nyheter</button>
        <button onClick={() => setActiveTab("info")}>Info</button>
      </nav>
)
}