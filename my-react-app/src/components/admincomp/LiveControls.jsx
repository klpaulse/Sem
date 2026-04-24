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
import AdminQuestions from "./AdminQuestions";
import FormationAdmin from "./FormationAdmin";

export default function LiveControls({ match, onBack }) {
  if (!match) return <p>Laster kamp...</p>;

  const matchRef = doc(db, "matches", match.id);
  const eventsRef = collection(db, "matches", match.id, "events");
  const [activeTab, setActiveTab] = useState("events"); 


  // ⭐ Live kampdata
  const [liveMatch, setLiveMatch] = useState(null);

  useEffect(() => {
  if (!match || !match.id) return;

  const ref = doc(db, "matches", match.id);

  const unsub = onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      setLiveMatch({ id: snap.id, ...snap.data() });
    }
  });

  return () => unsub();
}, [match?.id]);


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
  const [commentData, setCommentData] = useState({ text: "" });
const [imageData, setImageData] = useState({ image: null });


  // ⭐ Simple events
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

    if (!liveMatch.secondHalfStarted || !liveMatch.secondHalfStartTime) {
      const start = new Date(liveMatch.startTime);
      return Math.floor((now - start) / 60000);
    }

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

  // ⭐ Pause
  async function pauseMatch() {
    await updateDoc(matchRef, { status: "halftime" });
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
    await updateDoc(matchRef, {
      status: "finished",
      homeScore: liveMatch.homeScore ?? 0,
      awayScore: liveMatch.awayScore ?? 0
    })

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

    if (type === "image" && simpleData.image) {
      imageUrl = await uploadImage(simpleData.image);
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

      setGoalData({ team: "", player: "", assist: "" });



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
      setCardData({ team: "", player: "" });

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
      setSubData({ team: "", in: "", out: "" });

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
     setFkData({ team: "", player: "", comment: "" });

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
      setSimpleData({ team: "", minutes: "", image: null, comment: "" });
setText("");


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
      setSimpleData({ team: "", minutes: "", image: null, comment: "" });
setText("");

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
      setText("");

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
      setSimpleData({ team: "", minutes: "", image: null, comment: "" });

      return;
    }
  }

  if (!liveMatch || !homeTeam || !awayTeam) {
    return <p>Laster kampdata...</p>;
  }

return (
  <div className="live-controls">
   <button
  className="back-button"
  onClick={() => {
    if (liveMatch?.status === "live") {
      const leave = window.confirm("Kampen er i gang. Vil du forlate live-kampen?");
      if (!leave) return;
    }
    onBack();
  }}
>
  ← Tilbake
</button>


    <h2>Livekontroll</h2>

    {/* ⭐ FANER – Hendelser / Formasjon */}
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

    {/* ⭐ VIS HENDELSER-FANEN */}
    {activeTab === "events" && (
      <>
        {/* ⭐ Knapper for hendelser */}
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

        {/* ⭐ Skjema for hendelser */}
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

        {/* ⭐ Admin-spørsmål */}
        <AdminQuestions matchId={match.id} getMinute={getMinute} />

        {/* ⭐ Hendelsesliste */}
        <EventList match={liveMatch} />
      </>
    )}

    {/* ⭐ VIS FORMASJON-FANEN */}
    {activeTab === "formation" && (
      <FormationAdmin match={{
        ...match,
      homeTeamName : homeTeam?.name,
      awayTeamName : awayTeam?.name }} />
    )}
  </div>
);

}





