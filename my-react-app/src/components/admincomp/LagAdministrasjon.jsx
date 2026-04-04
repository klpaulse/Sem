import CreateTeamForm from "./CreateTeamForm";
import BulkImportTeams from "./BulkImportTeams";

export default function LagAdministrasjon({ divisions }) {
  return (
    <section className="lagadmin-container">
      <h2 className="lagadmin-title">Lagadministrasjon</h2>

      <div className="lagadmin-cards">
        <div className="lagadmin-card">
          <h3>Legg til ett lag</h3>
          <CreateTeamForm divisions={divisions} />
        </div>

        <div className="lagadmin-card">
          <h3>Legg til mange lag (bulk)</h3>
          <BulkImportTeams divisions={divisions} />
        </div>
      </div>
    </section>
  );
}