import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/Firebase";

import EventForm from "../forms/EventForm";
import EventList from "../EventList";
import AdminQuestions from "../AdminQuestions";
import FormationAdmin from "../formation/FormationAdmin";
import SquadSelector from "../SquadSelector";

import LiveHeader from "./LiveHeader";
import EventButtons from "./EventButtons";
import MatchControls from "./MatchControls";

import { useLiveMatch } from "../livekontroll/useLiveMatch";
import { useMatchTeams } from "../livekontroll/useMatchTeams";
import { useEventActions } from "../livekontroll/useEventActions";

export default function LiveControls({ match, onBack }) {
  if (!match) return <p>Laster kamp...</p>;

  /* -----------------------------
      HOOKS
  ------------------------------ */
  const { liveMatch } = useLiveMatch(match);
  const { homeTeam, awayTeam } = useMatchTeams(match);

  /* -----------------------------
      FANE / FORMASJON
  ------------------------------ */
  const [activeTab, setActiveTab] = useState("events");
  const [formationStep, setFormationStep] = useState("squad");
  const [currentMatch, setCurrentMatch] = useState(match);
  const [formationSaved, setFormationSaved] = useState(false);

  useEffect(() => {
    if (!match?.id) return;
    const ref = doc(db, "matches", match.id, "formations", "home");

    const unsub = onSnapshot(ref, (snap) => {
      setFormationSaved(
        snap.exists() && Object.keys(snap.data()?.positions || {}).length > 0
      );
    });

    return () => unsub();
  }, [match?.id]);

  /* -----------------------------
      SKJEMA-STATE
  ------------------------------ */
  const [type, setType] = useState("goal");
  const [text, setText] = useState("");
  const [goalData, setGoalData] = useState({ team: "", player: "", assist: "" });
  const [cardData, setCardData] = useState({ team: "", player: "" });
  const [subData, setSubData] = useState({ team: "", in: "", out: "", comment: "" });
  const [fkData, setFkData] = useState({ team: "", player: "", comment: "" });
  const [simpleData, setSimpleData] = useState({ team: "", minutes: "", image: null, comment: "" });

  useEffect(() => {
    setText("");
    setSimpleData({ team: "", minutes: "", image: null, comment: "" });
  }, [type]);

  /* -----------------------------
      EVENT ACTIONS
  ------------------------------ */
  const {
    startMatch,
    pauseMatch,
    startSecondHalf,
    endMatch,
    undoLastEvent,
    addEvent: addEventAction,
  } = useEventActions(match, liveMatch);

  function addEvent() {
    const dataMap = {
      goal:      { ...goalData, text },
      yellow:    { ...cardData, text },
      red:       { ...cardData, text },
      sub:       { ...subData },
      whistle:   { ...fkData },
      corner:    { ...simpleData, text },
      injury:    { ...simpleData, text },
      addedTime: { ...simpleData, text },
      comment:   { text },
      image:     { ...simpleData },
    };

    const resetMap = {
      goal:      () => setGoalData({ team: "", player: "", assist: "" }),
      yellow:    () => setCardData({ team: "", player: "" }),
      red:       () => setCardData({ team: "", player: "" }),
      sub:       () => setSubData({ team: "", in: "", out: "", comment: "" }),
      whistle:   () => setFkData({ team: "", player: "", comment: "" }),
      corner:    () => { setSimpleData({ team: "", minutes: "", image: null, comment: "" }); setText(""); },
      injury:    () => { setSimpleData({ team: "", minutes: "", image: null, comment: "" }); setText(""); },
      addedTime: () => { setSimpleData({ team: "", minutes: "", image: null, comment: "" }); setText(""); },
      comment:   () => setText(""),
      image:     () => setSimpleData({ team: "", minutes: "", image: null, comment: "" }),
    };

    addEventAction(type, dataMap[type], setText, resetMap[type]);
  }

  /* -----------------------------
      LASTER
  ------------------------------ */
  if (!liveMatch || !homeTeam || !awayTeam) {
    return <p>Laster kampdata...</p>;
  }

  /* -----------------------------
      RENDER
  ------------------------------ */
  return (
    <div className="live-controls">
      <LiveHeader liveMatch={liveMatch} onBack={onBack} />

      {/* Faner */}
      <div className="live-tabs">
        <button
          className={activeTab === "events" ? "active" : ""}
          onClick={() => setActiveTab("events")}
        >
          Hendelser
        </button>
        <button
          className={activeTab === "formation" ? "active" : ""}
          onClick={() => setActiveTab("formation")}
        >
          Formasjon
        </button>
      </div>

      {/* Hendelser-fanen */}
      {activeTab === "events" && (
        <>
          <EventButtons activeType={type} onSelect={setType} />

          <EventForm
            type={type}
            text={text}
            setText={setText}
            goalData={goalData}
            setGoalData={setGoalData}
            cardData={cardData}
            setCardData={setCardData}
            subData={subData}
            setSubData={setSubData}
            fkData={fkData}
            setFkData={setFkData}
            simpleData={simpleData}
            setSimpleData={setSimpleData}
            liveMatch={liveMatch}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            addEvent={addEvent}
          />

          <MatchControls
            onStart={startMatch}
            onPause={pauseMatch}
            onSecondHalf={startSecondHalf}
            onEnd={endMatch}
            onUndo={undoLastEvent}
            liveMatch={liveMatch}
          />

          <AdminQuestions matchId={match.id} getMinute={useEventActions(match, liveMatch).getMinute} />

          <EventList match={liveMatch} />
        </>
      )}

      {/* Formasjon-fanen */}
      {activeTab === "formation" && (
        <div>
          {formationStep === "squad" && !formationSaved && (
            <SquadSelector
              match={currentMatch}
              onConfirm={(selectedIds) => {
                setCurrentMatch((prev) => ({ ...prev, squad: selectedIds }));
                setFormationStep("formation");
              }}
            />
          )}

          {(formationStep === "formation" || formationSaved) && (
            <FormationAdmin
              match={{
                ...currentMatch,
                homeTeamName: homeTeam?.name,
                awayTeamName: awayTeam?.name,
              }}
              onClose={() => setActiveTab("events")}
            />
          )}
        </div>
      )}
    </div>
  );
}