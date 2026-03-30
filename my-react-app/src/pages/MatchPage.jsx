import NextMatch from "../components/NextMatch";
import MatchReport from "../components/MatchReport";
import Tabs from "../components/Tabs";
import MatchFilters from "../components/MatchFilters";
import MatchList from "../components/MatchList";

import {  useRef, useState } from "react";
import useMatchEvents from "../hooks/useMatchEvents";



export default function MatchPage({matches}){
    const [activeTab, setActiveTab] = useState ("rapport")
    
 // Filtre
  const [selectedRound, setSelectedRound] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  //Ref for scroll
  const upcomingRef = useRef(null)

  const hasMatches = matches && matches.length > 0;
  if(!matches || matches.length === 0){
        return <p>Laster kamper...</p>
    }

   
    //Siste spilte kamp (for resultatvisning)
    const played = matches.filter(m => m.homeScore != null);
    const lastPlayed = played.length > 0 
    ? played.sort((a, b) => b.date.toDate() - a.date.toDate())[0]
    : null;


    //Kamp for live rapport ( for test)
    const selectedMatch = matches[0]
    const events = useMatchEvents(selectedMatch);


  //Filtering i kamp-fanen
  const filteredMatches = matches
  .filter ((m) => (selectedRound ? m.round === selectedRound : true))
  .filter((m) => 
  selectedMonth !== null
  ? m.date.toDate().getMonth() === selectedMonth
  : true
)
.filter((m) =>
      selectedTeam
        ? m.homeTeam === selectedTeam || m.awayTeam === selectedTeam
        : true
    );
    



    return(
        <main>
            <h1>SEM IF</h1>
            <img src="https://spond.com/storage/upload/2B18FDF9D6AE99421FD11B8D98F4B2AC/1749751180_0E00D12E/Sem_IF_LOGO.png" />
            <NextMatch matches={matches} />

            {lastPlayed && (
                <>
                <p><strong>{lastPlayed.homeTeam}</strong> {lastPlayed.homeScore} - {lastPlayed.awayScore} <strong>{lastPlayed.awayTeam}</strong></p>
            <p>{lastPlayed.date.toDate().toLocaleDateString("no-NO")}</p>
            </>
            )}

            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} upcomingRef={upcomingRef} />

            
  {/* Hvit boks som bytter innhold */}
      <section
       style={{
        marginTop: "1rem",
        background: "white",
        padding: "1rem",
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
      }}
      >
      
        {activeTab === "rapport" && (
            <MatchReport match={matches[0]} events={events} />
        
        )}

        {activeTab === "kamper" && (
          <>
           <MatchFilters
           selectedRound={selectedRound}
              setSelectedRound={setSelectedRound}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedTeam={selectedTeam}
              setSelectedTeam={setSelectedTeam}
              matches={matches}
            />

             <MatchList
              filteredMatches={filteredMatches}
              matches={matches}
              played={played}
              upcomingRef={upcomingRef}
            />

             
          </>
        )}

        {activeTab === "spillere" && (
          <>
            <h2>Spillere</h2>
            <p>Her kommer spillerlisten.</p>
          </>
        )}

         {activeTab === "nyheter" && (
          <>
            <h2>Nyheter</h2>
            <p>Her kommer nyheter.</p>
          </>
        )}

        {activeTab === "info" && (
          <>
            <h2>Info</h2>
            <p>Her kommer klubbinfo.</p>
          </>
        )}

            </section>

        </main>
    )
}