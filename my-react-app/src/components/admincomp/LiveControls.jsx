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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../config/Firebase";

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

  // ⭐ Simple events (corner, injury, comment, addedTime, image)
  const [simpleData, setSimpleData] = useState({ team: "", minutes: "", image: null, comment: "" });

  // ⭐ Nullstill skjema når type endres
  useEffect(() => {
    setText("");
    setSimpleData({ team: "", minutes: "", image: null, comment: "" });
  }, [type]);

  // ⭐ Minutt
  function getMinute() {
    if (!liveMatch?.startTime) return 0;

    const now = new Date();

    // Før 2. omgang
    if (!liveMatch.secondHalfStarted || !liveMatch.secondHalfStartTime) {
      const start = new Date(liveMatch.startTime);
      return Math.floor((now - start) / 60000);
    }

    // Etter 2. omgang
    const secondHalfStart = new Date(liveMatch.secondHalfStartTime);
    const secondHalfMinutes = Math.floor((now - secondHalfStart) / 60000);

    return 45 + secondHalfMinutes;
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
      secondHalfStarted: false,
      secondHalfStartTime: null
    });

    addSystemEvent("Kampen har startet");
  }

  // ⭐ Pause (slutt 1. omgang)
  async function pauseMatch() {
    await updateDoc(matchRef, {
      status: "halftime"
    });

    addSystemEvent("Pause (slutt 1. omgang)");
  }

  // ⭐ Start 2. omgang
  async function startSecondHalf() {
    await updateDoc(matchRef, {
      status: "live",
      secondHalfStarted: true,
      secondHalfStartTime: new Date().toISOString()
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
    await deleteDoc(last.ref);
  }

  // ⭐ Legg til hendelse
  async function addEvent() {
    let imageUrl = null;

    console.log("1. FILE:", simpleData.image);
    console.log("2. TYPE:", type);

    if (type === "image" && simpleData.image) {
      console.log("3. UPLOADING...");
      imageUrl = await uploadImage(simpleData.image);
      console.log("4. URL:", imageUrl);
    }

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

    // ⭐ IMAGE
    if (type === "image") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "image",
        imageUrl,
        text: simpleData.comment || "",
        minute,
        createdAt: serverTimestamp()
      });
      return;
    }
  }

  if (!liveMatch || !homeTeam || !awayTeam) {
    return <p>Laster kampdata...</p>;
  }

  return (
    <div className="live-controls">
      <h2>Livekontroll</h2>

      {/* ⭐ Knapper */}
      <div className="event-buttons">
        <button onClick={() => setType("goal")}><FontAwesomeIcon icon={faFutbol} /> Mål</button>
        <button onClick={() => setType("yellow")}><FontAwesomeIcon icon={faSquare} /> Gult</button>
        <button onClick={() => setType("red")}><FontAwesomeIcon icon={faSquare} /> Rødt</button>
        <button onClick={() => setType("sub")}><FontAwesomeIcon icon={faArrowUp} /> Bytte</button>
        <button onClick={() => setType("injury")}><FontAwesomeIcon icon={faUserInjured} /> Skade</button>
        <button onClick={() => setType("corner")}><FontAwesomeIcon icon={faFlag} /> Corner</button>
        <button onClick={() => setType("whistle")}><FontAwesomeIcon icon={faBullhorn} /> Frispark</button>
        <button onClick={() => setType("comment")}><FontAwesomeIcon icon={faComment} /> Kommentar</button>
        <button onClick={() => setType("addedTime")}><FontAwesomeIcon icon={faClock} /> Tilleggstid</button>
        <button onClick={() => setType("image")}><FontAwesomeIcon icon={faImage} /> Bilde</button>
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

      {/* ⭐ Kampkontroll */}
      <div className="match-controls">
        <button onClick={startMatch}>Start kamp</button>
        <button onClick={pauseMatch}>Pause</button>
        <button onClick={startSecondHalf}>Start 2. omgang</button>
        <button onClick={endMatch}>Slutt kamp</button>
        <button onClick={undoLastEvent}>Angre siste</button>
      </div>

      {/* ⭐ Hendelser */}
      <EventList match={liveMatch} />
    </div>
  );
}




