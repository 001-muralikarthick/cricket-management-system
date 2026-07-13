import { useEffect, useMemo, useState } from "react";
import { GoogleLogin } from '@react-oauth/google';
import API from "./api";
import socket from "./socket";
import Rankings from "./pages/Rankings";
import PastMatches from "./pages/PastMatches";
import MatchDetails from "./pages/MatchDetails";
import Tournament from "./pages/Tournament";
import TeamManager from "./pages/TeamManager";
import { FIELDING_REGIONS } from "./constants";
import PlayerAnalyticsDashboard from "./pages/PlayerAnalyticsDashboard";
import UserProfile from "./pages/UserProfile";
import StadiumView from "./pages/StadiumView";
import AICommentary from "./components/AICommentary";
import "./App.css";

const emptyExtras = {
  wides: 0,
  noBalls: 0,
  byes: 0,
  legByes: 0
};

const WAGON_WHEEL_REGIONS = [
  { id: 'Third Man', start: 90, end: 150, radius: 'full' },
  { id: 'Point', start: 150, end: 185, radius: 'inner' },
  { id: 'Deep Point', start: 150, end: 245, radius: 'outer' },
  { id: 'Cover', start: 185, end: 215, radius: 'inner' },
  { id: 'Extra Cover', start: 215, end: 245, radius: 'inner' },
  { id: 'Mid Off', start: 245, end: 270, radius: 'inner' },
  { id: 'Long Off', start: 245, end: 270, radius: 'outer' },
  { id: 'Mid On', start: 270, end: 300, radius: 'inner' },
  { id: 'Long On', start: 270, end: 300, radius: 'outer' },
  { id: 'Mid Wicket', start: 300, end: 330, radius: 'inner' },
  { id: 'Deep Mid Wicket', start: 300, end: 330, radius: 'outer' },
  { id: 'Square Leg', start: 330, end: 390, radius: 'inner' },
  { id: 'Deep Square Leg', start: 330, end: 390, radius: 'outer' },
  { id: 'Fine Leg', start: 390, end: 450, radius: 'full' },
];

const defaultBattingPlayers = ["Batsman 1", "Batsman 2", "Batsman 3", "Batsman 4", "Batsman 5"];
const defaultBowlingPlayers = ["Bowler 1", "Bowler 2", "Bowler 3", "Bowler 4", "Bowler 5"];

