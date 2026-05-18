import { useState } from "react";
import Calandar from "../home/Calandar";
import AdminMatches from "./AdminMatches";
import "../../assets/style/homePage.css";

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
    </div>
  );
}



