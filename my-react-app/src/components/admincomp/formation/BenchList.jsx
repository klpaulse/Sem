export default function BenchList({ players, onDragStart }) {
  return (
    <div className="bench-container">
      {players.map((p) => (
        <div
          key={p.id}
          className="bench-card"
          onPointerDown={(e) => {
            e.preventDefault();
            onDragStart(p.id, true);
          }}
        >
          <div className="bench-number">{p.number}</div>
          <div className="bench-name">{p.name}</div>
        </div>
      ))}
    </div>
  );
}
