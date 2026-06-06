import { useEffect, useMemo, useState } from "react";
import API from "./api";
import socket from "./socket";
import Rankings from "./pages/Rankings";
import "./App.css";

const emptyExtras = {
  wides: 0,
  noBalls: 0,
  byes: 0,
  legByes: 0
};

// Define default players outside the component to prevent re-creation on each render
const defaultBattingPlayers = ["Batsman 1", "Batsman 2", "Batsman 3", "Batsman 4", "Batsman 5"];
const defaultBowlingPlayers = ["Bowler 1", "Bowler 2", "Bowler 3", "Bowler 4", "Bowler 5"];

function App() {
  const [page, setPage] = useState("home");
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [playerNames, setPlayerNames] = useState({});
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [totalOvers, setTotalOvers] = useState(10);
  const [matchId, setMatchId] = useState(null);
  const [matchStarted, setMatchStarted] = useState(false);
  const [innings, setInnings] = useState(1);
  const [firstInnings, setFirstInnings] = useState(null);
  const [matchResult, setMatchResult] = useState("");
  const [matchStatsCommitted, setMatchStatsCommitted] = useState(false);
  const [needsSecondInningsSetup, setNeedsSecondInningsSetup] = useState(false);
  const [secondStriker, setSecondStriker] = useState("");
  const [secondNonStriker, setSecondNonStriker] = useState("");
  const [secondBowler, setSecondBowler] = useState("");
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [extras, setExtras] = useState(emptyExtras);
  const [battingStats, setBattingStats] = useState({});
  const [bowlingStats, setBowlingStats] = useState({});
  const [history, setHistory] = useState([]);
  const [striker, setStriker] = useState("Batsman 1");
  const [nonStriker, setNonStriker] = useState("Batsman 2");
  const [bowler, setBowler] = useState("Bowler 1");
  const [lastOverBowler, setLastOverBowler] = useState("");
  const [dismissedBatters, setDismissedBatters] = useState([]);
  const [needsBowlerChange, setNeedsBowlerChange] = useState(false);
  const [needsNewBatter, setNeedsNewBatter] = useState(false);
  const [lastBall, setLastBall] = useState(null);
  const [undoStack, setUndoStack] = useState([]);

  // Auth & Tournament States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [tournaments, setTournaments] = useState([]);
  const [tournamentName, setTournamentName] = useState("");
  const [selectedTournament, setSelectedTournament] = useState("");

  const selectedTeamA = teams.find((team) => team.name === teamA);
  const selectedTeamB = teams.find((team) => team.name === teamB);
  const currentBattingTeam = innings === 1 ? teamA : teamB;
  const currentBowlingTeam = innings === 1 ? teamB : teamA;
  const selectedBattingTeam = teams.find((team) => team.name === currentBattingTeam);
  const selectedBowlingTeam = teams.find((team) => team.name === currentBowlingTeam);
  const battingPlayers = selectedBattingTeam?.players?.length
    ? selectedBattingTeam.players
    : defaultBattingPlayers;
  const bowlingPlayers = useMemo(() => selectedBowlingTeam?.players?.length
    ? selectedBowlingTeam.players
    : defaultBowlingPlayers, [selectedBowlingTeam]);
  const maxOversPerBowler = Math.ceil(Number(totalOvers || 1) / 5);
  const target = firstInnings ? firstInnings.runs + 1 : null;
  const allOut = wickets >= battingPlayers.length - 1;
  const overLimitReached = balls >= Number(totalOvers) * 6;
  const targetReached = innings === 2 && target && runs >= target;
  const inningsComplete = matchStarted && (overLimitReached || allOut || targetReached);
  const unavailableScoring = !matchStarted || needsBowlerChange || needsNewBatter || inningsComplete || Boolean(matchResult);

  const availableBatters = battingPlayers.filter(
    (player) => !dismissedBatters.includes(player) && player !== striker && player !== nonStriker
  );

  const availableBowlers = useMemo(() => {
    return bowlingPlayers.filter((player) => {
      const bowlerBalls = bowlingStats[player]?.balls || 0;
      const bowlerOvers = Math.floor(bowlerBalls / 6);
      return player !== lastOverBowler && bowlerOvers < maxOversPerBowler;
    });
  }, [bowlingPlayers, bowlingStats, lastOverBowler, maxOversPerBowler]);

  useEffect(() => {
    fetchTeams();
    fetchTournaments();
  }, []);

  useEffect(() => {
    socket.on("live_update", (data) => {
      applyMatchState(data);
    });

    return () => socket.off("live_update");
  }, []);

  function applyMatchState(data) {
    setRuns(data.runs || 0);
    setInnings(data.innings || 1);
    setFirstInnings(data.firstInnings || null);
    setMatchResult(data.matchResult || "");
    setMatchStatsCommitted(Boolean(data.matchStatsCommitted));
    setNeedsSecondInningsSetup(Boolean(data.needsSecondInningsSetup));
    setWickets(data.wickets || 0);
    setBalls(data.balls || 0);
    setExtras(data.extras || emptyExtras);
    setBattingStats(data.battingStats || {});
    setBowlingStats(data.bowlingStats || {});
    setHistory(data.history || []);
    setLastBall(data.lastBall || null);
    setStriker(data.striker || "");
    setNonStriker(data.nonStriker || "");
    setBowler(data.bowler || "");
    setLastOverBowler(data.lastOverBowler || "");
    setDismissedBatters(data.dismissedBatters || []);
    setNeedsBowlerChange(Boolean(data.needsBowlerChange));
    setNeedsNewBatter(Boolean(data.needsNewBatter));
    if (data.totalOvers) setTotalOvers(data.totalOvers);
  }

  function buildMatchState(overrides = {}) {
    return {
      teamA,
      teamB,
      totalOvers: Number(totalOvers),
      innings,
      firstInnings,
      matchResult,
      matchStatsCommitted,
      needsSecondInningsSetup,
      runs,
      wickets,
      balls,
      striker,
      nonStriker,
      bowler,
      lastOverBowler,
      extras,
      battingStats,
      bowlingStats,
      dismissedBatters,
      needsBowlerChange,
      needsNewBatter,
      history,
      lastBall,
      ...overrides
    };
  }

  function formatOvers(totalBalls) {
    return `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;
  }

  function getPlayerStats(stats, player) {
    return stats[player] || {
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      wides: 0,
      noBalls: 0
    };
  }

  function swapBatters(first, second) {
    return [second, first];
  }

  async function saveMatchState(nextState, previousState = null) {
    applyMatchState(nextState);

    if (previousState) {
      setUndoStack((current) => [...current, previousState].slice(-20));
    }

    await API.put(`/matches/${matchId}`, nextState);
    socket.emit("update_match", {
      matchId,
      updatedMatch: nextState
    });
  }

  function getCompletedInnings(nextState = buildMatchState()) {
    const inningsList = [];

    if (nextState.firstInnings) {
      inningsList.push(nextState.firstInnings);
    }

    if (!nextState.firstInnings && nextState.innings === 1) {
      inningsList.push({
        team: teamA,
        battingTeam: teamA,
        bowlingTeam: teamB,
        runs: nextState.runs,
        wickets: nextState.wickets,
        balls: nextState.balls,
        extras: nextState.extras,
        battingStats: nextState.battingStats,
        bowlingStats: nextState.bowlingStats,
        history: nextState.history
      });
    }

    if (nextState.innings === 2) {
      inningsList.push({
        team: teamB,
        battingTeam: teamB,
        bowlingTeam: teamA,
        runs: nextState.runs,
        wickets: nextState.wickets,
        balls: nextState.balls,
        extras: nextState.extras,
        battingStats: nextState.battingStats,
        bowlingStats: nextState.bowlingStats,
        history: nextState.history
      });
    }

    return inningsList;
  }

  async function commitCompletedMatchStats(nextState) {
    await API.post("/players/commit-match-stats", {
      innings: getCompletedInnings(nextState)
    });
  }

  function formatDelivery(ball) {
    if (!ball) return "";

    const scoreText = ball.wicket
      ? ball.wicketType
      : `${ball.runs} run${ball.runs === 1 ? "" : "s"}`;
    const extraText = ball.extraType ? ` (${ball.extraType})` : "";

    return `${ball.over}.${ball.ball}${ball.legal ? "" : " illegal"} - ${ball.striker} vs ${ball.bowler}: ${scoreText}${extraText}`;
  }

  // Mock authentication handler. In a real app, this would make an API call.
  function handleAuthSubmit(e) {
    e.preventDefault();
    if (authMode === "login") {
      // NOTE: Hardcoded password check for demonstration purposes only.
      if (authEmail && authPassword === "cricket123") {
        setIsAuthenticated(true);
        setAuthError("");
      } else {
        setAuthError("Invalid credentials. Hint: use password 'cricket123'");
      }
    } else {
      if (authName && authEmail && authPassword.length >= 6) {
        setIsAuthenticated(true);
        setAuthError("");
      } else {
        setAuthError("Please fill all fields. Password must be 6+ chars.");
      }
    }
  }

  async function fetchTeams() {
    const res = await API.get("/teams");
    setTeams(res.data || []);
  }

  async function createTeam() {
    if (!teamName.trim()) return;

    await API.post("/teams", {
      name: teamName,
      players: []
    });

    setTeamName("");
    fetchTeams();
  }

  async function deleteTeam(teamId) {
    try {
      await API.delete(`/teams/${teamId}`);
      fetchTeams();
    } catch (error) {
      console.error("Failed to delete team:", error);
    }
  }

  async function addPlayerToTeam(team) {
    const playerName = playerNames[team._id]?.trim();

    if (!playerName) return;

    await API.post("/players", {
      name: playerName,
      teamId: team._id
    });

    setPlayerNames((current) => ({
      ...current,
      [team._id]: ""
    }));
    fetchTeams();
  }

  async function fetchTournaments() {
    try {
      const res = await API.get("/tournaments");
      setTournaments(res.data || []);
    } catch (err) {
      console.warn("Tournaments API not implemented yet, using local state", err);
    }
  }

  async function createTournament() {
    if (!tournamentName.trim()) return;
    try {
      await API.post("/tournaments", { name: tournamentName });
      fetchTournaments();
    } catch (err) {
      console.error(err);
      // Fallback for local UI without backend
      setTournaments((prev) => [...prev, { _id: Date.now().toString(), name: tournamentName }]);
    }
    setTournamentName("");
  }

  async function startMatch() {
    if (!teamA || !teamB || teamA === teamB || striker === nonStriker) return;

    const matchState = {
      tournament: selectedTournament,
      teamA,
      teamB,
      totalOvers: Number(totalOvers),
      innings: 1,
      firstInnings: null,
      matchResult: "",
      matchStatsCommitted: false,
      needsSecondInningsSetup: false,
      runs: 0,
      wickets: 0,
      balls: 0,
      striker,
      nonStriker,
      bowler,
      lastOverBowler: "",
      extras: emptyExtras,
      battingStats: {},
      bowlingStats: {},
      dismissedBatters: [],
      needsBowlerChange: false,
      needsNewBatter: false,
      history: [],
      lastBall: null
    };

    const res = await API.post("/matches", matchState);

    setMatchId(res.data._id);
    setMatchStarted(true);
    setInnings(1);
    setFirstInnings(null);
    setMatchResult("");
    setMatchStatsCommitted(false);
    setNeedsSecondInningsSetup(false);
    setUndoStack([]);
    applyMatchState(matchState);
    setPage("live");
    socket.emit("join_match", res.data._id);
  }

  async function prepareSecondInnings() {
    if (!matchId || innings !== 1 || !inningsComplete) return;

    const secondBattingPlayers = selectedTeamB?.players?.length
      ? selectedTeamB.players
      : ["Batsman 1", "Batsman 2", "Batsman 3", "Batsman 4", "Batsman 5"];
    const secondBowlingPlayers = selectedTeamA?.players?.length
      ? selectedTeamA.players
      : ["Bowler 1", "Bowler 2", "Bowler 3", "Bowler 4", "Bowler 5"];

    setSecondStriker(secondBattingPlayers[0]);
    setSecondNonStriker(secondBattingPlayers[1] || secondBattingPlayers[0]);
    setSecondBowler(secondBowlingPlayers[0]);
    setNeedsSecondInningsSetup(true);
  }

  async function startSecondInnings() {
    if (!matchId || innings !== 1 || !inningsComplete || secondStriker === secondNonStriker) return;

    const firstInningsSummary = {
      team: teamA,
      battingTeam: teamA,
      bowlingTeam: teamB,
      runs,
      wickets,
      balls,
      extras,
      battingStats,
      bowlingStats,
      history
    };
    const nextState = buildMatchState({
      innings: 2,
      firstInnings: firstInningsSummary,
      matchResult: "",
      needsSecondInningsSetup: false,
      runs: 0,
      wickets: 0,
      balls: 0,
      striker: secondStriker,
      nonStriker: secondNonStriker,
      bowler: secondBowler,
      lastOverBowler: "",
      extras: emptyExtras,
      battingStats: {},
      bowlingStats: {},
      dismissedBatters: [],
      needsBowlerChange: false,
      needsNewBatter: false,
      history: [],
      lastBall: null
    });

    setUndoStack([]);
    await saveMatchState(nextState);
  }

  async function recordDelivery({
    batterRuns = 0,
    extraRuns = 0,
    extraType = "",
    wicket = false,
    wicketType = "",
    legal = true,
    rotateOnRuns = true
  }) {
    if (unavailableScoring) return;

    const previousState = buildMatchState();
    const totalRuns = batterRuns + extraRuns;
    const newBalls = legal ? balls + 1 : balls;
    const ballNumber = legal ? newBalls : balls + 1;
    const nextBattingStats = { ...battingStats };
    const nextBowlingStats = { ...bowlingStats };
    const nextExtras = { ...extras };
    const strikerStats = {
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      ...nextBattingStats[striker]
    };
    const bowlerStats = {
      balls: 0,
      runs: 0,
      wickets: 0,
      wides: 0,
      noBalls: 0,
      ...nextBowlingStats[bowler]
    };

    strikerStats.runs += batterRuns;
    if (legal) strikerStats.balls += 1;
    if (batterRuns === 4) strikerStats.fours += 1;
    if (batterRuns === 6) strikerStats.sixes += 1;

    if (legal) bowlerStats.balls += 1;
    bowlerStats.runs += extraType === "byes" || extraType === "legByes" ? batterRuns : totalRuns;
    if (wicket) bowlerStats.wickets += 1;
    if (extraType === "wides") {
      nextExtras.wides += extraRuns;
      bowlerStats.wides += extraRuns;
    }
    if (extraType === "noBalls") {
      nextExtras.noBalls += extraRuns;
      bowlerStats.noBalls += extraRuns;
    }
    if (extraType === "byes") nextExtras.byes += extraRuns;
    if (extraType === "legByes") nextExtras.legByes += extraRuns;

    nextBattingStats[striker] = strikerStats;
    nextBowlingStats[bowler] = bowlerStats;

    const ballData = {
      over: Math.floor((ballNumber - 1) / 6),
      ball: ((ballNumber - 1) % 6) + 1,
      runs: totalRuns,
      batterRuns,
      extras: extraRuns,
      extraType,
      wicket,
      wicketType,
      legal,
      bowler,
      striker
    };

    let nextStriker = striker;
    let nextNonStriker = nonStriker;
    let nextNeedsNewBatter = false;
    let nextNeedsBowlerChange = false;
    let nextLastOverBowler = lastOverBowler;
    const nextDismissedBatters = wicket
      ? [...dismissedBatters, striker]
      : [...dismissedBatters];

    if (!wicket && rotateOnRuns && totalRuns % 2 === 1) {
      [nextStriker, nextNonStriker] = swapBatters(nextStriker, nextNonStriker);
    }

    if (!wicket && legal && newBalls % 6 === 0) {
      [nextStriker, nextNonStriker] = swapBatters(nextStriker, nextNonStriker);
      nextNeedsBowlerChange = newBalls < Number(totalOvers) * 6;
      nextLastOverBowler = bowler;
    }

    if (wicket && legal && newBalls % 6 === 0) {
      nextNeedsBowlerChange = newBalls < Number(totalOvers) * 6;
      nextLastOverBowler = bowler;
    }

    if (wicket && wickets + 1 < battingPlayers.length - 1) {
      nextNeedsNewBatter = true;
    }

    const nextRuns = runs + totalRuns;
    const nextWickets = wickets + (wicket ? 1 : 0);
    const nextAllOut = nextWickets >= battingPlayers.length - 1;
    const nextOverLimitReached = newBalls >= Number(totalOvers) * 6;
    const chaseWon = innings === 2 && target && nextRuns >= target;
    let nextMatchResult = matchResult;

    if (innings === 2 && chaseWon) {
      nextMatchResult = `${teamB} won by ${battingPlayers.length - 1 - nextWickets} wicket${battingPlayers.length - 1 - nextWickets === 1 ? "" : "s"}`;
    } else if (innings === 2 && (nextAllOut || nextOverLimitReached)) {
      if (nextRuns === firstInnings.runs) {
        nextMatchResult = "Match tied";
      } else {
        nextMatchResult = `${teamA} won by ${firstInnings.runs - nextRuns} run${firstInnings.runs - nextRuns === 1 ? "" : "s"}`;
      }
    }

    const nextState = buildMatchState({
      runs: nextRuns,
      wickets: nextWickets,
      balls: newBalls,
      striker: nextStriker,
      nonStriker: nextNonStriker,
      bowler,
      lastOverBowler: nextLastOverBowler,
      extras: nextExtras,
      battingStats: nextBattingStats,
      bowlingStats: nextBowlingStats,
      dismissedBatters: nextDismissedBatters,
      needsBowlerChange: nextNeedsBowlerChange,
      needsNewBatter: nextNeedsNewBatter,
      matchResult: nextMatchResult,
      matchStatsCommitted: Boolean(nextMatchResult) || matchStatsCommitted,
      history: [...history, ballData],
      lastBall: ballData
    });

    if (nextMatchResult && !matchStatsCommitted) {
      await commitCompletedMatchStats(nextState);
    }

    await saveMatchState(nextState, previousState);
  }

  async function undoLastAction() {
    const previousState = undoStack[undoStack.length - 1];
    if (!previousState || !matchId) return;

    setUndoStack((current) => current.slice(0, -1));
    await saveMatchState(previousState);
  }

  async function chooseNextBowler(nextBowler) {
    if (!nextBowler || nextBowler === lastOverBowler) return;

    const bowlerOvers = Math.floor((bowlingStats[nextBowler]?.balls || 0) / 6);
    if (bowlerOvers >= maxOversPerBowler) return;

    await saveMatchState(
      buildMatchState({
        bowler: nextBowler,
        needsBowlerChange: false
      })
    );
  }

  async function chooseNextBatter(nextBatter) {
    if (!nextBatter || dismissedBatters.includes(nextBatter)) return;

    await saveMatchState(
      buildMatchState({
        striker: nextBatter,
        needsNewBatter: false
      })
    );
  }

  function renderTeamManager() {
    return (
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="label">Team Manager</p>
            <h2>Add teams and players</h2>
          </div>
          <p className="hint">Create teams first, then add the players you want in the match.</p>
        </div>

        <div className="form-row">
          <input
            className="input"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team Name"
          />
          <button className="button primary" onClick={createTeam}>
            Add Team
          </button>
        </div>

        <div className="team-grid">
          {teams.length === 0 ? (
            <p className="empty-state">No teams yet. Create your first team.</p>
          ) : (
            teams.map((team) => (
              <div key={team._id} className="team-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="team-name">{team.name}</p>
                  <button className="button danger compact-button" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => deleteTeam(team._id)}>Delete</button>
                </div>
                <p className="team-tag">{team.players?.length || 0} players</p>
                {team.players?.length > 0 && (
                  <div className="player-list">
                    {team.players.map((player) => (
                      <span key={player} className="player-pill">
                        {player}
                      </span>
                    ))}
                  </div>
                )}
                <div className="player-form">
                  <input
                    className="input compact-input"
                    value={playerNames[team._id] || ""}
                    onChange={(e) =>
                      setPlayerNames((current) => ({
                        ...current,
                        [team._id]: e.target.value
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addPlayerToTeam(team);
                    }}
                    placeholder="Player name"
                  />
                  <button
                    className="button secondary compact-button"
                    onClick={() => addPlayerToTeam(team)}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    );
  }

  function renderMatchSetup() {
    return (
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="label">Match Setup</p>
            <h2>Limited overs match</h2>
          </div>
          <p className="hint">Set match overs. Bowling limit is calculated by cricket limited-over rules.</p>
        </div>

        <div className="form-row">
          <select className="input" value={selectedTournament} onChange={(e) => setSelectedTournament(e.target.value)}>
            <option value="">No Tournament (Individual Match)</option>
            {tournaments.map((t) => (
              <option key={t._id || t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <select className="input" value={teamA} onChange={(e) => {
            const newTeamA = e.target.value;
            setTeamA(newTeamA);
            const team = teams.find(t => t.name === newTeamA);
            if (!matchStarted && team?.players?.length) {
              setStriker(team.players[0]);
              setNonStriker(team.players[1] || team.players[0]);
            }
          }}>
            <option value="">Batting team</option>
            {teams.filter(t => t.players && t.players.length > 0).map((team) => (
              <option key={team._id} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
          <select className="input" value={teamB} onChange={(e) => {
            const newTeamB = e.target.value;
            setTeamB(newTeamB);
            const team = teams.find(t => t.name === newTeamB);
            if (!matchStarted && team?.players?.length) {
              setBowler(team.players[0]);
            }
          }}>
            <option value="">Bowling team</option>
            {teams.filter(t => t.players && t.players.length > 0).map((team) => (
              <option key={team._id} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row three-col">
          <input
            className="input"
            type="number"
            min="1"
            max="50"
            value={totalOvers}
            onChange={(e) => setTotalOvers(e.target.value)}
            placeholder="Overs"
          />
          <select className="input" value={striker} onChange={(e) => setStriker(e.target.value)}>
            {battingPlayers.map((player) => (
              <option key={player} value={player}>
                {player}
              </option>
            ))}
          </select>
          <select className="input" value={nonStriker} onChange={(e) => setNonStriker(e.target.value)}>
            {battingPlayers.map((player) => (
              <option key={player} value={player}>
                {player}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <select className="input" value={bowler} onChange={(e) => setBowler(e.target.value)}>
            {bowlingPlayers.map((player) => (
              <option key={player} value={player}>
                {player}
              </option>
            ))}
          </select>
          <button
            className="button primary"
            onClick={startMatch}
            disabled={!teamA || !teamB || teamA === teamB || striker === nonStriker || !Number(totalOvers)}
          >
            Start Live Match
          </button>
        </div>

        <div className="score-strip">
          <span>{totalOvers || 0} overs</span>
          <span>Max {maxOversPerBowler} overs per bowler</span>
          <span>{teamA || "Batting"} vs {teamB || "Bowling"}</span>
        </div>
      </section>
    );
  }

  function renderLiveScoring() {
    if (!matchStarted) {
      return (
        <section className="panel">
          <p className="empty-state">Start a match from Home to open live scoring.</p>
        </section>
      );
    }

    return (
      <section className="panel live-panel">
        <div className="panel-head">
          <div>
            <p className="label">Live Scoring - Innings {innings}</p>
            <h2>{currentBattingTeam} batting vs {currentBowlingTeam}</h2>
          </div>
          <button className="button secondary" onClick={undoLastAction} disabled={undoStack.length === 0 || matchStatsCommitted}>
            Undo
          </button>
        </div>

        <div className="match-panel">
          <div className="scoreboard">
            <div className="score-card">
              <span className="score-value">{runs}/{wickets}</span>
              <span className="score-label">Score</span>
            </div>
            <div className="score-card">
              <span className="score-value">{formatOvers(balls)}</span>
              <span className="score-label">Overs of {totalOvers}</span>
            </div>
            <div className="score-card">
              <span className="score-value">{balls > 0 ? ((runs / balls) * 6).toFixed(2) : "0.00"}</span>
              <span className="score-label">Run rate</span>
            </div>
          </div>

          <div className="score-strip">
            {innings === 2 && target && <span>Target {target}</span>}
            {innings === 2 && target && <span>Need {Math.max(target - runs, 0)} runs</span>}
            {firstInnings && <span>1st inns: {firstInnings.team} {firstInnings.runs}/{firstInnings.wickets}</span>}
            <span>Extras {extras.wides + extras.noBalls + extras.byes + extras.legByes}</span>
            <span>WD {extras.wides}</span>
            <span>NB {extras.noBalls}</span>
            <span>B {extras.byes}</span>
            <span>LB {extras.legByes}</span>
            <span>Bowler max {maxOversPerBowler} ov</span>
          </div>

          {matchResult && (
            <div className="notice-bar">{matchResult}</div>
          )}

          {inningsComplete && innings === 1 && (
            <div className="notice-card">
              <div>
                <p className="label">Innings complete</p>
                <h3>{teamA} made {runs}/{wickets}</h3>
              </div>
              {!needsSecondInningsSetup ? (
                <button className="button primary" onClick={prepareSecondInnings}>
                  Setup Second Innings
                </button>
              ) : (
                <div className="innings-setup">
                  <select className="input" value={secondStriker} onChange={(e) => setSecondStriker(e.target.value)}>
                    {(selectedTeamB?.players?.length ? selectedTeamB.players : battingPlayers).map((player) => (
                      <option key={player} value={player}>
                        {player}
                      </option>
                    ))}
                  </select>
                  <select className="input" value={secondNonStriker} onChange={(e) => setSecondNonStriker(e.target.value)}>
                    {(selectedTeamB?.players?.length ? selectedTeamB.players : battingPlayers).map((player) => (
                      <option key={player} value={player}>
                        {player}
                      </option>
                    ))}
                  </select>
                  <select className="input" value={secondBowler} onChange={(e) => setSecondBowler(e.target.value)}>
                    {(selectedTeamA?.players?.length ? selectedTeamA.players : bowlingPlayers).map((player) => (
                      <option key={player} value={player}>
                        {player}
                      </option>
                    ))}
                  </select>
                  <button
                    className="button primary"
                    onClick={startSecondInnings}
                    disabled={!secondStriker || !secondNonStriker || !secondBowler || secondStriker === secondNonStriker}
                  >
                    Start Chase
                  </button>
                </div>
              )}
            </div>
          )}

          {inningsComplete && innings === 2 && !matchResult && (
            <div className="notice-bar">Second innings complete</div>
          )}

          {needsBowlerChange && !inningsComplete && (
            <div className="notice-card">
              <div>
                <p className="label">End of over</p>
                <h3>Choose new bowler</h3>
              </div>
              <select
                className="input"
                value=""
                onChange={(e) => chooseNextBowler(e.target.value)}
              >
                <option value="">Select next bowler</option>
                {availableBowlers.map((player) => (
                  <option key={player} value={player}>
                    {player} ({formatOvers(bowlingStats[player]?.balls || 0)} ov)
                  </option>
                ))}
              </select>
              {availableBowlers.length === 0 && (
                <p className="empty-state">No eligible bowler left under the current limit.</p>
              )}
            </div>
          )}

          {needsNewBatter && !inningsComplete && (
            <div className="notice-card">
              <div>
                <p className="label">Wicket</p>
                <h3>Choose next batter</h3>
              </div>
              <select
                className="input"
                value=""
                onChange={(e) => chooseNextBatter(e.target.value)}
              >
                <option value="">Select next batter</option>
                {availableBatters.map((player) => (
                  <option key={player} value={player}>
                    {player}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="last-ball">
            {lastBall ? (
              <>
                Last ball: {lastBall.over}.{lastBall.ball}
                {!lastBall.legal ? " illegal" : ""} -{" "}
                {lastBall.wicket ? lastBall.wicketType : `${lastBall.runs} run${lastBall.runs !== 1 ? "s" : ""}`}
                {lastBall.extraType ? ` (${lastBall.extraType})` : ""} - {lastBall.bowler}
              </>
            ) : (
              "No deliveries yet."
            )}
          </div>

          <div className="scorecard-grid">
            <section className="mini-scorecard">
              <div className="history-header">Batting</div>
              {[striker, nonStriker].map((player) => {
                const stats = getPlayerStats(battingStats, player);

                return (
                  <div key={player} className="stat-line">
                    <span>{player}{player === striker ? " *" : ""}</span>
                    <span>{stats.runs} ({stats.balls})</span>
                    <span>4s {stats.fours}</span>
                    <span>6s {stats.sixes}</span>
                  </div>
                );
              })}
            </section>

            <section className="mini-scorecard">
              <div className="history-header">Bowling</div>
              {bowlingPlayers.map((player) => {
                const stats = getPlayerStats(bowlingStats, player);
                if (stats.balls === 0 && player !== bowler) return null;

                return (
                  <div key={player} className="stat-line">
                    <span>{player}{player === bowler ? " *" : ""}</span>
                    <span>{formatOvers(stats.balls)} ov</span>
                    <span>{stats.runs} runs</span>
                    <span>{stats.wickets} wkts</span>
                  </div>
                );
              })}
            </section>
          </div>

          <div className="button-row run-row">
            {[0, 1, 2, 3, 4, 5, 6].map((run) => (
              <button
                key={run}
                className="button secondary run-button"
                onClick={() => recordDelivery({ batterRuns: run })}
                disabled={unavailableScoring}
              >
                {run}
              </button>
            ))}
            <button className="button danger" onClick={() => recordDelivery({ wicket: true, wicketType: "Wicket" })} disabled={unavailableScoring}>
              Wicket
            </button>
          </div>

          <div className="button-row extras-row">
            <button className="button secondary" onClick={() => recordDelivery({ extraRuns: 1, extraType: "wides", legal: false, rotateOnRuns: false })} disabled={unavailableScoring}>
              Wide
            </button>
            <button className="button secondary" onClick={() => recordDelivery({ extraRuns: 1, extraType: "noBalls", legal: false, rotateOnRuns: false })} disabled={unavailableScoring}>
              No Ball
            </button>
            <button className="button secondary" onClick={() => recordDelivery({ batterRuns: 4, extraRuns: 1, extraType: "noBalls", legal: false, rotateOnRuns: false })} disabled={unavailableScoring}>
              NB + 4
            </button>
            <button className="button secondary" onClick={() => recordDelivery({ extraRuns: 1, extraType: "byes", rotateOnRuns: true })} disabled={unavailableScoring}>
              Bye
            </button>
            <button className="button secondary" onClick={() => recordDelivery({ extraRuns: 1, extraType: "legByes", rotateOnRuns: true })} disabled={unavailableScoring}>
              Leg Bye
            </button>
          </div>

          <div className="history-panel">
            <div className="history-header">Ball-by-ball history</div>
            {history.length === 0 ? (
              <p className="empty-state">No balls recorded yet.</p>
            ) : (
              <div className="history-list">
                {history.slice(-12).reverse().map((ball, index) => (
                  <div key={`${ball.over}-${ball.ball}-${index}`} className="history-item">
                    <span>{ball.over}.{ball.ball}{!ball.legal ? " illegal" : ""}</span>
                    <span>
                      {ball.wicket ? ball.wicketType : `${ball.runs} run${ball.runs !== 1 ? "s" : ""}`}
                      {ball.extraType ? ` (${ball.extraType})` : ""}
                    </span>
                    <span>{ball.striker}</span>
                    <span>{ball.bowler}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {matchResult && renderMatchStats()}
        </div>
      </section>
    );
  }

  function renderMatchStats() {
    const inningsList = getCompletedInnings();

    return (
      <div className="history-panel">
        <div className="history-header">Player stats</div>
        <div className="stats-summary-grid">
          {inningsList.map((item, index) => (
            <section key={`${item.team}-${index}`} className="mini-scorecard">
              <div className="history-header">
                {item.team} - {item.runs}/{item.wickets} ({formatOvers(item.balls)})
              </div>
              <div className="compact-table">
                <div className="compact-row table-head">
                  <span>Batter</span>
                  <span>R</span>
                  <span>B</span>
                  <span>4s</span>
                  <span>6s</span>
                </div>
                {Object.entries(item.battingStats || {}).map(([player, stats]) => (
                  <div key={player} className="compact-row">
                    <span>{player}</span>
                    <span>{stats.runs || 0}</span>
                    <span>{stats.balls || 0}</span>
                    <span>{stats.fours || 0}</span>
                    <span>{stats.sixes || 0}</span>
                  </div>
                ))}
              </div>
              <div className="compact-table">
                <div className="compact-row table-head">
                  <span>Bowler</span>
                  <span>Ov</span>
                  <span>R</span>
                  <span>W</span>
                  <span>WD/NB</span>
                </div>
                {Object.entries(item.bowlingStats || {}).map(([player, stats]) => (
                  <div key={player} className="compact-row">
                    <span>{player}</span>
                    <span>{formatOvers(stats.balls || 0)}</span>
                    <span>{stats.runs || 0}</span>
                    <span>{stats.wickets || 0}</span>
                    <span>{stats.wides || 0}/{stats.noBalls || 0}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  function renderCommentary() {
    if (!matchStarted) {
      return (
        <section className="panel">
          <p className="empty-state">Start a match to see commentary.</p>
        </section>
      );
    }

    const inningsList = getCompletedInnings();

    return (
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="label">Commentary</p>
            <h2>{teamA} vs {teamB}</h2>
          </div>
          {matchResult && <p className="hint">{matchResult}</p>}
        </div>

        <div className="commentary-list">
          {inningsList.map((item, index) => (
            <div key={`${item.team}-${index}`} className="commentary-innings">
              <div className="history-header">
                Innings {index + 1}: {item.team} {item.runs}/{item.wickets} ({formatOvers(item.balls)})
              </div>
              {item.history?.length ? (
                item.history.slice().reverse().map((ball, i) => (
                  <div key={`${index}-${item.history.length - 1 - i}`} className="commentary-item">
                    {formatDelivery(ball)}
                  </div>
                ))
              ) : (
                <p className="empty-state">No deliveries recorded.</p>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderTournamentManager() {
    return (
      <section className="panel ch-card">
        <div className="panel-head">
          <div>
            <p className="label">Tournament Manager</p>
            <h2>Create & Manage Series</h2>
          </div>
          <p className="hint">Group your matches into a tournament or series.</p>
        </div>

        <div className="form-row">
          <input
            className="input"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            placeholder="Tournament Name"
          />
          <button className="button primary" onClick={createTournament}>
            Create Tournament
          </button>
        </div>

        <div className="team-grid">
          {tournaments.length === 0 ? (
            <p className="empty-state">No tournaments yet. Create one above.</p>
          ) : (
            tournaments.map((t) => (
              <div key={t._id || t.name} className="team-card">
                <p className="team-name">{t.name}</p>
                <p className="team-tag">Series</p>
              </div>
            ))
          )}
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="brand-icon">🏏</div>
          <h2>{authMode === "login" ? "Welcome Back!" : "Create Account"}</h2>
          <p className="hint">
            {authMode === "login" ? "Sign in to your CricHeroes dashboard." : "Join CricHeroes to manage your matches."}
          </p>
          <form onSubmit={handleAuthSubmit}>
            {authMode === "signup" && (
              <input 
                type="text" 
                placeholder="Full Name" 
                value={authName} 
                onChange={e => setAuthName(e.target.value)} 
                className="input login-input" 
              />
            )}
            <input 
              type="email" 
              placeholder="Email Address" 
              value={authEmail} 
              onChange={e => setAuthEmail(e.target.value)} 
              className="input login-input" 
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={authPassword} 
              onChange={e => setAuthPassword(e.target.value)} 
              className="input login-input" 
              required
            />
            {authError && <p className="error-text">{authError}</p>}
            <button type="submit" className="button primary full-width">
              {authMode === "login" ? "Login" : "Sign Up"}
            </button>
          </form>
          
          <div className="auth-toggle">
            {authMode === "login" ? (
              <p>Don't have an account? <button className="text-button" onClick={() => { setAuthMode("signup"); setAuthError(""); }}>Sign up</button></p>
            ) : (
              <p>Already have an account? <button className="text-button" onClick={() => { setAuthMode("login"); setAuthError(""); }}>Login</button></p>
            )}
          </div>
        </div>
        {/* NOTE: For production, these styles should be moved to a CSS file. */}
        <style>{`
          .login-screen { display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; font-family: sans-serif; }
          .login-card { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; width: 100%; max-width: 400px; }
          .login-card .brand-icon { font-size: 3rem; background: #0284c7; color: white; width: 80px; height: 80px; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
          .login-card h2 { margin-bottom: 0.5rem; color: #0f172a; }
          .login-card .hint { color: #64748b; margin-bottom: 1.5rem; }
          .login-input { width: 100%; margin-bottom: 1rem; box-sizing: border-box; }
          .full-width { width: 100%; padding: 0.75rem; font-size: 1.1rem; }
          .error-text { color: #ef4444; font-size: 0.875rem; margin-bottom: 1rem; }
          .auth-toggle { margin-top: 1.5rem; font-size: 0.9rem; color: #64748b; }
          .text-button { background: none; border: none; color: #0284c7; font-weight: bold; cursor: pointer; padding: 0; }
          .text-button:hover { text-decoration: underline; }
          .button.danger { background: #ef4444; color: white; border: none; }
          .button.danger:hover { background: #dc2626; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-shell ch-theme-topnav">
      <header className="ch-topnav">
        <div className="brand-block">
          <div className="brand-icon">🏏</div>
          <div>
            <h1>CricHeroes</h1>
          </div>
        </div>
        <nav className="ch-nav">
          <button className={`nav-button ${page === "home" ? "active" : ""}`} onClick={() => setPage("home")}>🏠 Home</button>
          <button className={`nav-button ${page === "tournaments" ? "active" : ""}`} onClick={() => setPage("tournaments")}>🏆 Tournaments</button>
          <button className={`nav-button ${page === "live" ? "active" : ""}`} onClick={() => setPage("live")}>🔴 Live Match</button>
          <button className={`nav-button ${page === "commentary" ? "active" : ""}`} onClick={() => setPage("commentary")}>📝 Commentary</button>
          <button className={`nav-button ${page === "rankings" ? "active" : ""}`} onClick={() => setPage("rankings")}>📊 Rankings</button>
          <button className={`nav-button`} onClick={() => setIsAuthenticated(false)}>🚪 Logout</button>
        </nav>
      </header>

      <main className="content-grid">
        {/* NOTE: For production, these styles should be moved to a CSS file. */}
        <style>{`
          .ch-theme-topnav.app-shell { flex-direction: column; height: 100vh; display: flex; }
          .ch-topnav { background: #0f172a; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; flex-shrink: 0; height: 70px; }
          .ch-topnav .brand-block { display: flex; align-items: center; gap: 0.75rem; }
          .ch-topnav .brand-icon { font-size: 1.5rem; background: #38bdf8; color: white; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
          .ch-topnav h1 { font-size: 1.25rem; margin: 0; color: white; }
          .ch-nav { display: flex; height: 100%; align-items: center; gap: 0.5rem; }
          .ch-nav .nav-button { background: transparent; border: none; color: #cbd5e1; padding: 0 1rem; height: 100%; font-size: 0.95rem; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; }
          .ch-nav .nav-button:hover { background: #1e293b; color: white; }
          .ch-nav .nav-button.active { color: #38bdf8; border-bottom-color: #38bdf8; font-weight: bold; background: #1e293b; }
          .content-grid { background: #f8fafc; flex: 1; padding: 2rem; overflow-y: auto; }
          .panel { border: none; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-radius: 16px; margin-bottom: 2rem; }
          .panel-head { border-bottom: 1px solid #f1f5f9; padding-bottom: 1.5rem; margin-bottom: 1.5rem; }
          .panel-head h2 { color: #0f172a; font-size: 1.5rem; }
          .button.primary { background: #0284c7; border-radius: 8px; font-weight: 600; }
          .button.primary:hover { background: #0369a1; }
          .button.danger { background: #ef4444; color: white; border-radius: 8px; font-weight: 600; border: none; }
          .button.danger:hover { background: #dc2626; }
          .compact-button { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
          .score-card { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 1.5rem; }
          .score-value { color: #0369a1; font-size: 2.5rem; }
        `}</style>

        {page === "home" && (
          <>
            {renderTeamManager()}
            {renderMatchSetup()}
          </>
        )}

        {page === "tournaments" && renderTournamentManager()}

        {page === "live" && renderLiveScoring()}

        {page === "commentary" && renderCommentary()}

        {page === "rankings" && (
          <section className="panel rankings-panel">
            <Rankings />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;