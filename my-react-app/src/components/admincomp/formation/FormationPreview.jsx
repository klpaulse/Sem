import FormationField from "../../maincomp/FormationField";
import PlayerChip from "../../maincomp/PlayerChip";

export default function FormationPreview({
  match,
  homePlayers,
  awayPlayers,
  showSavedToast,
  onEdit,
}) {
  return (
    <div className="formation-preview">
      <h2 className="formation-preview__title">Formasjon – Oversikt</h2>

      {showSavedToast && (
        <div className="formation-preview__toast">
          ✓ Formasjon lagret!
        </div>
      )}

      <FormationField interactive={false}>
        {homePlayers.map((p) => (
          <div
            key={"preview-home-" + p.id}
            className="formation-admin__player-on-field"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <PlayerChip name={p.name} number={p.number} img={p.img} />
          </div>
        ))}

        {awayPlayers.map((p) => (
          <div
            key={"preview-away-" + p.id}
            className="formation-admin__player-on-field"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <PlayerChip name={p.name} number={p.number} img={p.img} />
          </div>
        ))}
      </FormationField>

      <div className="formation-preview__actions">
        <button onClick={onEdit} className="formation-preview__edit-button">
          Rediger formasjon
        </button>
      </div>
    </div>
  );
}