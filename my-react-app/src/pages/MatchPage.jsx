import NextMatch from "../components/NextMatch";
import MatchReport from "../components/MatchReport";
import Tabs from "../components/Tabs";
import MatchFilters from "../components/MatchFilters";
import MatchList from "../components/MatchList";
import "../assets/style/matchPage.css";
import semifLogo from "../assets/Semif-logo.png"

import { useEffect, useState, useRef} from "react"
import { collection,  onSnapshot, query, orderBy } from "firebase/firestore";
import {db} from "../config/Firebase"


export default function MatchPage({matches}){
    const [activeTab, setActiveTab] = useState ("rapport")
     const [events, setEvents] = useState([]);

 // Filtre
  const [selectedRound, setSelectedRound] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  //Ref for scroll
  const upcomingRef = useRef(null)

  const hasMatches = matches && matches.length > 0;
  

   
    //Siste spilte kamp (for resultatvisning)
    const played = matches.filter(m => m.homeScore != null);
    const lastPlayed = played.length > 0 
    ? played.sort((a, b) => b.date.toDate() - a.date.toDate())[0]
    : null;


    //Kamp for live rapport ( for test)
    const selectedMatch = matches[0]
  


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
    useEffect(() => {
    if (!selectedMatch) return;

    const q = query(
      collection(db, "matches", selectedMatch.id, "events"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(list);
    });

    return () => unsub();
  }, [selectedMatch]);

if(!matches || matches.length === 0){
        return <p>Laster kamper...</p>
    }
    



    return(
        <>
        <header className="header">
            <h1 className="SEM">SEM IF</h1>
            <img className="semif-logo" src={semifLogo} alt="SEM IF logo" />
            </header>
            
            <NextMatch matches={matches} />
            

            {lastPlayed && (
                <section className="last-played-card">
                <p className="lp-status">Slutt</p>
                 <div className="lp-row">
                <span className="lp-title">{lastPlayed.homeTeam}</span>
                <p className="lp-result"> {lastPlayed.homeScore} - {lastPlayed.awayScore} </p>
                <span className="lp-title">{lastPlayed.awayTeam}</span>
              </div>

              <div className="lp-goals">
                {lastPlayed.goals?.map((g, i) => (
                  <p key={i} className="lp-goal-item">
                    {g.player} {g.minute}
                  </p>
                ))}
               </div>

            <p className="lp-date">{lastPlayed.date.toDate().toLocaleDateString("no-NO")}</p>
            </section>
            )}

            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} upcomingRef={upcomingRef} />

            
  
      <section className="content-box">
      
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

        </>
    )
}