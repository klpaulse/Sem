// Firebase Cloud Functions – Breddefotball Live
// Deploy: firebase deploy --only functions
// Krever Blaze-plan (gratis kvoter inkludert)

const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

async function getAllTokens() {
  const snap = await getFirestore().collection("fcm_tokens").get();
  return snap.docs.map(d => d.data().token).filter(Boolean);
}

async function sendToAll(notification, data = {}) {
  const tokens = await getAllTokens();
  if (!tokens.length) return;

  for (let i = 0; i < tokens.length; i += 500) {
    const chunk = tokens.slice(i, i + 500);
    const response = await getMessaging().sendEachForMulticast({
      tokens: chunk,
      notification,
      webpush: {
        notification: { icon: "/favicon.svg" },
        fcmOptions: { link: data.url || "/" },
      },
      data,
    });

    // Rydd opp tokens som ikke lenger er gyldige
    const toDelete = [];
    response.responses.forEach((r, idx) => {
      if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
        toDelete.push(chunk[idx]);
      }
    });
    for (const token of toDelete) {
      await getFirestore().doc(`fcm_tokens/${token}`).delete();
    }
  }
}

// Automatisk mål-varsel når et goal-event legges til
exports.onGoalEvent = onDocumentCreated(
  "matches/{matchId}/events/{eventId}",
  async (event) => {
    const data = event.data?.data();
    if (!data || data.type !== "goal") return;

    const matchSnap = await getFirestore().doc(`matches/${event.params.matchId}`).get();
    const match = matchSnap.data();
    if (!match) return;

    const home = data.homeScore ?? match.homeScore ?? "?";
    const away = data.awayScore ?? match.awayScore ?? "?";

    const [homeSnap, awaySnap] = await Promise.all([
      getFirestore().doc(`teams/${match.homeTeamId}`).get(),
      getFirestore().doc(`teams/${match.awayTeamId}`).get(),
    ]);
    const homeName = homeSnap.data()?.name || "Hjemmelag";
    const awayName = awaySnap.data()?.name || "Bortelag";

    const matchUrl = match.slug ? `/match/${match.slug}` : `/match/${event.params.matchId}`;

    await sendToAll(
      {
        title: "⚽ MÅL!",
        body: `${homeName} ${home}–${away} ${awayName}`,
      },
      { url: matchUrl }
    );
  }
);

// Manuell varsling fra adminpanelet
exports.sendManualPush = onDocumentWritten(
  "notifications_queue/{docId}",
  async (event) => {
    if (!event.data.after.exists) return;
    const { title, body } = event.data.after.data();
    if (!title || !body) return;
    await sendToAll({ title, body });
    await event.data.after.ref.delete();
  }
);
