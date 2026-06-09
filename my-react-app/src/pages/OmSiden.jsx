import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/style/omSiden.css";

export default function OmSiden() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Om siden – Breddefotball Live";
    return () => { document.title = "Breddefotball Live"; };
  }, []);

  return (
    <>
      <header className="site-header site-header--split">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Tilbake" />
        <h1 className="live-header live-header--compact om-header-title">Om siden</h1>
        <div style={{ width: 36 }} />
      </header>

      <div className="om-page">
        <div className="om-content">
          <h1 className="om-title">Om Breddefotball Live</h1>

          <section className="om-section">
            <h2>Hva er dette?</h2>
            <p>
              Breddefotball Live er en nettside som følger lokale fotballkamper
              i sanntid. Her kan du se liveoppdateringer, mål, hendelser og tabeller
              for breddefotball i regionen.
            </p>
            <p>
              I første omgang dekker vi kamper i Vestfold-regionen, men håpet er at
              siden en gang i tiden kan utvides til flere regioner.
            </p>
          </section>

          <section className="om-section">
            <h2>Hvilke divisjoner dekkes?</h2>
            <p>
              Vi dekker kamper i 4., 5., 6. og 7. divisjon lokalt. Ønsker du at en kamp
              eller divisjon skal inkluderes? Ta gjerne kontakt.
            </p>
          </section>

          <section className="om-section">
            <h2>Hvordan fungerer det?</h2>
            <p>
              Kampdata registreres av våre reportere direkte fra arenaen. Hendelser
              som mål, bytter og advarsler oppdateres fortløpende under kampen.
            </p>
            <p>
              Ønsker du å være reporter for en kamp? Ta gjerne kontakt — det er
              frivillig enn så lenge.
            </p>
          </section>

          <section className="om-section">
            <h2>Kontakt</h2>
            <p>
              Spørsmål, feil eller ønsker? Send oss en e-post:{" "}
              <a href="mailto:Breddefotball-92@hotmail.com">Breddefotball-92@hotmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
