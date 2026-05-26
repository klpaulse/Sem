import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isFirebaseError =
      this.state.error?.message?.toLowerCase().includes("firebase") ||
      this.state.error?.message?.toLowerCase().includes("network") ||
      this.state.error?.message?.toLowerCase().includes("unavailable");

    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        gap: "1rem",
      }}>
        <div style={{ fontSize: "2.5rem" }}>{isFirebaseError ? "📡" : "⚠️"}</div>
        <h2 style={{ color: "#fff", margin: 0, fontSize: "1.2rem" }}>
          {isFirebaseError ? "Ingen forbindelse" : "Noe gikk galt"}
        </h2>
        <p style={{ color: "#888", fontSize: "0.9rem", margin: 0, maxWidth: "300px" }}>
          {isFirebaseError
            ? "Klarte ikke koble til serveren. Sjekk internettforbindelsen og prøv igjen."
            : "En uventet feil oppsto. Prøv å laste siden på nytt."}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "0.5rem",
            padding: "10px 24px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          Last siden på nytt
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
