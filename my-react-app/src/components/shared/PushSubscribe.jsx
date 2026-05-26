import { useEffect, useState } from "react";
import { getToken, isSupported, getMessaging } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../config/Firebase";
import { initializeApp, getApps } from "firebase/app";
import "../../assets/style/pushSubscribe.css";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export default function PushSubscribe() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    async function check() {
      try {
        const supported = await isSupported();
        if (!supported || !("Notification" in window) || !("serviceWorker" in navigator)) {
          setStatus("unsupported");
          return;
        }
        setStatus(Notification.permission); // "default" | "granted" | "denied"
      } catch {
        setStatus("unsupported");
      }
    }
    check();
  }, []);

  async function subscribe() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }

      const sw = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      await navigator.serviceWorker.ready;

      // Hent messaging-instansen fra eksisterende Firebase-app
      const app = getApps()[0];
      const msg = getMessaging(app);

      const token = await getToken(msg, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: sw,
      });

      if (!token) throw new Error("Ingen token mottatt");

      await setDoc(doc(db, "fcm_tokens", token), {
        token,
        createdAt: new Date(),
        ua: navigator.userAgent.slice(0, 120),
      });

      setStatus("granted");
    } catch (err) {
      console.error("Push feilet:", err);
      setStatus("error");
    }
  }

  if (status === "checking" || status === "unsupported") return null;

  if (status === "granted") return (
    <p className="push-status push-status--on">🔔 Push-varsler er på</p>
  );

  if (status === "denied") return (
    <p className="push-status push-status--off">
      🔕 Varsler er blokkert i nettleseren
    </p>
  );

  if (status === "error") return (
    <button className="push-subscribe-btn" onClick={subscribe}>
      ⚠️ Prøv igjen
    </button>
  );

  if (status === "loading") return (
    <p className="push-status push-status--on" style={{ opacity: 0.5 }}>Aktiverer...</p>
  );

  // status === "default"
  return (
    <button className="push-subscribe-btn" onClick={subscribe}>
      🔔 Få push-varsler om mål
    </button>
  );
}
