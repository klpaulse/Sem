export default function PlayerChip({ name, number, img }) {
  return (
    <div className="player-chip">
      {img && (
        <img src={img} alt={name} className="player-chip__img" />
      )}

      <div className="player-chip__number">{number}</div>
      <div className="player-chip__name">{name}</div>
    </div>
  );
}


