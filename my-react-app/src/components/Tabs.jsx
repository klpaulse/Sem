export default function Tabs({ activeTab, setActiveTab }) {
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

      <button
        className="nav-btn"
        onClick={() => setActiveTab("lag")}
      >
        Lag
      </button>
    </nav>
  );
}