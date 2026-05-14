import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTeam } from "../services/TeamService";
import { getTeamMatches } from "../services/MatchService";
import MatchCard from "../components/match/MatchCard";
import TabellComponent from "../components/match/TabellComponent";
import "../assets/style/matchPage.css";
import "../assets/style/teamPage.css";

export default function TeamPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teamNames, setTeamNames] = useState({});
  const [activeTab, setActiveTab] = useState("kamper");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [teamData, matchData] = await Promise.all([
        getTeam(teamId),
        getTeamMatches(teamId),
      ]);
      setTeam(teamData);
      setMatches(matchData);
      setLoading(false);
    }
    load();
  }, [teamId]);

  useEffect(() => {
    async function loadNames() {
      const map = {};
      for (const m of matches) {
        if (m.homeTeamId && !map[m.homeTeamId]) {
          const t = await getTeam(m.homeTeamId);
          map[m.homeTeamId] = t?.name || "Ukjent lag";
        }
        if (m.awayTeamId && !map[m.awayTeamId]) {
          const t = await getTeam(m.awayTeamId);
          map[m.awayTeamId] = t?.name || "Ukjent lag";
        }
      }
      setTeamNames(map);
    }
    if (matches.length > 0) loadNames();
  }, [matches]);

  const season = useMemo(() => {
    if (matches.length === 0) return null;
    const counts = {};
    matches.forEach(m => { counts[m.season] = (counts[m.season] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }, [matches]);

  const seasonMatches = useMemo(() =>
    matches.filter(m => m.season === season), [matches, season]);

  const upcomingMatches = useMemo(() =>
    seasonMatches
      .filter(m => m.status !== "finished")
      .sort((a, b) => a.date - b.date),
    [seasonMatches]);

  const playedMatches = useMemo(() =>
    seasonMatches
      .filter(m => m.status === "finished")
      .sort((a, b) => b.date - a.date),
    [seasonMatches]);

  const stats = useMemo(() => {
    let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
    playedMatches.forEach(m => {
      const isHome = m.homeTeamId === teamId;
      const scored = isHome ? m.homeScore : m.awayScore;
      const conceded = isHome ? m.awayScore : m.homeScore;
      gf += scored ?? 0;
      ga += conceded ?? 0;
      if (scored > conceded) wins++;
      else if (scored < conceded) losses++;
      else draws++;
    });
    return { played: playedMatches.length, wins, draws, losses, gf, ga, points: wins * 3 + draws };
  }, [playedMatches, teamId]);

  if (loading) return <p className="page">Laster lag...</p>;
  if (!team) return <p className="page">Lag ikke funnet</p>;

  const players = Array.isArray(team.players)
    ? team.players
    : Object.values(team.players || {});

  return (
    <main className="page">
      <header className="team-header">
        <button className="team-back-btn" onClick={() => navigate(-1)} aria-label="Tilbake" />
        <div className="team-header-title">
          <h1 className="team-name">{team.name}</h1>
          <p className="team-meta">{team.division}{season ? ` · ${season}` : ""}</p>
        </div>
        <div className="team-header-spacer" />
      </header>

      <div className="team-stats-row">
        <div className="stat-box">
          <span className="stat-val">{stats.played}</span>
          <span className="stat-label">Kamper</span>
        </div>
        <div className="stat-box">
          <span className="stat-val">{stats.wins}</span>
          <span className="stat-label">V</span>
        </div>
        <div className="stat-box">
          <span className="stat-val">{stats.draws}</span>
          <span className="stat-label">U</span>
        </div>
        <div className="stat-box">
          <span className="stat-val">{stats.losses}</span>
          <span className="stat-label">T</span>
        </div>
        <div className="stat-box">
          <span className="stat-val">{stats.gf}-{stats.ga}</span>
          <span className="stat-label">Mål</span>
        </div>
        <div className="stat-box">
          <span className="stat-val">{stats.points}</span>
          <span className="stat-label">Poeng</span>
        </div>
      </div>

      <nav className="home-tabs">
        <button className={`home-tab ${activeTab === "kamper" ? "active" : ""}`} onClick={() => setActiveTab("kamper")}>Kamper</button>
        <button className={`home-tab ${activeTab === "tabell" ? "active" : ""}`} onClick={() => setActiveTab("tabell")}>Tabell</button>
        <button className={`home-tab ${activeTab === "tropp" ? "active" : ""}`} onClick={() => setActiveTab("tropp")}>Tropp</button>
      </nav>

      {activeTab === "kamper" && (
        <section className="team-matches">
          {upcomingMatches.length > 0 && (
            <>
              <h2 className="team-section-title">Kommende</h2>
              <ol className="match-list">
                {upcomingMatches.map(m => (
                  <li key={m.id}>
                    <MatchCard
                      match={m}
                      homeName={teamNames[m.homeTeamId] || "…"}
                      awayName={teamNames[m.awayTeamId] || "…"}
                      onClick={() => navigate(`/match/${m.slug || m.id}`)}
                    />
                  </li>
                ))}
              </ol>
            </>
          )}

          {playedMatches.length > 0 && (
            <>
              <h2 className="team-section-title">Spilte kamper</h2>
              <ol className="match-list">
                {playedMatches.map(m => (
                  <li key={m.id}>
                    <MatchCard
                      match={m}
                      homeName={teamNames[m.homeTeamId] || "…"}
                      awayName={teamNames[m.awayTeamId] || "…"}
                      onClick={() => navigate(`/match/${m.slug || m.id}`)}
                    />
                  </li>
                ))}
              </ol>
            </>
          )}

          {upcomingMatches.length === 0 && playedMatches.length === 0 && (
            <p className="team-empty">Ingen kamper registrert</p>
          )}
        </section>
      )}

      {activeTab === "tabell" && team.division && season && (
        <TabellComponent
          division={team.division}
          season={season}
          highlightTeamId={teamId}
        />
      )}

      {activeTab === "tropp" && (
        <ul className="squad-list">
          {players.length === 0
            ? <li className="squad-empty">Ingen spillere registrert</li>
            : players
                .sort((a, b) => (a.number || 99) - (b.number || 99))
                .map(p => (
                  <li key={p.id} className="squad-player">
                    <span className="squad-number">{p.number || "—"}</span>
                    <span className="squad-name">{p.name}</span>
                  </li>
                ))
          }
        </ul>
      )}
    </main>
  );
}
