import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFutbol,
  faSquare,
  faArrowUp,
  faUserInjured,
  faFlag,
  faBullhorn,
  faComment
} from "@fortawesome/free-solid-svg-icons";

import GoalForm from "./GoalForm";
import CardForm from "./CardForm";
import SubForm from "./SubForm";
import WhistleForm from "./WhistleForm";
import SimpleEventForm from "./SimpleEventForm";

export default function EventForm({
  type,
  text,
  setText,
  goalData,
  setGoalData,
  cardData,
  setCardData,
  subData,
  setSubData,
  fkData,
  setFkData,
  liveMatch,
  homeTeam,
  awayTeam,
  addEvent
}) {
  const titles = {
    goal: { icon: faFutbol, label: "Mål" },
    yellow: { icon: faSquare, label: "Gult kort", className: "yellow-card" },
    red: { icon: faSquare, label: "Rødt kort", className: "red-card" },
    sub: { icon: faArrowUp, label: "Spillerbytte" },
    injury: { icon: faUserInjured, label: "Skade" },
    corner: { icon: faFlag, label: "Corner" },
    whistle: { icon: faBullhorn, label: "Frispark" },
    comment: { icon: faComment, label: "Kommentar" }
  };

  const current = titles[type];

  // ⭐ FIXEN SOM STOPPER KRASJ
  if (!homeTeam || !awayTeam) {
    return <div>Laster lag...</div>;
  }

  return (
    <div className="event-form">

      <h4 className="form-title">
        <FontAwesomeIcon icon={current.icon} className={current.className} />
        {current.label}
      </h4>

      {type === "goal" && (
        <GoalForm
          data={goalData}
          setData={setGoalData}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      )}

      {(type === "yellow" || type === "red") && (
        <CardForm
          data={cardData}
          setData={setCardData}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      )}

      {type === "sub" && (
        <SubForm
          data={subData}
          setData={setSubData}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      )}

      {type === "whistle" && (
        <WhistleForm
          data={fkData}
          setData={setFkData}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      )}

      {(type === "corner" || type === "injury" || type === "comment") && (
        <SimpleEventForm
          type={type}
          text={text}
          setText={setText}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      )}

      {type !== "comment" && (
        <textarea
          placeholder="Kommentar (valgfritt)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}

      <button className="submit-event" onClick={addEvent}>
        Legg til hendelse
      </button>
    </div>
  );
}
         