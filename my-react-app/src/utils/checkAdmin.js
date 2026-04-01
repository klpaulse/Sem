import { doc, getDoc } from "firebase/firestore"
import { db } from "../config/Firebase"

export async function checkAdmin (uid) {
    const ref = doc (db, "admins", uid)
    const snap = await getDoc(ref)
    return snap.exists() // true=admin 
}