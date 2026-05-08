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

  const { liveMatch } = useLiveMatch(match);
  const { homeTeam, awayTeam } = useMatchTeams(match);

  const [activeTab, setActiveTab] = useState("prematch");
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

  const [type, setType] = useState("comment");
  const [text, setText] = useState("");
  const [goalData, setGoalData] = useState({ team: "", player: "", assist: "" });
  const [cardData, setCardData] = useState({ team: "", player: "" });
  const [subData, setSubData] = useState({ team: "", in: "", out: "", comment: "" });
  const [fkData, setFkData] = useState({ team: "", player: "", comment: "" });
  const [simpleData, setSimpleData] = useState({
    team: "",
    minutes: "",
    image: null,
    comment: "",
    options: ["", ""], // ⭐ poll-alternativer
  });

  useEffect(() => {
    setText("");
    setSimpleData({
      team: "",
      minutes: "",
      image: null,
      comment: "",
      options: ["", ""],
    });
  }, [type]);

  const {
    startMatch,
    pauseMatch,
    startSecondHalf,
    endMatch,
    undoLastEvent,
    addEvent: addEventAction,
    getMinute,
  } = useEventActions(match, liveMatch);

  function addEvent() {
    const isPreMatch = liveMatch.status === "not_started";

    const dataMap = {
      goal:      { ...goalData, text },
      yellow:    { ...cardData, text },
      red:       { ...cardData, text },
      sub:       { ...subData },
      whistle:   { ...fkData },
      corner:    { ...simpleData, text },
      injury:    { ...simpleData, text },
      addedTime: { ...simpleData, text },
      comment:   { text, ...(isPreMatch ? { preMatch: true } : {}) },
      image:     { ...simpleData, ...(isPreMatch ? { preMatch: true } : {}) },

      // ⭐ Poll
      poll: {
        question: simpleData.question,
        options: simpleData.options,
        preMatch: isPreMatch,
      },
    };

    const resetMap = {
      goal:      () => setGoalData({ team: "", player: "", assist: "" }),
      yellow:    () => setCardData({ team: "", player: "" }),
      red:       () => setCardData({ team: "", player: "" }),
      sub:       () => setSubData({ team: "", in: "", out: "", comment: "" }),
      whistle:   () => setFkData({ team: "", player: "", comment: "" }),
      corner:    () => { setSimpleData({ team: "", minutes: "", image: null, comment: "", options: ["", ""] }); setText(""); },
      injury:    () => { setSimpleData({ team: "", minutes: "", image: null, comment: "", options: ["", ""] }); setText(""); },
      addedTime: () => { setSimpleData({ team: "", minutes: "", image: null, comment: "", options: ["", ""] }); setText(""); },
      comment:   () => setText(""),
      image:     () => setSimpleData({ team: "", minutes: "", image: null, comment: "", options: ["", ""] }),

      // ⭐ Poll reset
      poll: () => {
        setText("");
        setSimpleData({ options: ["", ""] });
      },
    };

    addEventAction(type, dataMap[type], setText, resetMap[type]);
  }

  if (!liveMatch || !homeTeam || !awayTeam) {
    return <p>Laster kampdata...</p>;
  }

  const isPreMatch = liveMatch.status === "not_started";

  return (
    <div className="live-controls">
      <LiveHeader liveMatch={liveMatch} onBack={onBack} />

      {/* -------------------------------------------------------
          FØR KAMP
      ------------------------------------------------------- */}
      {isPreMatch && (
        <>
          <div className="live-tabs">
            <button
              className={activeTab === "prematch" ? "active" : ""}
              onClick={() => setActiveTab("prematch")}
            >
              Før kampen
            </button>
            <button
              className={activeTab === "formation" ? "active" : ""}
              onClick={() => setActiveTab("formation")}
            >
              Formasjon
            </button>
          </div>

          {activeTab === "prematch" && (
            <>
              <EventButtons
                activeType={type}
                onSelect={setType}
                onlyTypes={["comment", "image", "poll"]} // ⭐ KUN disse før kamp
              />

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

              {/* ⭐ ADMIN SER FØR-KAMP FEED I MATCHREPORT-STIL */}
              <EventList
                match={{
                  ...liveMatch,
                  events: (liveMatch.events || []).filter((e) => e.preMatch === true),
                  polls: (liveMatch.polls || []).filter((p) => p.active),
                }}
                isPreMatch={liveMatch?.status === "not_started"}
              />
            </>
          )}

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
                  onClose={() => setActiveTab("prematch")}
                />
              )}
            </div>
          )}

          <MatchControls
            onStart={() => {
              startMatch();
              setActiveTab("events");
            }}
            onPause={pauseMatch}
            onSecondHalf={startSecondHalf}
            onEnd={endMatch}
            onUndo={undoLastEvent}
            liveMatch={liveMatch}
          />
        </>
      )}

      {/* -------------------------------------------------------
          UNDER KAMP
      ------------------------------------------------------- */}
      {!isPreMatch && (
        <>
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

              <AdminQuestions matchId={match.id} getMinute={getMinute} />

              <EventList match={liveMatch} />
            </>
          )}

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
        </>
      )}
    </div>
  );
}
