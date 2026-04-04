import { useEffect, useState } from "react";
import { db } from "../../config/Firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import MatchSelector from "./MatchSelector";
import LiveControls from "./LiveControls";
import EventForm from "./EventForm";
import MatchPreview from "./MatchPreview";
import ResultsForm from "./ResultsForm";
import MatchListAdmin from "./MatchListAdmin";
import CreateMatchForm from "./CreateMatchForm";
import BulkImportMatches from "./BulkImportMatches-skjema";

export default function KampAdministrasjon({ divisions }) {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [events, setEvents] = useState([]);

  // Resultat
  const [editingMatch, setEditingMatch] = useState(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [location, setLocation] = useState("");

  // Bytter
  const [subIn, setSubIn] = useState("");
  const [subOut, setSubOut] = useState("");
  const [subTeam, setSubTeam] = useState("");
  const [subComment, setSubComment] = useState("");

  // Hendelser
  const [type, setType] = useState("comment");
  const [text, setText] = useState("");

  const matchesRef = collection(db, "matches");

  // Hent alle kamper live
  useEffect(() => {
    const unsubscribe = onSnapshot(matchesRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setMatches(data);
    });

    return () => unsubscribe();
  }, []);

  // Beregn minutt basert på startTime
  const calculateMinute = () => {
    if (!selectedMatch?.startTime) return 0;
    const start = selectedMatch.startTime.toDate();
    const now = new Date();
    return Math.floor((now - start) / 60000);
  };

  // Start kamp
  const startMatch = async () => {
    if (!selectedMatch) return;

    const matchRef = doc(db, "matches", selectedMatch.id);
    await updateDoc(matchRef, {
      startTime: serverTimestamp(),
    });

    await addSystemEvent("Kampen har startet");
  };

  // Systemhendelser
  const addSystemEvent = async (systemText) => {
    if (!selectedMatch) return;

    const minute = calculateMinute();

    await addDoc(collection(db, "matches", selectedMatch.id, "events"), {
      type: "system",
      team: systemText,
      minute,
      createdAt: serverTimestamp(),
    });
  };

  // Vanlige hendelser
  const addEvent = async () => {
    if (!selectedMatch) return;

    const minute = calculateMinute();

    if (type === "sub") {
      await addDoc(collection(db, "matches", selectedMatch.id, "events"), {
        type: "sub",
        team: subTeam,
        in: subIn,
        out: subOut,
        comment: subComment,
        minute,
        createdAt: serverTimestamp(),
      });

      setSubIn("");
      setSubOut("");
      setSubTeam("");
      setSubComment("");
      return;
    }

    await addDoc(collection(db, "matches", selectedMatch.id, "events"), {
      type,
      text,
      minute,
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  // Hent events for valgt kamp
  useEffect(() => {
    if (!selectedMatch) return;

    const eventsRef = collection(db, "matches", selectedMatch.id, "events");

    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      data.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

      setEvents(data);
    });

    return () => unsubscribe();
  }, [selectedMatch]);

  // Lagre resultat
  const saveResult = async () => {
    if (!editingMatch) return;

    const matchRef = doc(db, "matches", editingMatch.id);
    await updateDoc(matchRef, {
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      played: true,
      location,
    });

    setEditingMatch(null);
    setHomeScore("");
    setAwayScore("");
    setLocation("");
  };

  // Slett kamp
  const deleteMatch = async (id) => {
    const matchDoc = doc(db, "matches", id);
    await deleteDoc(matchDoc);
  };

  return (
    <section className="kampadmin-container">
      <h2 className="kampadmin-title">Kampadministrasjon</h2>

      <MatchSelector
        matches={matches}
        selectedMatch={selectedMatch}
        setSelectedMatch={setSelectedMatch}
      />

      {selectedMatch && (
        <>
          <LiveControls
            addSystemEvent={addSystemEvent}
            startMatch={startMatch}
          />

          <EventForm
            type={type}
            setType={setType}
            text={text}
            setText={setText}
            selectedMatch={selectedMatch}
            subTeam={subTeam}
            setSubTeam={setSubTeam}
            subIn={subIn}
            setSubIn={setSubIn}
            subOut={subOut}
            setSubOut={setSubOut}
            subComment={subComment}
            setSubComment={setSubComment}
            addEvent={addEvent}
          />

          <MatchPreview match={selectedMatch} events={events} />
        </>
      )}

      {editingMatch && (
        <ResultsForm
          editingMatch={editingMatch}
          setEditingMatch={setEditingMatch}
          homeScore={homeScore}
          setHomeScore={setHomeScore}
          awayScore={awayScore}
          setAwayScore={setAwayScore}
          location={location}
          setLocation={setLocation}
          saveResult={saveResult}
        />
      )}

      <MatchListAdmin
        matches={matches}
        setEditingMatch={setEditingMatch}
        deleteMatch={deleteMatch}
      />

      <CreateMatchForm divisions={divisions} />

      <BulkImportMatches divisions={divisions} />
    </section>
  );
}