import { useState, useRef, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

export default function Calandar({ selectedDate, setSelectedDate }) {
  const [showFullCalandar, setShowFullCalandar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slideDirection, setSlideDirection] = useState(null);
  const [animate, setAnimate] = useState(false);

  const stripRef = useRef(null);

  function toSafeDate(value) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  const safeSelectedDate = toSafeDate(selectedDate);

  // 15-dagers strip
  const days = useMemo(() => {
    return [...Array(15)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + (i - 7));
      return d;
    });
  }, []);

  const handleSelectDate = (day) => {
    setSelectedDate(day);
    setShowFullCalandar(false);
  };

  useEffect(() => {
    if (!showFullCalandar && stripRef.current) {
      const todayIndex = 7;
      const dayWidth = 70;
      stripRef.current.scrollLeft = todayIndex * dayWidth - 150;
    }
  }, [showFullCalandar]);

  const weekDays = ["MA", "TI", "ON", "TO", "FR", "LØ", "SØ"];

  const getFullMonthGrid = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startWeekday = (firstDay.getDay() + 6) % 7;

    const grid = [];

    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(year, month, -(startWeekday - 1 - i));
      grid.push({ date: d, isOtherMonth: true });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      grid.push({ date: d, isOtherMonth: false });
    }

    while (grid.length < 42) {
      const d = new Date(year, month + 1, grid.length - daysInMonth - startWeekday + 1);
      grid.push({ date: d, isOtherMonth: true });
    }

    return grid;
  };

  const goPrevMonth = () => {
    setSlideDirection("right");
    setAnimate(true);
    setTimeout(() => {
      const newMonth = new Date(currentMonth);
      newMonth.setMonth(currentMonth.getMonth() - 1);
      setCurrentMonth(newMonth);
      setAnimate(false);
    }, 250);
  };

  const goNextMonth = () => {
    setSlideDirection("left");
    setAnimate(true);
    setTimeout(() => {
      const newMonth = new Date(currentMonth);
      newMonth.setMonth(currentMonth.getMonth() + 1);
      setCurrentMonth(newMonth);
      setAnimate(false);
    }, 250);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  return (
    <div className="calandar-container">

      {!showFullCalandar && (
        <div className="calandar-strip" ref={stripRef}>
          <div
            className="calendar-open-btn"
            onClick={() => setShowFullCalandar(true)}
          >
            <FontAwesomeIcon icon={faCalendar} />
          </div>

          {days.map((day, index) => {
            const isSelected = day.toDateString() === safeSelectedDate.toDateString();

            return (
              <div
                key={index}
                className={`calendar-day ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelectDate(day)}
              >
                {day.toLocaleDateString("no-NO", {
                  weekday: "short",
                  day: "numeric",
                })}
              </div>
            );
          })}

          <div
            className="calendar-open-btn"
            onClick={() => setShowFullCalandar(true)}
          >
            <FontAwesomeIcon icon={faCalendar} />
          </div>
        </div>
      )}

      {showFullCalandar && (
        <div className="month-view">

          <div className="month-header">
            <button className="nav-btn" onClick={goPrevMonth}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>

            <div className="calandar-title-wrapper">
              <h3 className="calendar-title">
                {currentMonth.toLocaleDateString("no-NO", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>

              <button
                className="close-month-btn"
                onClick={() => setShowFullCalandar(false)}
              >
                X
              </button>
            </div>

            <button className="nav-btn" onClick={goNextMonth}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>

          <div className="weekdays-row">
            {weekDays.map((d) => (
              <div key={d} className="weekday">{d}</div>
            ))}
          </div>

          <div className={`month-grid slide-${slideDirection} ${animate ? "animating" : ""}`}>
            {getFullMonthGrid(currentMonth).map((dayObj, index) => {
              const day = dayObj.date;

              const isSelected = day.toDateString() === safeSelectedDate.toDateString();
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`month-day 
                    ${dayObj.isOtherMonth ? "other-month" : ""} 
                    ${isSelected ? "selected" : ""} 
                    ${isToday ? "today" : ""}`}
                  onClick={() => handleSelectDate(day)}
                >
                  {day.getDate()}
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}


