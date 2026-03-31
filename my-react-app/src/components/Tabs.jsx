export default function Tabs({activeTab, setActiveTab, upcomingRef}){
return(
    <nav className="nav">
        <button className="nav-btn" onClick={() => setActiveTab("rapport")}>Rapport</button>
        <button className="nav-btn" onClick={() => {
         setActiveTab("kamper")
        setTimeout(() => {
        upcomingRef.current?.scrollIntoView({behavior: "smooth"})
         }, 50)
         }}>
            Kamper</button>
        <button className="nav-btn" onClick={() => setActiveTab("spillere")}>Spillere</button>
        <button className="nav-btn" onClick={() => setActiveTab("nyheter")}>Nyheter</button>
        <button className="nav-btn" onClick={() => setActiveTab("info")}>Info</button>
      </nav>
)
}