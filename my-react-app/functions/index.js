const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

exports.syncNFFResults = onSchedule(
  {
    schedule: "every 60 minutes",
    timeZone: "Europe/Oslo",
  },
  async () => {
    const seriesId = 208637; // 7. div menn avd. 1

    try {
      const res = await fetch(`https://www.fotball.no/api/series/${seriesId}/matches`);
      const data = await res.json();

      const matches = data.matches;

      for (const match of matches) {
        const matchId = match.matchId;

        const snap = await db
          .collection("matches")
          .where("nffMatchId", "==", matchId)
          .get();

        if (snap.empty) continue;

        const matchDoc = snap.docs[0];
        const matchData = matchDoc.data();

        const noResult =
          matchData.homeScore === null &&
          matchData.awayScore === null;

        if (!noResult) continue;

        const detailsRes = await fetch(
          `https://www.fotball.no/api/matches/matchdetails/${matchId}`
        );
        const details = await detailsRes.json();

        await matchDoc.ref.update({
          homeScore: details.homeTeamScore,
          awayScore: details.awayTeamScore,
          played: details.status === "Finished",
          status: details.status,
          goalScorers: details.goalScorers || [],
        });
      }

      console.log("NFF sync completed");
    } catch (err) {
      console.error("NFF sync error:", err);
    }
  }
);
