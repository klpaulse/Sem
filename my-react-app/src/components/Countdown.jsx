import { useEffect, useState } from "react";
function normalizeDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (d.toDate) return d.toDate(); // Firestore Timestamp
  return new Date(d); // ISO string
}

export default function Countdown({date, time}){

 
 const [timeRemaining, setTimeRemaining] = useState(0)

        useEffect(() => {
            if(!date) return;

        const interval = setInterval(() => {
  const kampTid = normalizeDate(date)
  if (!kampTid) return

  const now = new Date().getTime()
  const eventTime = kampTid.getTime()

  let remaining = eventTime - now

  if (remaining < 0) {
    remaining = 0
    clearInterval(interval)
  }

  setTimeRemaining(remaining)
}, 1000)
            return () => clearInterval(interval)
        },[date])

        const formatTime = (time) => {
            const seconds = Math.floor((time / 1000) % 60)
            const minutes = Math.floor((time /(1000 * 60)) % 60)
            const hours = Math.floor((time / (1000 * 60 * 60)) % 24)
            const days = Math.floor(time / (1000 * 60 * 60 * 24))

            return( 
                <section className="countdown">
                <p>Kampstart om: </p>
                <div>
                {days.toString().padStart(2, "0")} <span>d</span>
                </div>
                <div>
                {hours.toString().padStart(2, "0")} <span>t</span>
                </div>
                <div>
                {minutes.toString().padStart(2, "0")} <span>m</span>
                </div>
                <div>
                {seconds.toString().padStart(2, "0")} <span>s</span>
                </div>
                </section>

            )
        }

        return(
            <>
            {formatTime(timeRemaining)}
            </>
        )

    
    }
