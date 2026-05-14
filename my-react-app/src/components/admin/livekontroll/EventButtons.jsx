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

export default function EventButtons({ activeType, onSelect, onlyTypes }) {
  const buttons = [
    { type: "goal",      icon: faFutbol,      label: "Mål" },
    { type: "yellow",    icon: faSquare,      label: "Gult" },
    { type: "red",       icon: faSquare,      label: "Rødt" },
    { type: "sub",       icon: faArrowUp,     label: "Bytte" },
    { type: "injury",    icon: faUserInjured, label: "Skade" },
    { type: "corner",    icon: faFlag,        label: "Corner" },
    { type: "whistle",   icon: faBullhorn,    label: "Frispark" },
    { type: "comment",   icon: faComment,     label: "Kommentar" },
    { type: "addedTime", icon: faClock,       label: "Tilleggstid" },
    { type: "image",     icon: faImage,       label: "Bilde" },
    { type: "poll",      icon: null,          label: "Avstemning" },
  ];

  const filtered = onlyTypes
    ? buttons.filter((b) => onlyTypes.includes(b.type))
    : buttons;

  return (
    <div className="event-buttons">
      {filtered.map(({ type, icon, label }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={activeType === type ? "active" : ""}
        >
          {icon && <FontAwesomeIcon icon={icon} />} 
          {label}
        </button>
      ))}
    </div>
  );
}
