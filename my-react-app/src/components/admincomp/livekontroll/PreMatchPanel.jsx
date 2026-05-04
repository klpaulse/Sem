import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../../config/Firebase";

import PreMatchPoll from "./PreMatchPoll";
import MatchReport from "../../MatchReport";
import EventButtons from "./EventButtons";
import EventForm from "../forms/EventForm";

export default function PreMatchPanel({
  matchId,
  match,
  type,
  setType,
  text,
  setText,
  simpleData,
  setSimpleData,
  addEvent,
}) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!matchId) return;
    const q = query(
      collection(db, "matches", matchId, "events"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [matchId]);

  return (
    <div className="prematch-panel">

      {/* Kun kommentar og bilde før kamp */}
      <EventButtons
        activeType={type}
        onSelect={setType}
        onlyTypes={["comment", "image"]}
      />

      <EventForm
        type={type}
        text={text}
        setText={setText}
        simpleData={simpleData}
        setSimpleData={setSimpleData}
        liveMatch={match}
        homeTeam={null}
        awayTeam={null}
        addEvent={addEvent}
      />

      <PreMatchPoll matchId={matchId} />

      {/* Forhåndsvisning – hva seerne ser */}
      <div className="prematch-section">
        <h3>👁 Forhåndsvisning</h3>
        <MatchReport match={match} events={events} matchId={matchId} />
      </div>
    </div>
  );
}