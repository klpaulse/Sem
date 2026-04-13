import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { db } from "../../config/Firebase";
import EventForm from "./EventForm";

export default function LiveControls({ match }) {
  if (!match) return <p>Laster kamp...</p>;

  const matchRef = doc(db, "matches", match.id);
  const eventsRef = collection(db, "matches", match.id, "events");

  const [liveMatch, setLiveMatch] = useState(match);

  // Felles state
  const [type, setType] = useState("goal");
  const [text, setText] = useState("");
  const [eventTeam, setEventTeam] = useState("");

  // Bytte-state
  const [subTeam, setSubTeam] = useState("");
  const [subIn, setSubIn] = useState("");     // brukes også for målscorer og kort-spiller
  const [subOut, setSubOut] = useState("");   // brukes også for assist
  const [subComment, setSubComment] = useState("");

  // Frispark-state
  const [fkTeam, setFkTeam] = useState("");
  const [fkPlayer, setFkPlayer] = useState("");
  const [fkComment, setFkComment] = useState("");

  // 🔥 Live kampdata
  useEffect(() => {
    if (!match?.id) return;

    const unsub = onSnapshot(matchRef, (snap) => {
      setLiveMatch({ id: snap.id, ...snap.data() });
    });

    return () => unsub();
  }, [match]);

  // Minutt
  function getMinute() {
    if (!liveMatch?.startTime) return 0;
    const start = new Date(liveMatch.startTime);
    const now = new Date();
    return Math.floor((now - start) / 60000);
  }

  // ⭐ Pause
  async function addPause() {
    await addDoc(eventsRef, {
      id: crypto.randomUUID(),
      type: "system",
      text: "Pause",
      minute: getMinute(),
      createdAt: serverTimestamp()
    });
  }

  // ⭐ 2. omgang
  async function addSecondHalf() {
    await addDoc(eventsRef, {
      id: crypto.randomUUID(),
      type: "system",
      text: "2. omgang har startet",
      minute: getMinute(),
      createdAt: serverTimestamp()
    });
  }

  // ⭐ Legg til hendelse
  async function addEvent() {
    const minute = getMinute();

    // -------------------------
    // ⭐ SPILLERBYTTE
    // -------------------------
    if (type === "sub") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "sub",
        team: subTeam,
        in: subIn,
        out: subOut,
        comment: subComment,
        minute,
        createdAt: serverTimestamp()
      });

      setSubTeam("");
      setSubIn("");
      setSubOut("");
      setSubComment("");
      return;
    }

    // -------------------------
    // ⭐ MÅL
    // -------------------------
    if (type === "goal") {
      const newHomeScore =
        eventTeam === liveMatch.homeTeamId
          ? (liveMatch.homeScore || 0) + 1
          : liveMatch.homeScore;

      const newAwayScore =
        eventTeam === liveMatch.awayTeamId
          ? (liveMatch.awayScore || 0) + 1
          : liveMatch.awayScore;

      // Oppdater stillingen i match-dokumentet
      await updateDoc(matchRef, {
        homeScore: newHomeScore,
        awayScore: newAwayScore
      });

      // Lagre mål-hendelsen
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "goal",
        team: eventTeam,
        player: subIn,          // målscorer
        assist: subOut || null, // målgivende
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        text,
        minute,
        createdAt: serverTimestamp()
      });

      setEventTeam("");
      setSubIn("");
      setSubOut("");
      setText("");
      return;
    }

    // -------------------------
    // ⭐ GULT / RØDT KORT
    // -------------------------
    if (type === "yellow" || type === "red") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type,
        team: eventTeam,
        player: subIn, // spiller som får kortet
        text,
        minute,
        createdAt: serverTimestamp()
      });

      setEventTeam("");
      setSubIn("");
      setText("");
      return;
    }

    // -------------------------
    // ⭐ FRISPARK
    // -------------------------
    if (type === "whistle") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "whistle",
        team: fkTeam,
        player: fkPlayer,
        comment: fkComment,
        minute,
        createdAt: serverTimestamp()
      });

      setFkTeam("");
      setFkPlayer("");
      setFkComment("");
      return;
    }

    // -------------------------
    // ⭐ ANDRE HENDELSER
    // -------------------------
    await addDoc(eventsRef, {
      id: crypto.randomUUID(),
      type,
      team: eventTeam || null,
      text,
      minute,
      createdAt: serverTimestamp()
    });

    setEventTeam("");
    setText("");
  }

  // ⭐ Start kamp
  async function startMatch() {
    await updateDoc(matchRef, {
      status: "live",
      startTime: new Date().toISOString()
    });

    await addDoc(eventsRef, {
      id: crypto.randomUUID(),
      type: "system",
      text: "Kampen har startet",
      minute: 0,
      createdAt: serverTimestamp()
    });
  }

  // ⭐ Slutt kamp
  async function endMatch() {
    await updateDoc(matchRef, { status: "finished" });

    await addDoc(eventsRef, {
      id: crypto.randomUUID(),
      type: "system",
      text: "Kampen er slutt",
      minute: 90,
      createdAt: serverTimestamp()
    });
  }

  return (
    <section>
      <h3>Live kontroll</h3>

      <button onClick={startMatch}>Start kamp</button>
      <button onClick={addPause}>Pause</button>
      <button onClick={addSecondHalf}>2. omgang</button>
      <button onClick={endMatch}>Kampslutt</button>

      <hr />

      <EventForm
        type={type}
        setType={setType}
        text={text}
        setText={setText}
        selectedMatch={liveMatch}
        homeTeamId={liveMatch?.homeTeamId}
        awayTeamId={liveMatch?.awayTeamId}
        subTeam={subTeam}
        setSubTeam={setSubTeam}
        subIn={subIn}
        setSubIn={setSubIn}
        subOut={subOut}
        setSubOut={setSubOut}
        subComment={subComment}
        setSubComment={setSubComment}
        addEvent={addEvent}
        eventTeam={eventTeam}
        setEventTeam={setEventTeam}
        fkTeam={fkTeam}
        setFkTeam={setFkTeam}
        fkPlayer={fkPlayer}
        setFkPlayer={setFkPlayer}
        fkComment={fkComment}
        setFkComment={setFkComment}
      />
    </section>
  );
}