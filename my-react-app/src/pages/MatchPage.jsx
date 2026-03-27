import { useEffect, useState } from "react";
import NextMatch from "../components/NextMatch";
import {db} from "../config/Firebase"
import {collection, getDocs} from "firebase/firestore"


export default function MatchPage(){
    const [matches, setMatches] = useState([])

    useEffect(() => {
        const fetchMatches = async () => {
            const data = await getDocs(collection(db, "matches"))
            const list = data.docs.map(doc => ({...doc.data(), id: doc.id}))
            setMatches(list)
        }
        fetchMatches()
    }, [])

    return(
        <main>
            <h1>SEM IF</h1>
            <img src="https://spond.com/storage/upload/2B18FDF9D6AE99421FD11B8D98F4B2AC/1749751180_0E00D12E/Sem_IF_LOGO.png" />
            <NextMatch matches={matches} />
        </main>
    )
}