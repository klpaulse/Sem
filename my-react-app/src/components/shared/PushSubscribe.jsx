import { useEffect, useState } from "react";
import { getToken, isSupported, getMessaging } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../config/Firebase";
import { getApps } from "firebase/app";
import "../../assets/style/pushSubscribe.css";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

async function getSWAndToken() {
  await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const swReg = await navigator.serviceWorker.ready;
  const app = getApps()[0];
  const msg = getMessaging(app);
  const token = await getToken(msg, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
  return token || null;
}

async function saveToken(token) {
  await setDoc(doc(db, "fcm_tokens", token), {
    token,
    createdAt: new Date(),
    ua: navigator.userAgent.slice(0, 120),
  });
}

export default function PushSubscribe() {
  const [status, setStatus] = useState("checking");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function check() {
      try {
        const supported = await isSupported();
        if (!supported || !("Notification" in window) || !("serviceWorker" in navigator)) {
          setStatus("unsupported"); return;
        }
        if (Notification.permission === "denied") {
          setStatus("denied"); return;
        }
        if (Notification.permission === "granted") {
          // Prøv å (re)hente token stille — lagrer til Firestore hvis det mangler
          try {
            const token = await getSWAndToken();
            if (token) {
              await saveToken(token);
              setStatus("granted");
            } else {
              setStatus("default");
            }
          } catch {
            setStatus("default");
          }
          return;
        }
        setStatus("default");
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

      const token = await getSWAndToken();
      if (!token) throw new Error("Ingen token mottatt");
      await saveToken(token);
      setStatus("granted");
    } catch (err) {
      console.error("Push feilet:", err);
      setErrorMsg(err?.message || String(err));
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
    <div>
      <button className="push-subscribe-btn" onClick={subscribe}>
        ⚠️ Prøv igjen
      </button>
      {errorMsg && <p style={{ fontSize: "0.7rem", color: "#f66", marginTop: 4 }}>{errorMsg}</p>}
    </div>
  );

  if (status === "loading") return (
    <p className="push-status push-status--on" style={{ opacity: 0.5 }}>Aktiverer...</p>
  );

  return (
    <button className="push-subscribe-btn" onClick={subscribe}>
      🔔 Få push-varsler om mål
    </button>
  );
}
