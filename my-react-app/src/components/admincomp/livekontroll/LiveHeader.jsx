export default function LiveHeader({ liveMatch, onBack }) {
  return (
    <>
      <button
        className="back-button"
        onClick={() => {
          if (liveMatch?.status === "live") {
            const leave = window.confirm(
              "Kampen er i gang. Vil du forlate live-kampen?"
            );
            if (!leave) return;
          }
          onBack();
        }}
      >
        ← Tilbake
      </button>

      <h2>Livekontroll</h2>
    </>
  );
}