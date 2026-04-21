export default function PlayerChip({ name, number, x, y }) {
  return (
    <div
      className="player-chip"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="player-number">{number}</div>
      <div className="player-name">{name}</div>
    </div>
  );
}
