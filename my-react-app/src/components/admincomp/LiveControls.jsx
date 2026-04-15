import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc
} from "firebase/firestore";
import { db } from "../../config/Firebase";

import EventForm from "./eventform/EventForm";
import EventList from "./EventList";

import { getTeam } from "../../services/TeamService";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFutbol,
  faSquare,
  faUserInjured,
  faComment,
  faFlag,
  faBullhorn,
  faArrowUp
} from "@fortawesome/free-solid-svg-icons";

export default function LiveControls({ match }) {
  console.log("LIVE CONTROLS MATCH:", match);
console.log("homeTeamId type:", typeof match?.homeTeamId, match?.homeTeamId);
console.log("awayTeamId type:", typeof match?.awayTeamId, match?.awayTeamId);
  if (!match) return <p>Laster kamp...</p>;

  const matchRef = doc(db, "matches", match.id);
  const eventsRef = collection(db, "matches", match.id, "events");

  const [liveMatch, setLiveMatch] = useState(match);

  // ⭐ HENT LAGDATA (ID-basert)
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);

  useEffect(() => {
    async function loadTeams() {
      const home = await getTeam(match.homeTeamId);
      const away = await getTeam(match.awayTeamId);

      setHomeTeam(home);
      setAwayTeam(away);
    }
    loadTeams();
  }, [match]);

  // ⭐ Hendelsestype
  const [type, setType] = useState("goal");
  const [text, setText] = useState("");

  // ⭐ State for skjemaer
  const [goalData, setGoalData] = useState({
    team: "",
    player: "",
    assist: ""
  });

  const [cardData, setCardData] = useState({
    team: "",
    player: ""
  });

  const [subData, setSubData] = useState({
    team: "",
    in: "",
    out: "",
    comment: ""
  });

  const [fkData, setFkData] = useState({
    team: "",
    player: "",
    comment: ""
  });

  // 🔥 Live kampdata
  useEffect(() => {
    if (!match?.id) return;

    const unsub = onSnapshot(matchRef, (snap) => {
      setLiveMatch({ id: snap.id, ...snap.data() });
    });

    return () => unsub();
  }, [match]);

  // ⭐ Nullstill skjema når type endres (FIXED)
  useEffect(() => {
    setText("");

    if (type === "goal") {
      setGoalData({ team: "", player: "", assist: "" });
    }

    if (type === "yellow" || type === "red") {
      setCardData({ team: "", player: "" });
    }

    if (type === "sub") {
      setSubData({ team: "", in: "", out: "", comment: "" });
    }

    if (type === "whistle") {
      setFkData({ team: "", player: "", comment: "" });
    }
  }, [type]);

  // ⭐ Minutt
  function getMinute() {
    if (!liveMatch?.startTime) return 0;
    const start = new Date(liveMatch.startTime);
    const now = new Date();
    return Math.floor((now - start) / 60000);
  }

  // ⭐ Systemhendelser
  async function addSystemEvent(text) {
    await addDoc(eventsRef, {
      id: crypto.randomUUID(),
      type: "system",
      text,
      minute: getMinute(),
      createdAt: serverTimestamp()
    });
  }

  // ⭐ Start kamp
  async function startMatch() {
    await updateDoc(matchRef, {
      status: "live",
      startTime: new Date().toISOString()
    });

    addSystemEvent("Kampen har startet");
  }

  // ⭐ Slutt kamp
  async function endMatch() {
    await updateDoc(matchRef, { status: "finished" });
    addSystemEvent("Kampen er slutt");
  }

  // ⭐ Angre siste hendelse
  async function undoLastEvent() {
    const qSnap = await getDocs(
      query(eventsRef, orderBy("createdAt", "desc"), limit(1))
    );

    if (qSnap.empty) return;

    const last = qSnap.docs[0];
    const data = last.data();

    // Hvis det var mål → trekk fra
    if (data.type === "goal") {
      const newHome =
        data.team === liveMatch.homeTeamId
          ? liveMatch.homeScore - 1
          : liveMatch.homeScore;

      const newAway =
        data.team === liveMatch.awayTeamId
          ? liveMatch.awayScore - 1
          : liveMatch.awayScore;

      await updateDoc(matchRef, {
        homeScore: newHome,
        awayScore: newAway
      });
    }

    await deleteDoc(last.ref);
  }

  // ⭐ Legg til hendelse
  async function addEvent() {
     console.log("ADDEVENT: cardData =", cardData);
    const minute = getMinute();

    // ⭐ MÅL
    if (type === "goal") {
      const newHome =
        goalData.team === liveMatch.homeTeamId
          ? (liveMatch.homeScore || 0) + 1
          : liveMatch.homeScore;

      const newAway =
        goalData.team === liveMatch.awayTeamId
          ? (liveMatch.awayScore || 0) + 1
          : liveMatch.awayScore;

      await updateDoc(matchRef, {
        homeScore: newHome,
        awayScore: newAway
      });

      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "goal",
        team: goalData.team,
        player: goalData.player,
        assist: goalData.assist || null,
        homeScore: newHome,
        awayScore: newAway,
        text,
        minute,
        createdAt: serverTimestamp()
      });

      return;
    }

    // ⭐ KORT
    if (type === "yellow" || type === "red") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type,
        team: cardData.team,
        player: cardData.player,
        text,
        minute,
        createdAt: serverTimestamp()
      });
      return;
    }

    // ⭐ BYTTE
    if (type === "sub") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "sub",
        team: subData.team,
        in: subData.in,
        out: subData.out,
        comment: subData.comment,
        minute,
        createdAt: serverTimestamp()
      });
      return;
    }

    // ⭐ FRISPARK
    if (type === "whistle") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "whistle",
        team: fkData.team,
        player: fkData.player,
        comment: fkData.comment,
        minute,
        createdAt: serverTimestamp()
      });
      return;
    }

    // ⭐ ENKLE HENDELSER
    await addDoc(eventsRef, {
      id: crypto.randomUUID(),
      type,
      text,
      minute,
      createdAt: serverTimestamp()
    });
  }

  const isLive = liveMatch.status === "live";
  const isFinished = liveMatch.status === "finished";

  // ⭐ Ikke vis skjema før lagene er hentet
  if (!homeTeam || !awayTeam) {
    return <p>Laster lag...</p>;
  }

  return (
    <section className="live-controls">

      {/* ⭐ Kampstatus */}
      <div className="match-status-bar">
        <button onClick={startMatch} disabled={isLive || isFinished}>Start</button>
        <button onClick={() => addSystemEvent("Pause")} disabled={!isLive}>Pause</button>
        <button onClick={() => addSystemEvent("2. omgang har startet")} disabled={!isLive}>
          2. omgang
        </button>
        <button onClick={endMatch} disabled={!isLive}>Slutt</button>
        <button onClick={undoLastEvent}>Angre</button>
      </div>

      {/* ⭐ Hendelsesvalg */}
      <div className="event-selector">
        <button onClick={() => setType("goal")}>
          <FontAwesomeIcon icon={faFutbol} /> Mål
        </button>

        <button onClick={() =>{ console.log("TRYKKET: GULT KORT");
 setType("yellow")}}>
          <FontAwesomeIcon icon={faSquare} className="yellow-card" /> Gult kort
        </button>

        <button onClick={() => setType("red")}>
          <FontAwesomeIcon icon={faSquare} className="red-card" /> Rødt kort
        </button>

        <button onClick={() => setType("sub")}>
          <FontAwesomeIcon icon={faArrowUp} /> Bytte
        </button>

        <button onClick={() => setType("injury")}>
          <FontAwesomeIcon icon={faUserInjured} /> Skade
        </button>

        <button onClick={() => setType("corner")}>
          <FontAwesomeIcon icon={faFlag} /> Corner
        </button>

        <button onClick={() => setType("whistle")}>
          <FontAwesomeIcon icon={faBullhorn} /> Frispark
        </button>

        <button onClick={() => setType("comment")}>
          <FontAwesomeIcon icon={faComment} /> Kommentar
        </button>
      </div>

      {/* ⭐ Skjema */}
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
        liveMatch={liveMatch}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        addEvent={addEvent}
      />

      {/* ⭐ Live feed */}
      <div className="report-feed">
        <EventList match={liveMatch} />
      </div>

    </section>
  );
}