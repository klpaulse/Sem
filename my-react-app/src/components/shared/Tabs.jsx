export default function Tabs({ activeTab, setActiveTab, hasFormation }) {
  return (
    <nav className="nav">
      <button
        className="nav-btn"
        onClick={() => setActiveTab("rapport")}
      >
        Rapport
      </button>

      <button
        className="nav-btn"
        onClick={() => setActiveTab("tabell")}
      >
        Tabell
      </button>

      {hasFormation && (
      <button
        className="nav-btn"
        onClick={() => setActiveTab("lag")}
      >
        Lag
      </button>
      )}
    </nav>
  );
}