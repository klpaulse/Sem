export default function PlayerChip({ name, img, team }) {
  const lastName = name ? name.split(" ").slice(-1)[0] : "";
  const initial = name ? name.charAt(0) : "?";

  return (
    <div className="player-chip">
      <div className={team === "away" ? "player-chip__avatar player-chip__avatar--away" : "player-chip__avatar"}>
        {img ? (
          <img src={img} alt={name} className="player-chip__img" />
        ) : (
          <span className="player-chip__number">{initial}</span>
        )}
      </div>

      <div className="player-chip__name">{lastName}</div>
    </div>
  );
}





