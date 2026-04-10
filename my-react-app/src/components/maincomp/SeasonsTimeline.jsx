import { getMatchOutcome } from "../../services/MatchService"

export default function SeasonTimeline({matches, teamId, currentMatchId}){
    return(
        <div className="timeline-container">
            {matches.map((m) => {
                const outcome = getMatchOutcome(m, teamId)
                const goalFor =
                m.homeTeamId === teamId ? m.homeScore : m.awayScore
                const goalsAgainst = 
                m.homeTeamId === teamId ? m.awayScore : m.homeScore

                const isCurrent = m.id === currentMatchId


                return (
                    <div
                    key={m.id}
                    className={`timeline-box form-${outcome} ${
              isCurrent ? "timeline-current" : ""
            }`}
            >
                <span className="timeline-result">
                    {goalFor}-{goalsAgainst}
                </span>
                </div>
                )
            })}
        </div>
    )
}