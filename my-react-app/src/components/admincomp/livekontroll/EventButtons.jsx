import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFutbol,
  faSquare,
  faUserInjured,
  faComment,
  faFlag,
  faBullhorn,
  faArrowUp,
  faClock,
  faImage,
} from "@fortawesome/free-solid-svg-icons";

export default function EventButtons({ activeType, onSelect }) {
  const buttons = [
    { type: "goal",      icon: faFutbol,      label: "Mål" },
    { type: "yellow",    icon: faSquare,       label: "Gult" },
    { type: "red",       icon: faSquare,       label: "Rødt" },
    { type: "sub",       icon: faArrowUp,      label: "Bytte" },
    { type: "injury",    icon: faUserInjured,  label: "Skade" },
    { type: "corner",    icon: faFlag,         label: "Corner" },
    { type: "whistle",   icon: faBullhorn,     label: "Frispark" },
    { type: "comment",   icon: faComment,      label: "Kommentar" },
    { type: "addedTime", icon: faClock,        label: "Tilleggstid" },
    { type: "image",     icon: faImage,        label: "Bilde" },
  ];

  return (
    <div className="event-buttons">
      {buttons.map(({ type, icon, label }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={activeType === type ? "active" : ""}
        >
          <FontAwesomeIcon icon={icon} /> {label}
        </button>
      ))}
    </div>
  );
}