const defaultPlayerStats = {
  runs: 0,
  balls: 0,
  fours: 0,
  sixes: 0,
  wickets: 0,
  wides: 0,
  noBalls: 0
};

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("cric-theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cric-theme", theme);
  }, [theme]);

  const cycleTheme = () => {
    const themes = ["light", "dark", "green"];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const [page, setPage] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [playerNames, setPlayerNames] = useState({});
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [totalOvers, setTotalOvers] = useState(10);
  const [matchId, setMatchId] = useState(null);
  const [selectedPastMatchId, setSelectedPastMatchId] = useState(null);
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
  const [selectedRegion, setSelectedRegion] = useState("");
  const [pendingDelivery, setPendingDelivery] = useState(null);
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [userRole, setUserRole] = useState("Player");
  const [tournaments, setTournaments] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
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
    if (isAuthenticated) {
      fetchTeams();
      fetchTournaments();
      fetchAllPlayers();
    }
  }, [isAuthenticated]);

  async function fetchAllPlayers() {
    try {
      const res = await API.get("/players");
      setAllPlayers(res.data || []);
    } catch (err) {
      console.warn("API not available, skipping players fetch", err);
    }
  }

  useEffect(() => {
    const handleLiveUpdate = (data) => {
      applyMatchState(data);
    };
    socket.on("live_update", handleLiveUpdate);
    return () => socket.off("live_update", handleLiveUpdate);
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
      tournament: selectedTournament,
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
    return stats[player] || defaultPlayerStats;
  }

  function swapBatters(first, second) {
    return [second, first];
  }

  async function saveMatchState(nextState, previousState = null) {
    applyMatchState(nextState);
    if (previousState) {
      setUndoStack((current) => [...current, previousState].slice(-20));
    }
    try {
      await API.put(`/matches/${matchId}`, nextState);
    } catch (err) {
      console.warn("API not available, saving locally only", err);
    }
    try {
      socket.emit("update_match", { matchId, updatedMatch: nextState });
    } catch (err) {
      console.warn("Socket not available", err);
    }
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
    const scoreText = ball.wicket ? ball.wicketType : `${ball.runs} run${ball.runs === 1 ? "" : "s"}`;
    const extraText = ball.extraType ? ` (${ball.extraType})` : "";
    return `${ball.over}.${ball.ball}${ball.legal ? "" : " illegal"} - ${ball.striker} vs ${ball.bowler}: ${scoreText}${extraText}`;
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");
    try {
      if (authMode === "login") {
        if (!authEmail || !authPassword) {
          setAuthError("Please enter your email and password.");
          return;
        }
        const res = await API.post("/auth/login", { email: authEmail, password: authPassword });
        if (res.data.user) {
          setAuthName(res.data.user.username);
          setAuthEmail(res.data.user.email);
          setUserRole(res.data.user.role || "Player");
        }
        setIsAuthenticated(true);
      } else {
        if (!authName || !authEmail || authPassword.length < 6) {
          setAuthError("Please fill all fields. Password must be 6+ chars.");
          return;
        }
        const res = await API.post("/auth/signup", { username: authName, name: authName, email: authEmail, password: authPassword });
        if (res.data.user) {
          setAuthName(res.data.user.username);
          setAuthEmail(res.data.user.email);
          setUserRole(res.data.user.role || "Player");
        }
        setIsAuthenticated(true);
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || "Authentication failed. Server might be offline.");
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      const res = await API.post("/auth/google", { token: credential });
      if (res.data.user) {
        setAuthName(res.data.user.username);
        setAuthEmail(res.data.user.email);
        setUserRole(res.data.user.role || "Player");
      }
      setIsAuthenticated(true);
    } catch (err) {
      console.error(err);
      setAuthError("Google authentication failed.");
    }
  };

  const handleGoogleError = () => {
    setAuthError("Google authentication failed.");
  };

  async function fetchTeams() {
    try {
      const res = await API.get("/teams");
      setTeams(res.data || []);
    } catch (err) {
      console.warn("API not available, keeping local state", err);
    }
  }

  async function createTeam() {
    if (!teamName.trim()) return;
    try {
      await API.post("/teams", { name: teamName, players: [] });
      fetchTeams();
    } catch (err) {
      console.warn("API not available, saving locally", err);
      setTeams((prev) => [...prev, { _id: Date.now().toString(), name: teamName, players: [] }]);
    }
    setTeamName("");
  }

  async function deleteTeam(teamId) {
    try {
      await API.delete(`/teams/${teamId}`);
      fetchTeams();
    } catch (error) {
      console.warn("API not available, deleting locally", error);
      setTeams((prev) => prev.filter(t => t._id !== teamId));
    }
  }

  async function addPlayerToTeam(team) {
    const playerName = playerNames[team._id]?.trim();
    if (!playerName) return;
    const existingPlayer = allPlayers.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (existingPlayer) {
      if (team.players && team.players.includes(existingPlayer.name)) {
        alert(`${existingPlayer.name} is already in the team.`);
        return;
      }
      try {
        const newPlayers = [...(team.players || []), existingPlayer.name];
        await API.put(`/teams/${team._id}`, { players: newPlayers });
        await API.put(`/players/${existingPlayer._id}`, { team: team.name });
        fetchTeams();
        fetchAllPlayers();
      } catch (err) {
        console.warn("API not available, adding existing player locally", err);
        setTeams((prev) => prev.map(t => t._id === team._id ? { ...t, players: [...(t.players || []), existingPlayer.name] } : t));
      }
    } else {
      try {
        await API.post("/players", { name: playerName, teamId: team._id });
        fetchTeams();
        fetchAllPlayers();
      } catch (err) {
        console.warn("API not available, adding player locally", err);
        setTeams((prev) => prev.map(t => {
          if (t._id === team._id) {
            return { ...t, players: [...(t.players || []), playerName] };
          }
          return t;
        }));
      }
    }
    setPlayerNames((current) => ({ ...current, [team._id]: "" }));
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
      setTournaments((prev) => [...prev, { _id: Date.now().toString(), name: tournamentName }]);
    }
    setTournamentName("");
  }

  async function startMatch(configOverride) {
    const tA = configOverride?.teamA || teamA;
    const tB = configOverride?.teamB || teamB;
    const tStr = configOverride?.striker || striker;
    const tNon = configOverride?.nonStriker || nonStriker;
    const tBowl = configOverride?.bowler || bowler;
    const tOvers = configOverride?.totalOvers || totalOvers;
    const tTour = configOverride?.tournament !== undefined ? configOverride.tournament : selectedTournament;
    if (!tA || !tB || tA === tB || tStr === tNon) return;

    const matchState = {
      tournament: tTour,
      teamA: tA,
      teamB: tB,
      totalOvers: Number(tOvers),
      innings: 1,
      firstInnings: null,
      matchResult: "",
      matchStatsCommitted: false,
      needsSecondInningsSetup: false,
      runs: 0,
      wickets: 0,
      balls: 0,
      striker: tStr,
      nonStriker: tNon,
      bowler: tBowl,
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

    let matchIdToUse;
    try {
      const res = await API.post("/matches", matchState);
      matchIdToUse = res.data._id;
    } catch (err) {
      console.warn("API not available, using local match ID", err);
      matchIdToUse = Date.now().toString();
    }

    setMatchId(matchIdToUse);
    setMatchStarted(true);
    setInnings(1);
    setFirstInnings(null);
    setMatchResult("");
    setMatchStatsCommitted(false);
    setNeedsSecondInningsSetup(false);
    setUndoStack([]);
    applyMatchState(matchState);

    if (configOverride) {
      setTeamA(tA);
      setTeamB(tB);
      setSelectedTournament(tTour);
      setTotalOvers(tOvers);
      setStriker(tStr);
      setNonStriker(tNon);
      setBowler(tBowl);
    }

    setPage("live");
    try {
      socket.emit("join_match", matchIdToUse);
    } catch (err) {
      console.warn("Socket not available", err);
    }
  }

  async function resumeMatch(matchId) {
    try {
      const res = await API.get(`/matches/${matchId}`);
      const matchState = res.data;
      setMatchId(matchState._id);
      setMatchStarted(true);
      setTeamA(matchState.teamA);
      setTeamB(matchState.teamB);
      if (matchState.tournament) {
        setSelectedTournament(matchState.tournament);
      }
      setUndoStack([]);
      applyMatchState(matchState);
      setPage("live");
      try {
        socket.emit("join_match", matchState._id);
      } catch (err) {
        console.warn("Socket not available", err);
      }
    } catch (err) {
      console.error("Failed to resume match:", err);
      alert("Failed to load match details.");
    }
  }

  async function prepareSecondInnings() {
    if (!matchId || innings !== 1 || !inningsComplete) return;
    const secondBattingPlayers = selectedTeamB?.players?.length ? selectedTeamB.players : defaultBattingPlayers;
    const secondBowlingPlayers = selectedTeamA?.players?.length ? selectedTeamA.players : defaultBowlingPlayers;
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
      runs, wickets, balls, extras, battingStats, bowlingStats, history
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

  async function manualSwapBatters() {
    if (unavailableScoring) return;
    const previousState = buildMatchState();
    const [nextStriker, nextNonStriker] = swapBatters(striker, nonStriker);
    const nextState = buildMatchState({ striker: nextStriker, nonStriker: nextNonStriker });
    await saveMatchState(nextState, previousState);
  }

  function initiateDelivery(params) {
    if (unavailableScoring) return;
    if (params.batterRuns > 0) {
      setPendingDelivery(params);
    } else {
      recordDelivery(params);
    }
  }

  async function recordDelivery({
    batterRuns = 0,
    extraRuns = 0,
    extraType = "",
    wicket = false,
    wicketType = "",
    legal = true,
    rotateOnRuns = true,
    shotRegion = selectedRegion
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
      runs: 0, balls: 0, fours: 0, sixes: 0, wagonWheel: {},
      ...nextBattingStats[striker]
    };
    const bowlerStats = {
      balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0,
      ...nextBowlingStats[bowler]
    };

    strikerStats.runs += batterRuns;
    if (legal) strikerStats.balls += 1;
    if (batterRuns === 4) strikerStats.fours += 1;
    if (batterRuns === 6) strikerStats.sixes += 1;
    if (batterRuns > 0 && shotRegion) {
      if (!strikerStats.wagonWheel) strikerStats.wagonWheel = {};
      strikerStats.wagonWheel[shotRegion] = (strikerStats.wagonWheel[shotRegion] || 0) + batterRuns;
    }

    if (legal) bowlerStats.balls += 1;
    bowlerStats.runs += extraType === "byes" || extraType === "legByes" ? batterRuns : totalRuns;
    if (wicket) bowlerStats.wickets += 1;
    if (extraType === "wides") { nextExtras.wides += extraRuns; bowlerStats.wides += extraRuns; }
    if (extraType === "noBalls") { nextExtras.noBalls += extraRuns; bowlerStats.noBalls += extraRuns; }
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
      striker,
      shotRegion: shotRegion
    };

    setSelectedRegion("");

    let nextStriker = striker;
    let nextNonStriker = nonStriker;
    let nextNeedsNewBatter = false;
    let nextNeedsBowlerChange = false;
    let nextLastOverBowler = lastOverBowler;
    const nextDismissedBatters = wicket ? [...dismissedBatters, striker] : dismissedBatters;

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

  function simulateNextBall() {
    if (unavailableScoring) return;
    
    const isWicket = Math.random() < 0.06;
    const isExtra = Math.random() < 0.08;
    
    let batterRuns = 0;
    let extraRuns = 0;
    let extraType = "";
    let wicket = false;
    let wicketType = "";
    let legal = true;
    let rotateOnRuns = true;
    
    if (isWicket) {
      wicket = true;
      const types = ["Caught", "Bowled", "LBW", "Run Out"];
      wicketType = types[Math.floor(Math.random() * types.length)];
      if (wicketType === "Run Out") {
        batterRuns = Math.random() < 0.35 ? 1 : 0;
        legal = true;
      } else {
        batterRuns = 0;
        legal = true;
      }
    } else if (isExtra) {
      const types = ["wides", "noBalls", "byes", "legByes"];
      extraType = types[Math.floor(Math.random() * types.length)];
      extraRuns = 1;
      
      if (extraType === "wides") {
        legal = false;
        rotateOnRuns = false;
        const extraRand = Math.random();
        if (extraRand < 0.06) extraRuns = 5;
        else if (extraRand < 0.18) extraRuns = 2;
      } else if (extraType === "noBalls") {
        legal = false;
        rotateOnRuns = false;
        const runsRand = Math.random();
        if (runsRand < 0.45) batterRuns = 0;
        else if (runsRand < 0.75) batterRuns = 1;
        else if (runsRand < 0.88) batterRuns = 4;
        else batterRuns = 6;
      } else {
        legal = true;
        rotateOnRuns = true;
        const runsRand = Math.random();
        if (runsRand < 0.7) extraRuns = 1;
        else if (runsRand < 0.95) extraRuns = 2;
        else extraRuns = 4;
      }
    } else {
      const rand = Math.random();
      if (rand < 0.45) batterRuns = 0;
      else if (rand < 0.80) batterRuns = 1;
      else if (rand < 0.91) batterRuns = 2;
      else if (rand < 0.92) batterRuns = 3;
      else if (rand < 0.97) batterRuns = 4;
      else batterRuns = 6;
    }
    
    let shotRegion = "";
    if (batterRuns > 0) {
      const regions = [
        "Third Man", "Point", "Deep Point", "Cover", "Extra Cover", 
        "Mid Off", "Long Off", "Mid On", "Long On", 
        "Mid Wicket", "Deep Mid Wicket", "Square Leg", "Deep Square Leg", "Fine Leg"
      ];
      
      if (batterRuns === 4 || batterRuns === 6) {
        const boundaryRegions = [
          "Third Man", "Deep Point", "Long Off", "Long On", 
          "Deep Mid Wicket", "Deep Square Leg", "Fine Leg"
        ];
        shotRegion = boundaryRegions[Math.floor(Math.random() * boundaryRegions.length)];
      } else {
        shotRegion = regions[Math.floor(Math.random() * regions.length)];
      }
    }
    
    recordDelivery({
      batterRuns,
      extraRuns,
      extraType,
      wicket,
      wicketType,
      legal,
      rotateOnRuns,
      shotRegion
    });
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
    await saveMatchState(buildMatchState({ bowler: nextBowler, needsBowlerChange: false }));
  }

  async function chooseNextBatter(nextBatter) {
    if (!nextBatter || dismissedBatters.includes(nextBatter)) return;
    await saveMatchState(buildMatchState({ striker: nextBatter, needsNewBatter: false }));
  }

  async function updatePlayerRole(playerId, updates) {
    try {
      await API.put(`/players/${playerId}`, updates);
      fetchAllPlayers();
    } catch (err) {
      console.warn("Could not update player role", err);
    }
  }

  async function updateTeamLeaders(teamId, updates) {
    try {
      await API.put(`/teams/${teamId}`, updates);
      fetchTeams();
    } catch (err) {
      console.warn("Could not update team leaders locally", err);
      setTeams((prev) => prev.map(t => t._id === teamId ? { ...t, ...updates } : t));
    }
  }

  async function movePlayer(team, index, direction) {
    const newPlayers = [...team.players];
    if (direction === -1 && index > 0) {
      [newPlayers[index - 1], newPlayers[index]] = [newPlayers[index], newPlayers[index - 1]];
    } else if (direction === 1 && index < newPlayers.length - 1) {
      [newPlayers[index + 1], newPlayers[index]] = [newPlayers[index], newPlayers[index + 1]];
    } else {
      return;
    }
    try {
      await API.put(`/teams/${team._id}`, { players: newPlayers });
      fetchTeams();
    } catch (err) {
      console.warn("Could not update team order locally", err);
      setTeams((prev) => prev.map(t => t._id === team._id ? { ...t, players: newPlayers } : t));
    }
  }

  function renderMiniLiveScorecard() {
    if (!matchStarted || matchResult) return null;

    const currentOver = `${Math.floor(balls / 6)}.${balls % 6}`;
    const crr = balls > 0 ? ((runs / balls) * 6).toFixed(2) : "0.00";
    const ballsRemaining = (Number(totalOvers) * 6) - balls;
    
    return (
      <div 
        className="fade-in"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '20px',
          border: '2px solid #ef4444',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.25)',
          padding: '1.75rem',
          color: 'white',
          maxWidth: '1000px',
          margin: '0 auto 2rem',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'left'
        }}
      >
        {/* Glowing Live Indicator */}
        <div style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(239, 68, 68, 0.2)',
          padding: '0.35rem 0.75rem',
          borderRadius: '20px',
          border: '1px solid rgba(239, 68, 68, 0.4)'
        }}>
          <span className="loading-pulse" style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 8px #ef4444'
          }}></span>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#f87171' }}>Live Match</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {selectedTournament ? 'Tournament Match' : 'Friendly Series'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'white' }}>
                {currentBattingTeam} vs {currentBowlingTeam}
              </h2>
              <span style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                Innings {innings}
              </span>
            </div>
            
            {/* Real-time score readout */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginTop: '0.75rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: '900', color: '#f59e0b', textShadow: '0 2px 10px rgba(245, 158, 11, 0.3)' }}>
                {runs}/{wickets}
              </span>
              <span style={{ fontSize: '1.25rem', color: '#e2e8f0', fontWeight: '600' }}>
                ({currentOver} Overs)
              </span>
            </div>

            {/* Run Rate */}
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.25rem', fontWeight: '500' }}>
              Current Run Rate (CRR): <strong style={{ color: 'white' }}>{crr}</strong>
              {innings === 2 && target && (
                <span style={{ marginLeft: '1.5rem', display: 'inline-block' }}>
                  Target: <strong style={{ color: '#fb923c' }}>{target}</strong> (Need <strong style={{ color: '#ef4444' }}>{target - runs}</strong> runs from <strong style={{ color: '#ef4444' }}>{ballsRemaining}</strong> balls)
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ minWidth: '100px' }}>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px' }}>STRIKER</span>
                <strong style={{ color: 'white', display: 'block', fontSize: '0.9rem', margin: '0.1rem 0' }}>🏏 {striker}*</strong>
                <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                  {battingStats[striker]?.runs || 0} runs ({battingStats[striker]?.balls || 0}b)
                </span>
              </div>
              <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
              <div style={{ minWidth: '100px' }}>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px' }}>BOWLER</span>
                <strong style={{ color: 'white', display: 'block', fontSize: '0.9rem', margin: '0.1rem 0' }}>🎯 {bowler}</strong>
                <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                  {bowlingStats[bowler]?.wickets || 0}/{bowlingStats[bowler]?.runs || 0} ({Math.floor((bowlingStats[bowler]?.balls || 0) / 6)}.{ (bowlingStats[bowler]?.balls || 0) % 6 } ov)
                </span>
              </div>
            </div>

            <button 
              className="button primary" 
              onClick={() => setPage("live")}
              style={{
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                border: 'none',
                padding: '0.875rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: '700',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'white'
              }}
            >
              <span>🔴 Enter Match Center</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderHomePage() {
    return (
      <>
        {renderMiniLiveScorecard()}
        <section className="panel" style={{ 
          textAlign: 'center', 
          padding: '50px 32px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
          borderRadius: '24px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle background glow effect */}
          <div style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '250px',
            background: 'radial-gradient(ellipse, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 1
          }}></div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '1.25rem', animation: 'bounce 3s infinite' }}>🏏</div>
            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: 900, 
              marginBottom: '1rem', 
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent', 
              backgroundClip: 'text',
              letterSpacing: '-0.5px'
            }}>
              Welcome to CricHeroes
            </h1>
            <p style={{ 
              fontSize: '1.15rem', 
              color: '#94a3b8', 
              maxWidth: '750px', 
              margin: '0 auto 2.5rem', 
              lineHeight: 1.7,
              fontWeight: '500'
            }}>
              The ultimate cricket management platform for teams, tournaments, and live match scoring. Build squads, track player stats, and experience real-time match updates.
            </p>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: '1.5rem', 
              maxWidth: '1000px', 
              margin: '0 auto 2.5rem' 
            }}>
              {[
                { icon: '🏟️', title: 'Team Management', desc: 'Create teams, add players, assign roles, and set captains. Build your perfect squad.', action: () => setPage("team-manager") },
                { icon: '🏆', title: 'Tournaments', desc: 'Organize matches into tournaments and series. Track standings and manage brackets.', action: () => setPage("tournaments") },
                { icon: '🔴', title: 'Live Scoring', desc: 'Real-time score updates with ball-by-ball commentary, win probability, and momentum graphs.', action: () => setPage("live") },
                { icon: '📊', title: 'Analytics Hub', desc: 'Detailed player statistics, rankings, performance trends, and comparative analysis.', action: () => setPage("analytics") }
              ].map((card, idx) => (
                <div 
                  key={idx} 
                  className="analytics-card" 
                  onClick={card.action}
                  style={{ 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                    e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(14, 165, 233, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{card.icon}</div>
                  <h3 style={{ marginBottom: '0.5rem', color: '#f8fafc', fontWeight: '700' }}>{card.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{card.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                className="button primary" 
                onClick={() => setPage("team-manager")} 
                style={{ 
                  minWidth: '180px', 
                  padding: '0.875rem 1.75rem',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)'
                }}
              >
                🏟️ Manage Teams
              </button>
              <button 
                className="button secondary" 
                onClick={() => setPage("tournaments")} 
                style={{ 
                  minWidth: '180px', 
                  padding: '0.875rem 1.75rem',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              >
                🏆 View Tournaments
              </button>
            </div>
          </div>
        </section>

        <section className="panel" style={{ 
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
          border: '1px solid #e2e8f0'
        }}>
          <div className="panel-head" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div>
              <p className="label" style={{ fontSize: '0.8rem', letterSpacing: '0.15em', fontWeight: '700', color: '#0ea5e9' }}>🏏 MATCH CENTER</p>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>Quick Play & Tournaments</h2>
              <p className="hint" style={{ maxWidth: '600px', margin: '0 auto', color: '#64748b' }}>Visit the Tournaments page to start quick matches and manage tournaments.</p>
            </div>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '2.5rem',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            borderRadius: '20px',
            border: '1px solid #bbf7d0',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '1rem', animation: 'bounce 3s infinite' }}>🏆</div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: '800', color: '#166534' }}>All-in-One Tournament Center</h3>
            <p style={{ fontSize: '0.95rem', color: '#14532d', maxWidth: '500px', margin: '0 auto 1.75rem', lineHeight: 1.6, fontWeight: '500' }}>
              Create tournaments, organize matches, and start live scoring - all from one place.
            </p>
            <button 
              className="button primary" 
              onClick={() => setPage("tournaments")} 
              style={{ 
                padding: '1rem 2.5rem', 
                fontSize: '1rem', 
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
                boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              🏆 Go to Tournament Center
            </button>
          </div>
        </section>

        <section className="panel" style={{ 
          borderRadius: '24px', 
          padding: '2.5rem',
          background: 'white',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
        }}>
          <div className="panel-head" style={{ marginBottom: '2rem' }}>
            <div>
              <p className="label" style={{ color: '#0ea5e9', fontWeight: '700' }}>FEATURES</p>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>Everything You Need</h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: '✅', title: 'Live Scoring', desc: 'Real-time ball-by-ball updates', color: '#ecfdf5', border: '#a7f3d0', iconBg: '#10b981' },
              { icon: '📈', title: 'Win Probability', desc: 'Dynamic match predictions', color: '#eff6ff', border: '#bfdbfe', iconBg: '#3b82f6' },
              { icon: '🎯', title: 'Wagon Wheel', desc: 'Visual shot mapping', color: '#fef2f2', border: '#fecaca', iconBg: '#ef4444' },
              { icon: '👥', title: 'Player Roles', desc: 'Captain, VC, and role assignment', color: '#f5f3ff', border: '#ddd6fe', iconBg: '#8b5cf6' },
              { icon: '📊', title: 'Rankings', desc: 'Player and team leaderboards', color: '#fdf2f8', border: '#fbcfe8', iconBg: '#ec4899' },
              { icon: '📝', title: 'Commentary', desc: 'Detailed ball-by-ball text', color: '#fff7ed', border: '#ffedd5', iconBg: '#f97316' },
              { icon: '📄', title: 'PDF Export', desc: 'Download match scorecards', color: '#f0fdfa', border: '#ccfbf1', iconBg: '#14b8a6' },
              { icon: '🏆', title: 'Tournaments', desc: 'Series and bracket management', color: '#fefaf0', border: '#fef3c7', iconBg: '#f59e0b' },
            ].map((feature, idx) => (
              <div 
                key={idx} 
                style={{ 
                  padding: '1.5rem', 
                  background: feature.color, 
                  borderRadius: '16px', 
                  border: `1px solid ${feature.border}`, 
                  textAlign: 'center',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 8px 20px -6px ${feature.iconBg}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  fontSize: '1.75rem', 
                  marginBottom: '0.75rem',
                  width: '50px',
                  height: '50px',
                  background: 'white',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>{feature.icon}</div>
                <h4 style={{ marginBottom: '0.25rem', fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>{feature.title}</h4>
                <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </>
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
              <option key={t._id || t.name} value={t._id}>{t.name}</option>
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
              <option key={team._id} value={team.name}>{team.name}</option>
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
              <option key={team._id} value={team.name}>{team.name}</option>
            ))}
          </select>
        </div>

        <div className="form-row three-col">
          <input className="input" type="number" min="1" max="50" value={totalOvers} onChange={(e) => setTotalOvers(e.target.value)} placeholder="Overs" />
          <select className="input" value={striker} onChange={(e) => setStriker(e.target.value)}>
            {battingPlayers.map((player) => <option key={player} value={player}>{player}</option>)}
          </select>
          <select className="input" value={nonStriker} onChange={(e) => setNonStriker(e.target.value)}>
            {battingPlayers.map((player) => <option key={player} value={player}>{player}</option>)}
          </select>
        </div>

        <div className="form-row">
          <select className="input" value={bowler} onChange={(e) => setBowler(e.target.value)}>
            {bowlingPlayers.map((player) => <option key={player} value={player}>{player}</option>)}
          </select>
          <button className="button primary" onClick={startMatch} disabled={!teamA || !teamB || teamA === teamB || striker === nonStriker || !Number(totalOvers)}>
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

  function calculateWinProbability() {
    if (!matchStarted) return { [teamA]: "50.0", [teamB]: "50.0" };
    let probBatting = 50;
    const crr = balls > 0 ? (runs / balls) * 6 : 0;
    const wicketsInHand = battingPlayers.length - 1 - wickets;
    const ballsRemaining = (Number(totalOvers) * 6) - balls;
    if (innings === 1) {
      probBatting = 40 + (crr * 2) + (wicketsInHand * 1.5) - ((balls / 6) * 0.5);
    } else if (innings === 2 && target) {
      const runsNeeded = target - runs;
      if (runsNeeded <= 0) return { [teamA]: currentBattingTeam === teamA ? "100.0" : "0.0", [teamB]: currentBattingTeam === teamB ? "100.0" : "0.0" };
      if (ballsRemaining <= 0 || wicketsInHand <= 0) return { [teamA]: currentBattingTeam === teamA ? "0.0" : "100.0", [teamB]: currentBattingTeam === teamB ? "0.0" : "100.0" };
      const rrr = (runsNeeded / ballsRemaining) * 6;
      probBatting = 50 + ((crr - rrr) * 4) + ((wicketsInHand - 5) * 5);
    }
    probBatting = Math.max(1, Math.min(99, probBatting));
    const probTeamA = currentBattingTeam === teamA ? probBatting : 100 - probBatting;
    const probTeamB = 100 - probTeamA;
    return { [teamA]: probTeamA.toFixed(1), [teamB]: probTeamB.toFixed(1) };
  }

  function renderMomentumGraph() {
    if (history.length === 0) return <p className="empty-state">No data yet</p>;
    const overStats = [];
    let currentOver = 0;
    let currentOverRuns = 0;
    let currentOverWickets = 0;
    history.forEach(ball => {
      if (ball.over !== currentOver) {
        overStats.push({ over: currentOver, runs: currentOverRuns, wickets: currentOverWickets });
        currentOver = ball.over;
        currentOverRuns = 0;
        currentOverWickets = 0;
      }
      currentOverRuns += ball.runs;
      if (ball.wicket) currentOverWickets += 1;
    });
    overStats.push({ over: currentOver, runs: currentOverRuns, wickets: currentOverWickets });
    const maxRuns = Math.max(...overStats.map(o => o.runs), 10);
    return (
      <div className="momentum-chart" style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '4px', padding: '10px 0', borderBottom: '1px solid #cbd5e1' }}>
        {overStats.map((stat, i) => {
          const heightPct = (stat.runs / maxRuns) * 100;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
              {stat.wickets > 0 && <div style={{ color: '#ef4444', fontSize: '10px', fontWeight: 'bold' }}>{'W'.repeat(stat.wickets)}</div>}
              <div style={{ height: `${heightPct}%`, width: '100%', background: currentBattingTeam === teamA ? '#38bdf8' : '#fbbf24', borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.3s ease' }} title={`Over ${stat.over + 1}: ${stat.runs} runs`}></div>
              <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{stat.over + 1}</span>
            </div>
          );
        })}
      </div>
    );
  }

  function calculateActivePartnership() {
    if (!matchStarted) {
      return { runs: 0, balls: 0, strikerRuns: 0, strikerBalls: 0, nonStrikerRuns: 0, nonStrikerBalls: 0, extras: 0 };
    }

    // Find the index of the last delivery that resulted in a wicket
    let lastWicketIndex = -1;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].wicket) {
        lastWicketIndex = i;
        break;
      }
    }

    // All deliveries in the current partnership are after the last wicket
    const partnershipDeliveries = history.slice(lastWicketIndex + 1);

    let partnershipRuns = 0;
    let partnershipBalls = 0;
    let strikerRuns = 0;
    let strikerBalls = 0;
    let nonStrikerRuns = 0;
    let nonStrikerBalls = 0;
    let extrasRuns = 0;

    partnershipDeliveries.forEach(ball => {
      partnershipRuns += ball.runs;
      if (ball.legal) partnershipBalls += 1;

      if (ball.striker === striker) {
        strikerRuns += ball.batterRuns;
        if (ball.legal) strikerBalls += 1;
      } else if (ball.striker === nonStriker) {
        nonStrikerRuns += ball.batterRuns;
        if (ball.legal) nonStrikerBalls += 1;
      }
      
      extrasRuns += ball.extras;
    });

    return {
      runs: partnershipRuns,
      balls: partnershipBalls,
      strikerRuns,
      strikerBalls,
      nonStrikerRuns,
      nonStrikerBalls,
      extras: extrasRuns
    };
  }

  function renderPartnershipTracker() {
    if (!matchStarted || inningsComplete || matchResult) return null;

    const partnership = calculateActivePartnership();
    
    // Get total career/match runs of each batter for context
    const s1Stats = battingStats[striker] || { runs: 0, balls: 0 };
    const s2Stats = battingStats[nonStriker] || { runs: 0, balls: 0 };

    const totalRuns = partnership.runs;
    const totalBalls = partnership.balls;
    
    // Circle math (Radius = 36, Circumference = 226.19)
    const r = 36;
    const C = 226.19;

    const r1 = partnership.strikerRuns;
    const r2 = partnership.nonStrikerRuns;
    const ext = partnership.extras;

    const p1 = totalRuns > 0 ? r1 / totalRuns : 0.5;
    const p2 = totalRuns > 0 ? r2 / totalRuns : 0.5;
    const pE = totalRuns > 0 ? ext / totalRuns : 0;

    // Segment offsets and rotations
    const strokeDashoffset1 = C * (1 - p1);
    const strokeDashoffset2 = C * (1 - p2);
    const strokeDashoffsetE = C * (1 - pE);

    const rot1 = -90;
    const rot2 = -90 + (p1 * 360);
    const rotE = -90 + ((p1 + p2) * 360);

    const p1Pct = totalRuns > 0 ? Math.round(p1 * 100) : 50;
    const p2Pct = totalRuns > 0 ? Math.round(p2 * 100) : 50;

    return (
      <div 
        className="partnership-tracker-card"
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.55) 0%, rgba(30, 41, 59, 0.4) 100%)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Glow effect */}
        <div style={{
          position: "absolute", top: "-50%", left: "50%",
          transform: "translateX(-50%)", width: "200px", height: "100px",
          background: "radial-gradient(ellipse, rgba(14, 165, 233, 0.1) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8" }}></span>
            Active Batting Partnership
          </span>
          {ext > 0 && (
            <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>
              Extras: <strong style={{ color: "#94a3b8" }}>{ext} runs</strong>
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          
          {/* Striker Stats (Left) */}
          <div style={{ flex: 1, minWidth: "120px", textAlign: "right" }}>
            <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#f8fafc", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {striker} <span style={{ color: "#0ea5e9" }}>*</span>
            </h4>
            <p style={{ margin: "2px 0 6px 0", fontSize: "1.1rem", fontWeight: 900, color: "#0ea5e9" }}>
              {s1Stats.runs} <span style={{ fontSize: "0.8rem", fontWeight: "normal", color: "#64748b" }}>({s1Stats.balls})</span>
            </p>
            <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                Partner Share: <strong style={{ color: "#f8fafc" }}>{r1} runs</strong>
              </span>
              <span style={{ fontSize: "0.65rem", color: "#64748b" }}>
                Contribution: <strong>{p1Pct}%</strong>
              </span>
            </div>
          </div>

          {/* SVG Progress Ring (Center) */}
          <div style={{ width: "90px", height: "90px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="90" height="90" viewBox="0 0 100 100" style={{ transform: "rotate(0deg)" }}>
              {/* Background Track */}
              <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="6" />

              {totalRuns === 0 ? (
                /* Neutral Dashed Ring when partnership has no runs */
                <circle 
                  cx="50" cy="50" r={r} fill="none" 
                  stroke="rgba(148, 163, 184, 0.2)" 
                  strokeWidth="6" 
                  strokeDasharray="4,4" 
                />
              ) : (
                <>
                  {/* Striker segment (Sky Blue) */}
                  {r1 > 0 && (
                    <circle 
                      cx="50" cy="50" r={r} fill="none" 
                      stroke="#0ea5e9" 
                      strokeWidth="6" 
                      strokeDasharray={C} 
                      strokeDashoffset={strokeDashoffset1} 
                      transform={`rotate(${rot1} 50 50)`}
                      style={{ transition: "stroke-dashoffset 0.5s ease-in-out, transform 0.5s ease-in-out" }}
                    />
                  )}

                  {/* Non-striker segment (Sunset Orange) */}
                  {r2 > 0 && (
                    <circle 
                      cx="50" cy="50" r={r} fill="none" 
                      stroke="#ea580c" 
                      strokeWidth="6" 
                      strokeDasharray={C} 
                      strokeDashoffset={strokeDashoffset2} 
                      transform={`rotate(${rot2} 50 50)`}
                      style={{ transition: "stroke-dashoffset 0.5s ease-in-out, transform 0.5s ease-in-out" }}
                    />
                  )}

                  {/* Extras segment (Slate Gray) */}
                  {ext > 0 && (
                    <circle 
                      cx="50" cy="50" r={r} fill="none" 
                      stroke="#64748b" 
                      strokeWidth="6" 
                      strokeDasharray={C} 
                      strokeDashoffset={strokeDashoffsetE} 
                      transform={`rotate(${rotE} 50 50)`}
                      style={{ transition: "stroke-dashoffset 0.5s ease-in-out, transform 0.5s ease-in-out" }}
                    />
                  )}
                </>
              )}
            </svg>

            {/* Central Score Text */}
            <div style={{ position: "absolute", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <span style={{ fontSize: "1.4rem", fontWeight: "900", color: "#f8fafc", lineHeight: 1 }}>{totalRuns}</span>
              <span style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px" }}>Runs</span>
              <span style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: "500" }}>({totalBalls}b)</span>
            </div>
          </div>

          {/* Non-Striker Stats (Right) */}
          <div style={{ flex: 1, minWidth: "120px", textAlign: "left" }}>
            <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#f8fafc", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {nonStriker}
            </h4>
            <p style={{ margin: "2px 0 6px 0", fontSize: "1.1rem", fontWeight: 900, color: "#ea580c" }}>
              {s2Stats.runs} <span style={{ fontSize: "0.8rem", fontWeight: "normal", color: "#64748b" }}>({s2Stats.balls})</span>
            </p>
            <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                Partner Share: <strong style={{ color: "#f8fafc" }}>{r2} runs</strong>
              </span>
              <span style={{ fontSize: "0.65rem", color: "#64748b" }}>
                Contribution: <strong>{p2Pct}%</strong>
              </span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  function renderWagonWheelSelector(isModal = false) {
    const size = 300;
    const center = size / 2;
    const outerR = size / 2 - 10;
    const innerR = outerR * 0.55;
    const getArcPath = (startAngle, endAngle, radiusType) => {
      const r1 = radiusType === 'outer' ? innerR : 0;
      const r2 = radiusType === 'inner' ? innerR : outerR;
      const startRad = (Math.PI * startAngle) / 180;
      const endRad = (Math.PI * endAngle) / 180;
      const p1 = { x: center + r1 * Math.cos(startRad), y: center + r1 * Math.sin(startRad) };
      const p2 = { x: center + r2 * Math.cos(startRad), y: center + r2 * Math.sin(startRad) };
      const p3 = { x: center + r2 * Math.cos(endRad), y: center + r2 * Math.sin(endRad) };
      const p4 = { x: center + r1 * Math.cos(endRad), y: center + r1 * Math.sin(endRad) };
      const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
      if (r1 === 0) {
        return `M ${center} ${center} L ${p2.x} ${p2.y} A ${r2} ${r2} 0 ${largeArc} 1 ${p3.x} ${p3.y} Z`;
      } else {
        return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${r2} ${r2} 0 ${largeArc} 1 ${p3.x} ${p3.y} L ${p4.x} ${p4.y} A ${r1} ${r1} 0 ${largeArc} 0 ${p1.x} ${p1.y} Z`;
      }
    };
    return (
      <div style={{ width: size, height: size + 30, margin: '0 auto', position: 'relative' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {WAGON_WHEEL_REGIONS.map((region) => {
            const isSelected = selectedRegion === region.id;
            const midAngle = (region.start + region.end) / 2;
            const midRad = (Math.PI * midAngle) / 180;
            let textR;
            if (region.radius === 'inner') textR = innerR * 0.65;
            else if (region.radius === 'outer') textR = innerR + (outerR - innerR) * 0.55;
            else textR = outerR * 0.65;
            const textX = center + textR * Math.cos(midRad);
            const textY = center + textR * Math.sin(midRad);
            const words = region.id.split(' ');
            return (
              <g key={region.id} onClick={() => {
                if (isModal) {
                  recordDelivery({ ...pendingDelivery, shotRegion: region.id });
                  setPendingDelivery(null);
                } else {
                  setSelectedRegion(isSelected ? '' : region.id);
                }
              }} style={{ cursor: 'pointer' }}>
                <path d={getArcPath(region.start, region.end, region.radius)} fill={isSelected ? '#bae6fd' : '#f8fafc'} stroke={isSelected ? '#0284c7' : '#e2e8f0'} strokeWidth={isSelected ? '2' : '1'} style={{ transition: 'all 0.2s' }} />
                <text x={textX} y={textY} textAnchor="middle" dominantBaseline="middle" fontSize={region.radius === 'inner' ? "9" : "10"} fontWeight={isSelected ? "700" : "500"} fill={isSelected ? '#0369a1' : '#64748b'} pointerEvents="none">
                  {words.map((word, i) => (
                    <tspan key={i} x={textX} dy={i === 0 ? `-${(words.length - 1) * 0.4}em` : '1.1em'}>{word}</tspan>
                  ))}
                </text>
              </g>
            );
          })}
          <rect x={center - 8} y={center - 24} width={16} height={48} fill="#e2e8f0" stroke="#cbd5e1" rx={2} pointerEvents="none" />
          <circle cx={center} cy={center + 16} r={2} fill="#0f172a" pointerEvents="none" />
          <circle cx={center} cy={center - 16} r={2} fill="#0f172a" pointerEvents="none" />
        </svg>
        {!isModal && (
          <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.95rem', color: '#0f172a', fontWeight: 'bold' }}>
            {selectedRegion ? `Selected: ${selectedRegion}` : 'Select a region'}
          </div>
        )}
      </div>
    );
  }

  function renderWagonWheelModal() {
    if (!pendingDelivery) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', maxWidth: '95%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>Select Shot Region</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '20px' }}>Where was the <strong>{pendingDelivery.batterRuns} run(s)</strong> hit?</p>
          {renderWagonWheelSelector(true)}
          <div style={{ marginTop: '24px' }}>
            <button className="button secondary full-width" onClick={() => { recordDelivery(pendingDelivery); setPendingDelivery(null); }}>Skip / Unknown Region</button>
          </div>
        </div>
      </div>
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
    
    const buildMatchObj = () => ({
      teamA, teamB, totalOvers, innings, runs, wickets, balls,
      lastBall, firstInnings, matchResult
    });

    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        {/* Left Column: Scoring Controls */}
        <section className="panel live-panel" style={{ flex: '1 1 550px', maxWidth: '600px', margin: 0 }}>
          <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <p className="label">Live Scoring - Innings {innings}</p>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{currentBattingTeam} batting vs {currentBowlingTeam}</h2>
            </div>
            <button className="button secondary compact-button" onClick={undoLastAction} disabled={undoStack.length === 0 || matchStatsCommitted}>↩ Undo</button>
          </div>

          <div className="match-panel">
            <div className="scoreboard" style={{ marginBottom: '1.5rem' }}>
              <div className="score-card">
                <span className="score-value" style={{ display: 'inline-flex', gap: '2px', justifyContent: 'center', alignItems: 'center' }}>
                  <span key={runs} className="score-update-pulse">{runs}</span>
                  <span style={{ opacity: 0.6, margin: '0 2px' }}>/</span>
                  <span key={wickets} className="wicket-update-pulse">{wickets}</span>
                </span>
                <span className="score-label">Score</span>
              </div>
              <div className="score-card">
                <span key={balls} className="score-value score-update-pulse">{formatOvers(balls)}</span>
                <span className="score-label">Overs of {totalOvers}</span>
              </div>
              <div className="score-card">
                <span className="score-value">{balls > 0 ? ((runs / balls) * 6).toFixed(2) : "0.00"}</span>
                <span className="score-label">Run rate</span>
              </div>
            </div>

            <div className="score-strip" style={{ marginBottom: '1.5rem', padding: '0.75rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              {innings === 2 && target && <span style={{ fontWeight: 'bold', color: '#ea580c' }}>Target: {target} | Need {Math.max(target - runs, 0)} runs in {((Number(totalOvers) * 6) - balls)} balls</span>}
              {!target && firstInnings && <span>1st inns: {firstInnings.team} {firstInnings.runs}/{firstInnings.wickets}</span>}
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748b' }}>
                <span>Extras: {extras.wides + extras.noBalls + extras.byes + extras.legByes} (WD {extras.wides}, NB {extras.noBalls}, B {extras.byes}, LB {extras.legByes})</span>
              </div>
            </div>

            {matchResult && <div className="notice-bar" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', fontWeight: 'bold', textAlign: 'center', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{matchResult}</div>}

            {inningsComplete && innings === 1 && (
              <div className="notice-card" style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '1px solid #fed7aa', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <p className="label" style={{ color: '#c2410c' }}>Innings complete</p>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{teamA} made {runs}/{wickets}</h3>
                </div>
                {!needsSecondInningsSetup ? (
                  <button className="button primary" onClick={prepareSecondInnings} style={{ width: '100%' }}>Setup Second Innings</button>
                ) : (
                  <div className="innings-setup" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <select className="input" value={secondStriker} onChange={(e) => setSecondStriker(e.target.value)}>
                      {(selectedTeamB?.players?.length ? selectedTeamB.players : battingPlayers).map((player) => <option key={player} value={player}>Striker: {player}</option>)}
                    </select>
                    <select className="input" value={secondNonStriker} onChange={(e) => setSecondNonStriker(e.target.value)}>
                      {(selectedTeamB?.players?.length ? selectedTeamB.players : battingPlayers).map((player) => <option key={player} value={player}>Non-Striker: {player}</option>)}
                    </select>
                    <select className="input" value={secondBowler} onChange={(e) => setSecondBowler(e.target.value)}>
                      {(selectedTeamA?.players?.length ? selectedTeamA.players : bowlingPlayers).map((player) => <option key={player} value={player}>Bowler: {player}</option>)}
                    </select>
                    <button className="button primary" onClick={startSecondInnings} disabled={!secondStriker || !secondNonStriker || !secondBowler || secondStriker === secondNonStriker} style={{ width: '100%' }}>Start Chase</button>
                  </div>
                )}
              </div>
            )}

            {inningsComplete && innings === 2 && !matchResult && <div className="notice-bar" style={{ background: '#f1f5f9', color: '#475569', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Second innings complete</div>}

            {needsBowlerChange && !inningsComplete && (
              <div className="notice-card" style={{ background: 'linear-gradient(135deg, #f5f3ff, #e9d5ff)', border: '1px solid #d8b4fe', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <p className="label" style={{ color: '#7e22ce' }}>End of over</p>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Choose new bowler</h3>
                </div>
                <select className="input" value="" onChange={(e) => chooseNextBowler(e.target.value)}>
                  <option value="">Select next bowler...</option>
                  {availableBowlers.map((player) => <option key={player} value={player}>{player} ({formatOvers(bowlingStats[player]?.balls || 0)} ov)</option>)}
                </select>
                {availableBowlers.length === 0 && <p className="empty-state" style={{ padding: '0.5rem', marginTop: '0.5rem' }}>No eligible bowler left under the current limit.</p>}
              </div>
            )}

            {needsNewBatter && !inningsComplete && (
              <div className="notice-card" style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <p className="label" style={{ color: '#dc2626' }}>Wicket</p>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Choose next batter</h3>
                </div>
                <select className="input" value="" onChange={(e) => chooseNextBatter(e.target.value)}>
                  <option value="">Select next batter...</option>
                  {availableBatters.map((player) => <option key={player} value={player}>{player}</option>)}
                </select>
              </div>
            )}

            <div className="last-ball" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#475569' }}>
              {lastBall ? (
                <>Last ball: <strong>{lastBall.over}.{lastBall.ball}</strong>{!lastBall.legal ? " illegal" : ""} - {lastBall.wicket ? <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{lastBall.wicketType}</span> : <strong style={{ color: lastBall.runs >= 4 ? '#22c55e' : '#0f172a' }}>{lastBall.runs} run{lastBall.runs !== 1 ? "s" : ""}</strong>}{lastBall.extraType ? ` (${lastBall.extraType})` : ""} - {lastBall.bowler}</>
              ) : "No deliveries yet."}
            </div>

            {/* Live Match Simulator Control */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.25rem 0', padding: '0.75rem 1rem', background: 'rgba(14, 165, 233, 0.08)', borderRadius: '12px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
              <span style={{ fontWeight: 'bold', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                ⚡ Live Match Simulator
              </span>
              <button 
                onClick={() => setIsSimulatorMode(!isSimulatorMode)} 
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  background: isSimulatorMode ? '#0ea5e9' : '#94a3b8',
                  color: 'white',
                  transition: 'all 0.2s'
                }}
              >
                {isSimulatorMode ? "ON" : "OFF"}
              </button>
            </div>

            {isSimulatorMode ? (
              /* Simulator Big Button */
              <button 
                className="button success" 
                onClick={simulateNextBall} 
                disabled={unavailableScoring} 
                style={{
                  width: '100%',
                  padding: '1.1rem',
                  fontSize: '1.15rem',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  marginBottom: '1.25rem',
                  boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                  cursor: 'pointer'
                }}
              >
                ⚡ Simulate Next Ball
              </button>
            ) : (
              /* Standard Scoring Panel */
              <>
                <div className="button-row run-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
                  {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                    <button key={run} className="button secondary run-button" onClick={() => initiateDelivery({ batterRuns: run })} disabled={unavailableScoring} style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{run}</button>
                  ))}
                  <button className="button danger" onClick={() => initiateDelivery({ wicket: true, wicketType: "Wicket" })} disabled={unavailableScoring} style={{ fontWeight: 'bold' }}>OUT</button>
                </div>

                <div className="button-row extras-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '1.25rem' }}>
                  <button className="button secondary compact-button" onClick={() => initiateDelivery({ extraRuns: 1, extraType: "wides", legal: false, rotateOnRuns: false })} disabled={unavailableScoring}>WD</button>
                  <button className="button secondary compact-button" onClick={() => initiateDelivery({ extraRuns: 1, extraType: "noBalls", legal: false, rotateOnRuns: false })} disabled={unavailableScoring}>NB</button>
                  <button className="button secondary compact-button" onClick={() => initiateDelivery({ batterRuns: 4, extraRuns: 1, extraType: "noBalls", legal: false, rotateOnRuns: false })} disabled={unavailableScoring}>NB+4</button>
                  <button className="button secondary compact-button" onClick={() => initiateDelivery({ extraRuns: 1, extraType: "byes", rotateOnRuns: true })} disabled={unavailableScoring}>BYE</button>
                  <button className="button secondary compact-button" onClick={() => initiateDelivery({ extraRuns: 1, extraType: "legByes", rotateOnRuns: true })} disabled={unavailableScoring}>LBYE</button>
                </div>
              </>
            )}

            <div className="button-row actions-row" style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
              <button className="button primary" onClick={manualSwapBatters} disabled={unavailableScoring} style={{ flex: 1, minHeight: '42px', fontSize: '0.85rem' }}>🔄 Swap Batsmen / Strike</button>
            </div>

            {renderPartnershipTracker()}

            {/* Scorecard grids */}
            <div className="scorecard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
              <section className="mini-scorecard" style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <div className="history-header" style={{ fontWeight: 'bold', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Batting</div>
                {[striker, nonStriker].map((player) => {
                  const stats = getPlayerStats(battingStats, player);
                  return (
                    <div key={player} className="stat-line" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.25rem 0' }}>
                      <span style={{ fontWeight: player === striker ? 'bold' : 'normal' }}>{player}{player === striker ? " *" : ""}</span>
                      <span style={{ fontWeight: 'bold' }}>{stats.runs} <span style={{ fontWeight: 'normal', color: '#64748b' }}>({stats.balls})</span></span>
                    </div>
                  );
                })}
              </section>
              <section className="mini-scorecard" style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <div className="history-header" style={{ fontWeight: 'bold', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Bowling</div>
                {bowlingPlayers.map((player) => {
                  const stats = getPlayerStats(bowlingStats, player);
                  if (stats.balls === 0 && player !== bowler) return null;
                  return (
                    <div key={player} className="stat-line" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.25rem 0' }}>
                      <span style={{ fontWeight: player === bowler ? 'bold' : 'normal' }}>{player}{player === bowler ? " *" : ""}</span>
                      <span style={{ fontWeight: 'bold' }}>{stats.wickets} <span style={{ fontWeight: 'normal', color: '#64748b' }}>- {stats.runs} <span style={{ fontSize: '0.8rem' }}>({formatOvers(stats.balls)}ov)</span></span></span>
                    </div>
                  );
                })}
              </section>
            </div>

            <div className="history-panel" style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <div className="history-header" style={{ fontWeight: 'bold', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Recent Deliveries</div>
              {history.length === 0 ? <p className="empty-state" style={{ padding: '1rem' }}>No balls recorded yet.</p> : (
                <div className="history-list" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {history.slice(-8).reverse().map((ball, index) => {
                    const isW = ball.wicket;
                    const isB = ball.batterRuns === 4 || ball.batterRuns === 6;
                    return (
                      <div key={index} style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.85rem', fontWeight: 'bold',
                        background: isW ? '#ef4444' : isB ? '#22c55e' : '#f1f5f9',
                        color: isW || isB ? 'white' : '#475569',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }} title={`${ball.over}.${ball.ball} to ${ball.striker}: ${ball.runs} runs`}>
                        {isW ? 'W' : ball.runs}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {matchResult && renderMatchStats()}
          </div>
        </section>

        {/* Right Column: Ground Visualizer & AI Commentary */}
        <div style={{ flex: '1 1 500px', maxWidth: '550px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <StadiumView match={buildMatchObj()} battingStats={battingStats} />
          <AICommentary history={history} />
        </div>

      </div>
    );
  }

  function renderMatchStats() {
    const inningsList = getCompletedInnings();
    const handleDownloadPdf = () => {
      if (!matchId) return;
      window.open(`${API.defaults.baseURL}/matches/${matchId}/pdf`, '_blank');
    };
    return (
      <div className="history-panel">
        <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Player Stats</span>
          <button className="button secondary compact-button" onClick={handleDownloadPdf}>Download PDF</button>
        </div>
        <div className="stats-summary-grid">
          {inningsList.map((item, index) => (
            <section key={`${item.team}-${index}`} className="mini-scorecard">
              <div className="history-header">{item.team} - {item.runs}/{item.wickets} ({formatOvers(item.balls)})</div>
              <div className="compact-table">
                <div className="compact-row table-head"><span>Batter</span><span>R</span><span>B</span><span>4s</span><span>6s</span></div>
                {Object.entries(item.battingStats || {}).map(([player, stats]) => (
                  <div key={player} className="compact-row"><span>{player}</span><span>{stats.runs || 0}</span><span>{stats.balls || 0}</span><span>{stats.fours || 0}</span><span>{stats.sixes || 0}</span></div>
                ))}
              </div>
              <div className="compact-table">
                <div className="compact-row table-head"><span>Bowler</span><span>Ov</span><span>R</span><span>W</span><span>WD/NB</span></div>
                {Object.entries(item.bowlingStats || {}).map(([player, stats]) => (
                  <div key={player} className="compact-row"><span>{player}</span><span>{formatOvers(stats.balls || 0)}</span><span>{stats.runs || 0}</span><span>{stats.wickets || 0}</span><span>{stats.wides || 0}/{stats.noBalls || 0}</span></div>
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
      return <section className="panel"><p className="empty-state">Start a match to see commentary.</p></section>;
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
              <div className="history-header">Innings {index + 1}: {item.team} {item.runs}/{item.wickets} ({formatOvers(item.balls)})</div>
              {item.history?.length ? (
                item.history.slice().reverse().map((ball, i) => (
                  <div key={`${index}-${item.history.length - 1 - i}`} className="commentary-item">{formatDelivery(ball)}</div>
                ))
              ) : <p className="empty-state">No deliveries recorded.</p>}
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
          <input className="input" value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} placeholder="Tournament Name" />
          <button className="button primary" onClick={createTournament}>Create Tournament</button>
        </div>
        <div className="team-grid">
          {tournaments.length === 0 ? <p className="empty-state">No tournaments yet. Create one above.</p> : (
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
          <p className="hint">{authMode === "login" ? "Sign in to your CricHeroes dashboard." : "Join CricHeroes to manage your matches."}</p>
          <form onSubmit={handleAuthSubmit}>
            {authMode === "signup" && <input type="text" placeholder="Full Name" value={authName} onChange={e => setAuthName(e.target.value)} className="input login-input" />}
            <input type="email" placeholder="Email Address" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="input login-input" required />
            <input type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="input login-input" required />
            {authError && <p className="error-text">{authError}</p>}
            <button type="submit" className="button primary full-width">{authMode === "login" ? "Login" : "Sign Up"}</button>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
            </div>
          </form>
          <div className="auth-toggle">
            {authMode === "login" ? <p>Don't have an account? <button className="text-button" onClick={() => { setAuthMode("signup"); setAuthError(""); }}>Sign up</button></p> : <p>Already have an account? <button className="text-button" onClick={() => { setAuthMode("login"); setAuthError(""); }}>Login</button></p>}
          </div>
        </div>
        <style>{`
          .login-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; font-family: sans-serif; padding: 16px; box-sizing: border-box; }
          .login-card { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; width: 100%; max-width: 400px; box-sizing: border-box; }
          @media (max-width: 480px) { .login-card { padding: 1.5rem; border-radius: 12px; } }
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
    <div className="app-shell">
      {/* Mobile Sticky Topbar */}
      <div className="mobile-topbar">
        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          ☰
        </button>
        <div className="topbar-brand">
          <div className="topbar-logo-icon">🏏</div>
          <span className="topbar-logo-text">CricHeroes</span>
        </div>
        <div style={{ width: '40px' }}></div> {/* spacer to balance burger menu */}
      </div>

      {/* Sidebar Backdrop Overlay on Mobile */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Vertical Sidebar Navigation Container */}
      <header className={`app-header ${isSidebarOpen ? "sidebar-open" : ""}`} style={{
        background: 'linear-gradient(135deg, #003a6c 0%, #0ea5e9 100%)',
        zIndex: 1000
      }}>
        <div className="brand-block">
          <div className="brand-icon">🏏</div>
          <div>
            <h1>CricHeroes<span>CRICKET MANAGEMENT</span></h1>
          </div>
        </div>
        
        <nav className="app-nav">
          <button 
            className={`nav-button ${page === "home" ? "active" : ""}`} 
            onClick={() => { setPage("home"); setIsSidebarOpen(false); }}
            style={{
              background: page === "home" ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: page === "home" ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              width: '100%'
            }}
          >
            <span>🏠</span>
            <span>Home</span>
          </button>
          <button 
            className={`nav-button ${page === "team-manager" ? "active" : ""}`} 
            onClick={() => { setPage("team-manager"); setIsSidebarOpen(false); }}
            style={{
              background: page === "team-manager" ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: page === "team-manager" ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              width: '100%'
            }}
          >
            <span>🏟️</span>
            <span>Teams</span>
          </button>
          <button 
            className={`nav-button ${page === "tournaments" ? "active" : ""}`} 
            onClick={() => { setPage("tournaments"); setIsSidebarOpen(false); }}
            style={{
              background: page === "tournaments" ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: page === "tournaments" ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              width: '100%'
            }}
          >
            <span>🏆</span>
            <span>Tournaments</span>
          </button>
          <button 
            className={`nav-button ${page === "live" ? "active" : ""}`} 
            onClick={() => { setPage("live"); setIsSidebarOpen(false); }}
            style={{
              padding: '0.625rem 1rem',
              background: page === "live" ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: page === "live" ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: page === "live" ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              width: '100%',
              animation: page === "live" ? 'pulse 2s infinite' : 'none'
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ef4444',
              boxShadow: page === "live" ? '0 0 10px rgba(239, 68, 68, 0.8)' : 'none'
            }}></span>
            <span>Live</span>
          </button>
          <button 
            className={`nav-button ${page === "past-matches" ? "active" : ""}`} 
            onClick={() => { setPage("past-matches"); setIsSidebarOpen(false); }}
            style={{
              background: page === "past-matches" ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: page === "past-matches" ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              width: '100%'
            }}
          >
            <span>🕰️</span>
            <span>Past</span>
          </button>
          <button 
            className={`nav-button ${page === "rankings" ? "active" : ""}`} 
            onClick={() => { setPage("rankings"); setIsSidebarOpen(false); }}
            style={{
              background: page === "rankings" ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: page === "rankings" ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              width: '100%'
            }}
          >
            <span>📊</span>
            <span>Rank</span>
          </button>
          <button 
            className={`nav-button ${page === "profile" ? "active" : ""}`} 
            onClick={() => { setPage("profile"); setIsSidebarOpen(false); }}
            style={{
              background: page === "profile" ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: page === "profile" ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              width: '100%'
            }}
          >
            <span>👤</span>
            <span>Profile</span>
          </button>
        </nav>

        {/* Theme and Exit Controls at bottom */}
        <div className="theme-logout-container">
          <div 
            className="theme-badge-wrapper" 
            onClick={() => { if (!isSidebarOpen) cycleTheme(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '0.625rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              width: '100%',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>🎨</span>
            <select 
              value={theme} 
              onChange={(e) => setTheme(e.target.value)}
              onClick={(e) => { if (!isSidebarOpen) e.stopPropagation(); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'center'
              }}
            >
              <option value="light" style={{ color: '#0f172a', background: 'white' }}>☀️ Light Theme</option>
              <option value="dark" style={{ color: '#0f172a', background: 'white' }}>🌙 Dark Theme</option>
              <option value="green" style={{ color: '#0f172a', background: 'white' }}>🌿 Classic Green</option>
            </select>
          </div>
          <button 
            className="nav-button" 
            onClick={() => { setIsAuthenticated(false); setIsSidebarOpen(false); }}
            style={{
              padding: '0.625rem 1rem',
              background: 'rgba(239, 68, 68, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              width: '100%',
              justifyContent: 'center'
            }}
          >
            <span>🚪</span>
            <span>Exit</span>
          </button>
        </div>
      </header>

      <main className="content-grid">
        <div key={`home-${page === "home"}`} className="page-transition" style={{ display: page === "home" ? "block" : "none" }}>
          {renderHomePage()}
        </div>
        <div key={`team-manager-${page === "team-manager"}`} className="page-transition" style={{ display: page === "team-manager" ? "block" : "none" }}>
          <TeamManager teams={teams} setTeams={setTeams} allPlayers={allPlayers} setAllPlayers={setAllPlayers} onBack={() => setPage("home")} />
        </div>
        <div key={`tournaments-${page === "tournaments"}`} className="page-transition" style={{ display: page === "tournaments" ? "block" : "none" }}>
          <Tournament teams={teams} onTournamentCreated={fetchTournaments} onStartMatch={(tournamentId, teamA, teamB) => {
            setSelectedTournament(tournamentId);
            setTeamA(teamA);
            setTeamB(teamB);
            setPage("home");
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }} onStartLiveMatch={async (matchConfig) => { await startMatch(matchConfig); }} onResumeMatch={(matchIdToResume) => { resumeMatch(matchIdToResume); }} />
        </div>
        <div key={`live-${page === "live"}`} className="page-transition" style={{ display: page === "live" ? "block" : "none" }}>
          {renderLiveScoring()}
        </div>
        <div key={`commentary-${page === "commentary"}`} className="page-transition" style={{ display: page === "commentary" ? "block" : "none" }}>
          {renderCommentary()}
        </div>
        <div key={`past-matches-${page === "past-matches"}`} className="page-transition" style={{ display: page === "past-matches" ? "block" : "none" }}>
          <PastMatches onViewMatch={(id) => { setSelectedPastMatchId(id); setPage("match-details"); }} />
        </div>
        {page === "match-details" && (
          <div key="match-details" className="page-transition">
            <MatchDetails matchId={selectedPastMatchId} onBack={() => setPage("past-matches")} />
          </div>
        )}
        <div key={`rankings-${page === "rankings"}`} className="page-transition" style={{ display: page === "rankings" ? "block" : "none" }}>
          <section className="panel rankings-panel"><Rankings /></section>
        </div>
        <div key={`analytics-${page === "analytics"}`} className="page-transition" style={{ display: page === "analytics" ? "block" : "none" }}>
          <PlayerAnalyticsDashboard allPlayers={allPlayers} teams={teams} fetchTeams={fetchTeams} />
        </div>
        <div key={`profile-${page === "profile"}`} className="page-transition" style={{ display: page === "profile" ? "block" : "none" }}>
          <UserProfile userName={authName} userEmail={authEmail} userRole={userRole} teamsCount={teams.length} tournamentsCount={tournaments.length} onLogout={() => setIsAuthenticated(false)} />
        </div>
      </main>
      {renderWagonWheelModal()}
    </div>
  );
}

export default App;