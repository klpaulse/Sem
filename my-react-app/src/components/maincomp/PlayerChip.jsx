export default function PlayerChip({ name, number }) {
  return (
    <div className="player-chip">
      <div className="player-number">{number}</div>
      <div className="player-name">{name}</div>
    </div>
  );
}

