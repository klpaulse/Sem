import { useEffect, useState } from "react"
import { collection,  onSnapshot, query, orderBy } from "firebase/firestore";
import {db} from "../config/Firebase"

export default function useMatchEvents(selectedMatch){

    const [events, setEvents] = useState([])

    useEffect(() => {
        if (!selectedMatch) return 
    

        const q = query(
      collection(db, "matches", selectedMatch.id, "events"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(list);
    });

    return () => unsub();
  }, [selectedMatch]);

    return events

    
}