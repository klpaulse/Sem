import Countdown from "../Countdown";
import "../../assets/style/matchPage.css";
import BeforeMatchInfo from "./BeforeMatchInfo";

export default function BeforeMatch({ match, allMatches }) {
  if (!match) return null;

  const matchDate = match.date instanceof Date  ? match.date : match.date.toDate()
 
  return (
  
    <section className="page" >
    <h1 className="live-header">
      Breddefotball Live
   </h1>

        {/* Countdown */}
      <div className="countdown">
        <Countdown date={new Date(matchDate)} />
      </div>
       {/* Knapp */}
      <button className="knapp-kampdetaljer">
        Se kampdetaljer
      </button>
      
      <div className="last-played-card">
      {/* Lagene – uten strek */}
      <div className="lp-row">
        <span className="lp-title">{match.homeTeamName}</span>
        <span className="lp-title">{match.awayTeamName}</span>
      </div>

      {/* Klokkeslett */}
       <p className="dato">
  {match.time || matchDate.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })}
</p>
</div>
 <BeforeMatchInfo match={match} allMatches={allMatches} />
    </section>

  );
}