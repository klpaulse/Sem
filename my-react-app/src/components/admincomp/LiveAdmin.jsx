import { useState } from "react";
import Calandar from "../homecomp/Calandar";
import AdminMatches from "./AdminMatches";

export default function LiveAdmin({ onSelectMatch }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="live-admin">

      <Calandar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      <AdminMatches
        selectedDate={selectedDate}
        onSelectMatch={onSelectMatch}
      />

      <p>Velg en kamp for å starte livekontroll.</p>
    </div>
  );
}



