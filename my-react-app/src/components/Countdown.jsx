import { useEffect, useState } from "react";

export default function Countdown({date, time}){

 
 const [timeRemaining, setTimeRemaining] = useState(0)

        useEffect(() => {
            if(!date || !time) return;

            const interval = setInterval(() => {
                const kampTid = new Date(date.toDate())
                const [hours, minutes] = time.split(":")
                kampTid.setHours(hours)
                kampTid.setMinutes(minutes)

                const now= new Date().getTime()
                const eventTime = kampTid.getTime()

                let remaining = eventTime - now;

                if (remaining < 0) {
                    remaining = 0
                    clearInterval(interval)
                }
                setTimeRemaining(remaining)
            }, 1000)
            return () => clearInterval(interval)
        },[date, time])

        const formatTime = (time) => {
            const seconds = Math.floor((time / 1000) % 60)
            const minutes = Math.floor((time /(1000 * 60)) % 60)
            const hours = Math.floor((time / (1000 * 60 * 60)) % 24)
            const days = Math.floor(time / (1000 * 60 * 60 * 24))

            return( 
                <section>
                <div>
                {days.toString().padStart(2, "0")} <span>dager</span>
                </div>
                <div>
                {hours.toString().padStart(2, "0")} <span>timer</span>
                </div>
                <div>
                {minutes.toString().padStart(2, "0")} <span>min</span>
                </div>
                <div>
                {seconds.toString().padStart(2, "0")} <span>sek</span>
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
