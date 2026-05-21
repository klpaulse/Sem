import { db, storage } from "../../../config/Firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getTeam } from "../../../services/TeamService";

export function useEventActions(match, liveMatch) {
  const matchRef = doc(db, "matches", match.id);
  const eventsRef = collection(db, "matches", match.id, "events");

  /* -----------------------------
      MINUTT
  ------------------------------ */
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

  /* -----------------------------
      LAST OPP BILDE
  ------------------------------ */
  async function uploadImage(file) {
    if (!file) return null;
    const imageRef = ref(storage, `matchImages/${match.id}/${Date.now()}-${file.name}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  }

  /* -----------------------------
      SYSTEMHENDELSE
  ------------------------------ */
  async function addSystemEvent(text, includeMinute = true) {
    await addDoc(eventsRef, {
      id: crypto.randomUUID(),
      type: "system",
      text,
      minute: includeMinute ? getMinute() : null,
      createdAt: serverTimestamp(),
    });
  }

  /* -----------------------------
      KAMPKONTROLL
  ------------------------------ */
  async function startMatch() {
    await updateDoc(matchRef, {
      status: "live",
      featuredLive: false,
      startTime: new Date().toISOString(),
      secondHalfStarted: false,
      secondHalfStartTime: null,
    });
    addSystemEvent("Kampen har startet");
  }

  async function pauseMatch() {
    await updateDoc(matchRef, { status: "pause" });
    addSystemEvent("Pause (slutt 1. omgang)");
  }

  async function startSecondHalf() {
    await updateDoc(matchRef, {
      status: "live",
      secondHalfStarted: true,
      secondHalfStartTime: new Date().toISOString(),
    });
    addSystemEvent("2. omgang har startet", false);
  }

  async function endMatch() {
    await updateDoc(matchRef, {
      status: "finished",
      homeScore: liveMatch.homeScore ?? 0,
      awayScore: liveMatch.awayScore ?? 0,
    });
    addSystemEvent("Kampen er slutt");
  }

  async function undoLastEvent() {
    const qSnap = await getDocs(
      query(eventsRef, orderBy("createdAt", "desc"), limit(1))
    );
    if (qSnap.empty) return;
    await deleteDoc(qSnap.docs[0].ref);
  }

  async function removeFeatured() {
  await updateDoc(matchRef, {
    featuredLive: false
  });
}


  /* -----------------------------
      LEGG TIL HENDELSE
  ------------------------------ */
  async function addEvent(type, data, setText, resetData) {
    const isPause = liveMatch?.status === "pause";
    const isPreMatch = liveMatch?.status === "not_started";
    const minute = (isPause || isPreMatch) ? null : getMinute();
    let imageUrl = null;

    if (type === "image" && data.image) {
      imageUrl = await uploadImage(data.image);
    }

    if (type === "goal") {
      const newHome =
        data.team === liveMatch.homeTeamId
          ? (liveMatch.homeScore || 0) + 1
          : liveMatch.homeScore;

      const newAway =
        data.team === liveMatch.awayTeamId
          ? (liveMatch.awayScore || 0) + 1
          : liveMatch.awayScore;

      await updateDoc(matchRef, { homeScore: newHome, awayScore: newAway });

      const scoringTeam = await getTeam(data.team);
      const players = Array.isArray(scoringTeam?.players)
        ? scoringTeam.players
        : Object.values(scoringTeam?.players || {});
      const scorer = players.find((p) => p.id === data.player);
      const assister = data.assist ? players.find((p) => p.id === data.assist) : null;

      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "goal",
        team: data.team,
        player: data.player,
        playerName: scorer?.name || null,
        assist: data.assist || null,
        assistName: assister?.name || null,
        division: match.division ? String(match.division) : null,
        season: match.season ? String(match.season) : null,
        homeScore: newHome,
        awayScore: newAway,
        text: data.text || "",
        imageUrl,
        minute,
        createdAt: serverTimestamp(),
      });

      resetData();
      return;
    }

    if (type === "yellow" || type === "red") {
      const cardTeam = await getTeam(data.team);
      const cardPlayers = Array.isArray(cardTeam?.players)
        ? cardTeam.players
        : Object.values(cardTeam?.players || {});
      const cardPlayer = cardPlayers.find((p) => p.id === data.player);

      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type,
        team: data.team,
        player: data.player,
        playerName: cardPlayer?.name || null,
        division: match.division ? String(match.division) : null,
        season: match.season ? String(match.season) : null,
        text: data.text || "",
        imageUrl,
        minute,
        createdAt: serverTimestamp(),
      });
      resetData();
      return;
    }

    if (type === "sub") {
      const subTeam = await getTeam(data.team);
      const subPlayers = Array.isArray(subTeam?.players)
        ? subTeam.players
        : Object.values(subTeam?.players || {});
      const playerIn = subPlayers.find((p) => p.id === data.in);
      const playerOut = subPlayers.find((p) => p.id === data.out);

      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "sub",
        team: data.team,
        in: data.in,
        out: data.out,
        playerInName: playerIn?.name || null,
        playerOutName: playerOut?.name || null,
        division: match.division ? String(match.division) : null,
        season: match.season ? String(match.season) : null,
        comment: data.comment,
        imageUrl,
        minute,
        createdAt: serverTimestamp(),
      });
      resetData();
      return;
    }

    if (type === "whistle") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "whistle",
        team: data.team,
        player: data.player,
        comment: data.comment,
        imageUrl,
        minute,
        createdAt: serverTimestamp(),
      });
      resetData();
      return;
    }

    if (type === "corner" || type === "injury") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type,
        team: data.team,
        text: data.text || "",
        imageUrl,
        minute,
        createdAt: serverTimestamp(),
      });
      resetData();
      return;
    }

    if (type === "addedTime") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "addedTime",
        minutes: data.minutes,
        text: data.text || "",
        imageUrl,
        minute,
        createdAt: serverTimestamp(),
      });
      resetData();
      return;
    }

    if (type === "comment") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "comment",
        text: data.text || "",
        imageUrl,
        minute: isPreMatch ? null : minute,         // ⭐ ingen minutt før kamp
        ...(isPreMatch && {preMatch: true}),    // ⭐ flagg for pre-match
        createdAt: serverTimestamp(),
      });
      resetData();
      return;
    }

    if (type === "image") {
      await addDoc(eventsRef, {
        id: crypto.randomUUID(),
        type: "image",
        imageUrl,
        text: data.comment || "",
        minute: isPreMatch ? null : minute,         // ⭐ ingen minutt før kamp
        ...(isPreMatch && { preMatch: true}),    // ⭐ flagg for pre-match
        createdAt: serverTimestamp(),
      });
      resetData();
      return;
    }
if (type === "poll") {
    console.log("isPreMatch når poll lagres:", isPreMatch, "status:", liveMatch?.status)
  const pollRef = collection(db, "matches", match.id, "polls");

  await addDoc(pollRef, {
    question: data.question,
    options: data.options.map((o) => ({
      text: o,
      votes: 0
    })),
    voters: [],
    active: true,
    createdAt: serverTimestamp(),
    minute: null,
  preMatch: liveMatch?.status === "not_started" ?  true : false
  });

  resetData();
  return;
}

  }

  return {
    getMinute,
    startMatch,
    pauseMatch,
    startSecondHalf,
    endMatch,
    undoLastEvent,
    addEvent,
    removeFeatured,
  };
}