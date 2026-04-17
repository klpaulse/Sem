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
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../config/Firebase";
import { storage } from "../../config/Firebase";

import EventForm from "./forms/EventForm";
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
  faArrowUp,
  faClock,
  faImage
} from "@fortawesome/free-solid-svg-icons";

export default function LiveControls({ match }) {
  if (!match) return <p>Laster kamp...</p>;

  const matchRef = doc(db, "matches", match.id);
  const eventsRef = collection(db, "matches", match.id, "events");

  // ⭐ Live kampdata
  const [liveMatch, setLiveMatch] = useState(null);

  useEffect(() => {
    if (!match?.id) return;

    const unsub = onSnapshot(matchRef, (snap) => {
      setLiveMatch({ id: snap.id, ...snap.data() });
    });

    return () => unsub();
  }, [match.id]);

  // ⭐ Hent lag
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
  }, [match.homeTeamId, match.awayTeamId]);

  // ⭐ Hendelsestype
  const [type, setType] = useState("goal");
  const [text, setText] = useState("");

  // ⭐ Skjema-state
  const [goalData, setGoalData] = useState({ team: "", player: "", assist: "" });
  const [cardData, setCardData] = useState({ team: "", player: "" });
  const [subData, setSubData] = useState({ team: "", in: "", out: "", comment: "" });
  const [fkData, setFkData] = useState({ team: "", player: "", comment: "" });

  // ⭐ Simple events (corner, injury, comment, addedTime)
  const [simpleData, setSimpleData] = useState({ team: "", minutes: "", image: null });

  // ⭐ Nullstill skjema når type endres
  useEffect(() => {
    setText("");
    setSimpleData({ team: "", minutes: "", image: null });
  }, [type]);

  // ⭐ Minutt
  function getMinute() {
    if (!liveMatch?.startTime) return 0;
    const start = new Date(liveMatch.startTime);
    const now = new Date();
    return Math.floor((now - start) / 60000);
  }

  // ⭐ Last opp bilde
  async function uploadImage(file) {
    if (!file) return null;

    const imageRef = ref(storage, `matchImages/${match.id}/${Date.now()}-${file.name}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
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
      startTime: new Date().toISOString(),
      secondHalfStarted: false
    });

    addSystemEvent("Kampen har startet");
  }

  // ⭐ Pause
  async function pauseMatch() {
    await updateDoc(matchRef, { paused: true });
    addSystemEvent("Pause");
  }

  // ⭐ Start 2. omgang
  async function startSecondHalf() {
    await updateDoc(matchRef, {
      paused: false,
      secondHalfStarted: true
    });
    addSystemEvent("2. omgang har startet");
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
    const minute = getMinute();

    // ⭐ Last opp bilde hvis valgt
    const imageUrl = await uploadImage(simpleData.image);

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
        imageUrl,
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
        imageUrl,
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
        imageUrl,
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
        imageUrl,
        minute,
        createdAt: serverTimestamp()
      });
      return;
    }

    // ⭐ CORNER / INJURY
    if (type === "corner" || type === "injury") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type,
        team: simpleData.team,
        text,
        imageUrl,
        minute,
        createdAt: serverTimestamp()
      });
      return;
    }

    // ⭐ TILLEGGSTID
    if (type === "addedTime") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "addedTime",
        minutes: simpleData.minutes,
        text,
        imageUrl,
        minute,
        createdAt: serverTimestamp()
      });
      return;
    }

    // ⭐ COMMENT
    if (type === "comment") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "comment",
        text,
        imageUrl,
        minute,
        createdAt: serverTimestamp()
      });
      return;
    }
  }

  if (!liveMatch || !homeTeam || !awayTeam) {
    return <p>Laster kampdata...</p>;
  }

  const isLive = liveMatch.status === "live";
  const isFinished = liveMatch.status === "finished";

  return (
    <section className="live-controls">

      {/* ⭐ Kampstatus */}
      <div className="match-status-bar">
        <button onClick={startMatch} disabled={isLive || isFinished}>Start</button>
        <button onClick={pauseMatch} disabled={!isLive}>Pause</button>
        <button onClick={startSecondHalf} disabled={!isLive}>2. omgang</button>
        <button onClick={endMatch} disabled={!isLive}>Slutt</button>
        <button onClick={undoLastEvent}>Angre</button>
      </div>

      {/* ⭐ Hendelsesvalg */}
      <div className="event-selector">
        <button onClick={() => setType("goal")}>
          <FontAwesomeIcon icon={faFutbol} /> Mål
        </button>

        <button onClick={() => setType("yellow")}>
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

        <button onClick={() => setType("addedTime")}>
          <FontAwesomeIcon icon={faClock} /> Tilleggstid
        </button>

        <button onClick={() => setType("image")}>
  <FontAwesomeIcon icon={faImage} /> Legg til bilde
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
        simpleData={simpleData}
        setSimpleData={setSimpleData}
        liveMatch={liveMatch}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        addEvent={addEvent}
      />

      {/* ⭐ Live feed */}
      <div className="report-feed">
        <EventList match={liveMatch} homeTeam={homeTeam} awayTeam={awayTeam}/>
      </div>

    </section>
  );
}



