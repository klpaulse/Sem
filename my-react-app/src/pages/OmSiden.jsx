import { useEffect } from "react";
import { Link } from "react-router-dom";
import "../assets/style/omSiden.css";

export default function OmSiden() {
  useEffect(() => {
    document.title = "Om siden – Breddefotball Live";
    return () => { document.title = "Breddefotball Live"; };
  }, []);

  return (
    <div className="om-page">
      <Link to="/" className="back-btn" aria-label="Tilbake" />

      <div className="om-content">
        <h1 className="om-title">Om Breddefotball Live</h1>

        <section className="om-section">
          <h2>Hva er dette?</h2>
          <p>
            Breddefotball Live er en uoffisiell nettside som følger lokale fotballkamper
            i sanntid. Her kan du se liveoppdateringer, mål, hendelser og tabeller
            for breddefotball i regionen.
          </p>
        </section>

        <section className="om-section">
          <h2>Hvilke divisjoner dekkes?</h2>
          <p>
            Vi dekker kamper i 4., 5. og 6. divisjon lokalt. Ønsker du at en kamp
            eller divisjon skal inkluderes? Ta gjerne kontakt.
          </p>
        </section>

        <section className="om-section">
          <h2>Hvordan fungerer det?</h2>
          <p>
            Kampdata registreres av våre reportere direkte fra arenaen. Hendelser
            som mål, bytter og advarsler oppdateres fortløpende under kampen.
            Tabellen beregnes automatisk basert på innlagte resultater.
          </p>
        </section>

        <section className="om-section">
          <h2>Er siden offisiell?</h2>
          <p>
            Nei — Breddefotball Live er et uavhengig fanprosjekt og har ingen
            offisiell tilknytning til NFF eller klubbene som omtales.
          </p>
        </section>

        <section className="om-section">
          <h2>Kontakt</h2>
          <p>
            Spørsmål, feil eller ønsker? Send oss en e-post:{" "}
            <a href="mailto:din@epost.no">din@epost.no</a>
          </p>
        </section>
      </div>
    </div>
  );
}
