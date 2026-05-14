// src/components/admin/SquadSelector.jsx
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../config/Firebase";

export default function SquadSelector({ match, onConfirm }) {
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeSide, setActiveSide] = useState("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const MAX_PLAYERS = 18;

  // ---------------------------------------------------
  // HENT SPILLERE FRA BEGGE LAG
  // ---------------------------------------------------
  useEffect(() => {
    async function loadPlayers() {
      if (!match?.homeTeamId || !match?.awayTeamId) return;
      setLoading(true);

      const [homeSnap, awaySnap] = await Promise.all([
        getDoc(doc(db, "teams", match.homeTeamId)),
        getDoc(doc(db, "teams", match.awayTeamId)),
      ]);

      setHomePlayers(homeSnap.exists() ? homeSnap.data().players || [] : []);
      setAwayPlayers(awaySnap.exists() ? awaySnap.data().players || [] : []);

      if (match.squad && match.squad.length > 0) {
        setSelectedIds(match.squad);
      }

      setLoading(false);
    }

    loadPlayers();
  }, [match]);

  // ---------------------------------------------------
  // VELG / FJERN SPILLER
  // ---------------------------------------------------
  function togglePlayer(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }

  function getSelectedForSide(players) {
    return players.filter((p) => selectedIds.includes(p.id)).length;
  }

  function isAtMax(players) {
    return getSelectedForSide(players) >= MAX_PLAYERS;
  }

  const activePlayers = activeSide === "home" ? homePlayers : awayPlayers;
  const activeTeamName =
    activeSide === "home" ? match?.homeTeamName : match?.awayTeamName;

  const homeCount = getSelectedForSide(homePlayers);
  const awayCount = getSelectedForSide(awayPlayers);

  // ---------------------------------------------------
  // LAGRE TROPP
  // ---------------------------------------------------
  async function handleConfirm() {
    if (!match?.id) return;
    setSaving(true);

    try {
      await setDoc(
        doc(db, "matches", match.id),
        { squad: selectedIds },
        { merge: true }
      );

      onConfirm(selectedIds);
    } catch (err) {
      console.error("Feil ved lagring av tropp:", err);
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------
  // LOADING
  // ---------------------------------------------------
  if (loading) {
    return (
      <div className="squad-selector__loading">
        Laster spillere...
      </div>
    );
  }

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
  return (
    <div className="squad-selector">
      <h2 className="squad-selector__title">Velg kamptropp</h2>

      {/* SIDE-VELGER */}
      <div className="squad-selector__side-toggle">
        <button
          onClick={() => setActiveSide("home")}
          className={
            "squad-selector__side-button" +
            (activeSide === "home"
              ? " squad-selector__side-button--active"
              : "")
          }
        >
          Hjemmelag – {match?.homeTeamName}
          <span className="squad-selector__count">
            {homeCount}/{MAX_PLAYERS}
          </span>
        </button>

        <button
          onClick={() => setActiveSide("away")}
          className={
            "squad-selector__side-button" +
            (activeSide === "away"
              ? " squad-selector__side-button--active"
              : "")
          }
        >
          Bortelag – {match?.awayTeamName}
          <span className="squad-selector__count">
            {awayCount}/{MAX_PLAYERS}
          </span>
        </button>
      </div>

      {/* INFO */}
      <p className="squad-selector__info">
        Velg opptil {MAX_PLAYERS} spillere for {activeTeamName}.  
        Valgt: <strong>{getSelectedForSide(activePlayers)}</strong>
      </p>

      {/* SPILLERLISTE */}
      <div className="squad-selector__list">
        {activePlayers.length === 0 && (
          <p className="squad-selector__empty">Ingen spillere funnet.</p>
        )}

        {activePlayers.map((p) => {
          const isSelected = selectedIds.includes(p.id);
          const atMax = isAtMax(activePlayers);

          return (
            <div
              key={p.id}
              onClick={() => {
                if (!isSelected && atMax) return;
                togglePlayer(p.id);
              }}
              className={
                "squad-selector__player" +
                (isSelected ? " squad-selector__player--selected" : "") +
                (!isSelected && atMax
                  ? " squad-selector__player--disabled"
                  : "")
              }
            >
              <div className="squad-selector__player-img">
                {p.img ? (
                  <img src={p.img} alt={p.name} />
                ) : (
                  <div className="squad-selector__player-img-placeholder">
                    {p.name?.charAt(0) ?? "?"}
                  </div>
                )}
              </div>

              <div className="squad-selector__player-info">
                <span className="squad-selector__player-number">
                  #{p.number ?? "–"}
                </span>
                <span className="squad-selector__player-name">{p.name}</span>
              </div>

              <div className="squad-selector__checkbox">
                {isSelected ? "✅" : "⬜"}
              </div>
            </div>
          );
        })}
      </div>

      {/* BEKREFT */}
      <button
        onClick={handleConfirm}
        disabled={saving || homeCount === 0 || awayCount === 0}
        className="squad-selector__confirm-button"
      >
        {saving ? "Lagrer..." : "Bekreft tropp og sett opp formasjon →"}
      </button>

      {(homeCount === 0 || awayCount === 0) && (
        <p className="squad-selector__warning">
          ⚠️ Du må velge spillere for begge lag før du kan gå videre.
        </p>
      )}
    </div>
  );
}
