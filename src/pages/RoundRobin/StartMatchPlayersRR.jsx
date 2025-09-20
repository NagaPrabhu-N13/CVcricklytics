import React, { useState, useEffect, Component } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { runTransaction } from "firebase/firestore";
import HeaderComponent from '../../components/kumar/startMatchHeader';
import backButton from '../../assets/kumar/right-chevron.png';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Player } from '@lottiefiles/react-lottie-player';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc, setDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { arrayUnion, increment } from 'firebase/firestore';
import sixAnimation from '../../assets/Animation/six.json';
import fourAnimation from '../../assets/Animation/four.json';
import outAnimation from '../../assets/Animation/out.json';
import MainWheel from "../../components/yogesh/wagonwheel/mainwheel"
import AIMatchCompanionModal from "../../components/yogesh/LandingPage/AIMatchCompanion";

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-white text-center p-4">
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message || 'Unknown error'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

async function updatePlayerCareerStats(playerName, statUpdates, db) {
  try {
    const q = query(collection(db, "PlayerDetails"), where("name", "==", playerName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      const playerData = querySnapshot.docs[0].data();
      let firestoreUpdates = {};

      Object.entries(statUpdates).forEach(([statPath, valueToAdd]) => {
        const pathSegments = statPath.split(".");
        let currentVal = playerData;
        for (let seg of pathSegments) {
          currentVal = currentVal && typeof currentVal === "object" ? currentVal[seg] : undefined;
        }
        firestoreUpdates[statPath] = (parseInt(currentVal) || 0) + valueToAdd;
      });

      await updateDoc(docRef, firestoreUpdates);
      console.log(`Updated careerStats for ${playerName}:`, firestoreUpdates);
    } else {
      console.error(`Player ${playerName} not found`);
    }
  } catch (error) {
    console.error("Error updating player stats:", error);
  }
}

async function updatePlayerBattingAverage(playerName, db) {
  try {
    const q = query(collection(db, "PlayerDetails"), where("name", "==", playerName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      const playerData = querySnapshot.docs[0].data();

      const runs = playerData?.careerStats?.batting?.runs || 0;
      const dismissals = playerData?.careerStats?.batting?.dismissals || 0;
      let battingAverage = 0;
      if (dismissals > 0) battingAverage = runs / dismissals;

      await updateDoc(docRef, { "careerStats.batting.average": battingAverage });
      console.log(`Updated batting average for ${playerName}: ${battingAverage}`);
    } else {
      console.error(`Player ${playerName} not found`);
    }
  } catch (error) {
    console.error("Error updating batting average:", error);
  }
}

async function updatePlayerBowlingAverage(playerName, db) {
  try {
    const q = query(collection(db, "PlayerDetails"), where("name", "==", playerName));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      const playerData = querySnapshot.docs[0].data();
      const runsConceded = playerData?.careerStats?.bowling?.runsConceded || 0;
      const wickets = playerData?.careerStats?.bowling?.wickets || 0;
      let bowlingAverage = 0;
      if (wickets > 0) bowlingAverage = runsConceded / wickets;
      await updateDoc(docRef, { "careerStats.bowling.average": bowlingAverage });
      console.log(`Updated bowling average for ${playerName}: ${bowlingAverage}`);
    } else {
      console.error(`Player ${playerName} not found`);
    }
  } catch (error) {
    console.error("Error updating bowling average:", error);
  }
}

async function initializeTournamentStats(tournamentId, matchId, allPlayers, db) {
  try {
    const matchStatsRef = doc(db, "tournamentStats", tournamentId, "matches", matchId);
    const matchDoc = await getDoc(matchStatsRef);

    if (matchDoc.exists()) {
      console.log(`Tournament stats for match ${matchId} already initialized. Skipping reset.`);
      return;
    }

    const defaultPlayerStats = allPlayers.map(player => ({
      playerName: player.name,
      playerIndex: player.index || "unknown",
      runs: 0,
      wickets: 0,
      catches: 0,
      runOuts: 0,
      stumpings: 0,
      dismissals: 0,
      ballsFaced: 0,
      ballsBowled: 0,
      runsConceded: 0,
      battingAverage: 0,
      bowlingAverage: 0,
      strikeRate: 0,
    }));

    await setDoc(matchStatsRef, { players: defaultPlayerStats });
    console.log(`Initialized tournament stats for match ${matchId} in tournament ${tournamentId}`);
  } catch (error) {
    console.error("Error initializing tournament stats:", error);
  }
}

async function updateTournamentBatting(tournamentId, matchId, playerName, rawUpdates, db) {
  const matchStatsRef = doc(db, "tournamentStats", tournamentId, "matches", matchId);
  
  try {
    await runTransaction(db, async (transaction) => {
      const matchDoc = await transaction.get(matchStatsRef);
      if (!matchDoc.exists()) {
        throw new Error("Match stats not found for update.");
      }
      
      const data = matchDoc.data();
      const updatedPlayers = data.players.map(p => {
        if (p.playerName === playerName) {
          const incremented = { ...p };
          Object.entries(rawUpdates).forEach(([key, valueToAdd]) => {
            incremented[key] = (incremented[key] || 0) + valueToAdd;
          });
          const battingAverage = incremented.dismissals > 0 ? (incremented.runs / incremented.dismissals).toFixed(2) : 0;
          const strikeRate = incremented.ballsFaced > 0 ? ((incremented.runs / incremented.ballsFaced) * 100).toFixed(2) : 0;
          return { ...incremented, battingAverage, strikeRate };
        }
        return p;
      });
      
      transaction.update(matchStatsRef, { players: updatedPlayers });
    });
    console.log(`Atomically updated batting stats for ${playerName} in match ${matchId}`);
  } catch (error) {
    console.error("Transaction failed:", error);
  }
}

async function updateTournamentBowling(tournamentId, matchId, playerName, rawUpdates, db) {
  const matchStatsRef = doc(db, 'tournamentStats', tournamentId, 'matches', matchId);
  
  try {
    await runTransaction(db, async (transaction) => {
      const matchDoc = await transaction.get(matchStatsRef);
      
      let updatedPlayers = [];
      
      if (!matchDoc.exists()) {
        const allPlayers = [];
        const defaultPlayerStats = allPlayers.map(player => ({
          playerName: player.name,
          playerIndex: player.index || "unknown",
          runs: 0,
          wickets: 0,
          catches: 0,
          runOuts: 0,
          stumpings: 0,
          dismissals: 0,
          ballsFaced: 0,
          ballsBowled: 0,
          runsConceded: 0,
          battingAverage: 0,
          bowlingAverage: 0,
          strikeRate: 0,
        }));
        
        transaction.set(matchStatsRef, { players: defaultPlayerStats });
        updatedPlayers = defaultPlayerStats;
        console.log(`Initialized match stats for ${matchId} during update.`);
      } else {
        const data = matchDoc.data();
        updatedPlayers = data.players;
      }
      
      updatedPlayers = updatedPlayers.map(p => {
        if (p.playerName === playerName) {
          const incremented = { ...p };
          Object.entries(rawUpdates).forEach(([key, valueToAdd]) => {
            incremented[key] = (incremented[key] || 0) + valueToAdd;
          });
          
          const bowlingAverage = incremented.wickets > 0 ? (incremented.runsConceded / incremented.wickets).toFixed(2) : 0;
          
          return { ...incremented, bowlingAverage };
        }
        return p;
      });
      
      transaction.set(matchStatsRef, { players: updatedPlayers }, { merge: true });
    });
    
    console.log(`Atomically updated bowling stats for ${playerName} in match ${matchId}`);
  } catch (error) {
    console.error("Transaction failed:", error);
  }
}

async function updateTournamentFielding(tournamentId, matchId, playerName, rawUpdates, db) {
  try {
    const matchStatsRef = doc(db, "tournamentStats", tournamentId, "matches", matchId);
    const matchDoc = await getDoc(matchStatsRef);
    if (matchDoc.exists()) {
      const data = matchDoc.data();
      const updatedPlayers = data.players.map(p => {
        if (p.playerName === playerName) {
          const incremented = { ...p };
          Object.entries(rawUpdates).forEach(([key, valueToAdd]) => {
            incremented[key] = (incremented[key] || 0) + valueToAdd;
          });
          return incremented;
        }
        return p;
      });
      await updateDoc(matchStatsRef, { players: updatedPlayers });
      console.log(`Updated fielding stats for ${playerName} in match ${matchId}`);
    } else {
      console.error("Match stats not found for update.");
    }
  } catch (error) {
    console.error("Error updating fielding stats:", error);
  }
}

function StartMatchPlayersRoundRobin({ initialTeamA, initialTeamB, origin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const originPage = location.state?.origin;
  const maxOvers = location.state?.overs;
  console.log("Max Overs:", maxOvers);
  const teamA = location.state?.teamA;
  const teamB = location.state?.teamB;
  const tournamentId = location.state?.tournamentId;
  const matchId = location.state?.matchId;
  const phase = location.state?.phase;
  const selectedPlayersFromProps = location.state?.selectedPlayers || { left: [], right: [] };
  const tournamentName = location.state?.tournamentName;
  const information = location.state?.information;
  const tossWinner = location.state?.tossWinner;
  const tossDecision = location.state?.tossDecision;
  console.log(information);
  const [playedOvers, setPlayedOvers] = useState(0);
  const [playedWickets, setPlayedWickets] = useState(0);
  const [currentView, setCurrentView] = useState('toss');
  const [showThirdButtonOnly, setShowThirdButtonOnly] = useState(false);
  const [viewHistory, setViewHistory] = useState(['toss']);
  const [topPlays, setTopPlays] = useState([]);
  const [currentOverBalls, setCurrentOverBalls] = useState([]);
  const [pastOvers, setPastOvers] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [outCount, setOutCount] = useState(0);
  const [opponentBallsFaced, setOpponentBallsFaced] = useState(0);
  const [validBalls, setValidBalls] = useState(0);
  const [overNumber, setOverNumber] = useState(1);
  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [bowlerVisible, setBowlerVisible] = useState(false);
  const [selectedBowler, setSelectedBowler] = useState(null);
  const [showBowlerDropdown, setShowBowlerDropdown] = useState(false);
  const [showBatsmanDropdown, setShowBatsmanDropdown] = useState(false);
  const [nextBatsmanIndex, setNextBatsmanIndex] = useState(null);
  const [showPastOvers, setShowPastOvers] = useState(false);
  const [selectedBatsmenIndices, setSelectedBatsmenIndices] = useState([]);
  const [isChasing, setIsChasing] = useState(false);
  const [targetScore, setTargetScore] = useState(0);
  const [batsmenScores, setBatsmenScores] = useState({});
  const [batsmenBalls, setBatsmenBalls] = useState({});
  const [batsmenStats, setBatsmenStats] = useState({});
  const [bowlerStats, setBowlerStats] = useState({});
  const [wicketOvers, setWicketOvers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [gameFinished, setGameFinished] = useState(false);
  const [pendingWide, setPendingWide] = useState(false);
  const [pendingNoBall, setPendingNoBall] = useState(false);
  const [pendingOut, setPendingOut] = useState(false);
  const [activeLabel, setActiveLabel] = useState(null);
  const [activeNumber, setActiveNumber] = useState(null);
  const [showRunInfo, setShowRunInfo] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState(null);
  const [pendingLegBy, setPendingLegBy] = useState(false);
  const [firstInningsData, setFirstInningsData] = useState(null);
  const [showMainWheel, setShowMainWheel] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [showDismissalModal, setShowDismissalModal] = useState(false);
  const [selectedDismissalType, setSelectedDismissalType] = useState('');
  const [selectedCatchType, setSelectedCatchType] = useState('');
  const [selectedInvolvedPlayer, setSelectedInvolvedPlayer] = useState(null);
  const [outRuns, setOutRuns] = useState(null);
  const [outBatsmanType, setOutBatsmanType] = useState('striker');
  const [nextBatsmanEnd, setNextBatsmanEnd] = useState(null);
  const [showLegByModal, setShowLegByModal] = useState(false);
  const [legByBatsmanType, setLegByBatsmanType] = useState('striker');
  const [retiredHurtPlayers, setRetiredHurtPlayers] = useState([]);
  const [showRetiredHurtModal, setShowRetiredHurtModal] = useState(false);
  const [retiredHurtBatsmanType, setRetiredHurtBatsmanType] = useState('striker');
  const [pendingRetiredHurt, setPendingRetiredHurt] = useState(false);
  const [battingTeamPlayers, setBattingTeamPlayers] = useState([]);
  const [bowlingTeamPlayers, setBowlingTeamPlayers] = useState([]);
  const [isAICompanionOpen, setIsAICompanionOpen] = useState(true);
  const [predictionData, setPredictionData] = useState(null);
  const [currentBattingTeam, setCurrentBattingTeam] = useState(null);
  const [currentBowlingTeam, setCurrentBowlingTeam] = useState(null);

  const [matchTime, setMatchTime] = useState(null);
  const [matchDate, setMatchDate] = useState(null);
  // New state for button freeze and hurry message
  const [isButtonFrozen, setIsButtonFrozen] = useState(false);
  const [showHurryMessage, setShowHurryMessage] = useState(false);

  const dismissalTypes = ['Caught', 'Bowled', 'LBW', 'Run Out', 'Stumped', 'Caught & Bowled', 'Caught Behind'];
  const catchTypes = ['Diving', 'Running', 'Overhead', 'One-handed', 'Standard'];

  useEffect(() => {
    const isOverCompleted = validBalls === 0 && overNumber > 0;
    const winA = Math.max(0, 100 - (playerScore + outCount * 5));
    const winB = 100 - winA;
    const generatedPrediction = {
      Chasing: isChasing,
      TeamA: teamA.name,
      TeamB: teamB.name,
      battingScore: playerScore,
      bowlingScore: targetScore,
      winA,
      winB,
      tournamentId,
      overNumber,
      wicketsFallen: outCount,
      nextOverProjection: `Predicted 8 runs with 1 boundary in Over ${overNumber}`,
      alternateOutcome: `If ${striker?.name || "the striker"} hits a 6 next ball, win probability increases by 5%.`,
    };
    setPredictionData(generatedPrediction);
  }, [playerScore, outCount, overNumber, validBalls, isChasing]);
  // Fetch time and date on mount
useEffect(() => {
  const fetchMatchDetails = async () => {
    try {
      const roundRobinRef = doc(db, "roundrobin", tournamentId);
      const roundRobinSnap = await getDoc(roundRobinRef);
      if (roundRobinSnap.exists()) {
        const roundRobinData = roundRobinSnap.data();
        const matchSchedule = roundRobinData.matchSchedule || [];
        const currentMatch = matchSchedule.find((ms) => ms.matchId === matchId);
        if (currentMatch) {
          setMatchTime(currentMatch.time || null);
          setMatchDate(currentMatch.date || null);
        } else {
          console.error(`Match with ID ${matchId} not found in matchSchedule.`);
        }
      } else {
        console.error(`Roundrobin document for tournament ${tournamentId} not found.`);
      }
    } catch (error) {
      console.error("Error fetching match details:", error);
    }
  };

  fetchMatchDetails();
}, []); // Empty dependency array: runs once on mount
// Initial save on component mount to set status to "live"
useEffect(() => {
  saveMatchData();  // Call without isFinal=true to set "live"
}, []);  // Empty dependency array: runs once on mount

  useEffect(() => {
    if (!gameFinished && matchId) {
      saveMatchData();
    }
  }, [playerScore, currentOverBalls, outCount, validBalls, overNumber, isChasing, striker, nonStriker, selectedBowler, batsmenStats, bowlerStats, wicketOvers]);

  useEffect(() => {
    console.log('Selected Match:', { matchId, phase });
    console.log('Tournament ID:', tournamentId);
    console.log('Tournament Name:', tournamentName);
    if (!teamA || !teamB || !selectedPlayersFromProps.left || !selectedPlayersFromProps.right || !tournamentId || !matchId || !phase) {
      console.error("Missing match data in location state. Redirecting.");
      navigate('/');
      return;
    }
    let initialBattingTeam = teamA;
    let initialBowlingTeam = teamB;
    let initialBattingPlayers = selectedPlayersFromProps.left;
    let initialBowlingPlayers = selectedPlayersFromProps.right;
    if (tossWinner && tossDecision) {
      if (tossWinner === teamA.name) {
        if (tossDecision === 'Batting') {
          initialBattingTeam = teamA;
          initialBowlingTeam = teamB;
          initialBattingPlayers = selectedPlayersFromProps.left;
          initialBowlingPlayers = selectedPlayersFromProps.right;
        } else if (tossDecision === 'Bowling') {
          initialBattingTeam = teamB;
          initialBowlingTeam = teamA;
          initialBattingPlayers = selectedPlayersFromProps.right;
          initialBowlingPlayers = selectedPlayersFromProps.left;
        }
      } else if (tossWinner === teamB.name) {
        if (tossDecision === 'Batting') {
          initialBattingTeam = teamB;
          initialBowlingTeam = teamA;
          initialBattingPlayers = selectedPlayersFromProps.right;
          initialBowlingPlayers = selectedPlayersFromProps.left;
        } else if (tossDecision === 'Bowling') {
          initialBattingTeam = teamA;
          initialBowlingTeam = teamB;
          initialBattingPlayers = selectedPlayersFromProps.left;
          initialBowlingPlayers = selectedPlayersFromProps.right;
        }
      }
    }
    if (!isChasing) {
      setCurrentBattingTeam(initialBattingTeam);
      setCurrentBowlingTeam(initialBowlingTeam);
      setBattingTeamPlayers(initialBattingPlayers.map((player, index) => ({
        ...player,
        index: player.name + index,
        photoUrl: player.photoUrl
      })));
      setBowlingTeamPlayers(initialBowlingPlayers.map((player, index) => ({
        ...player,
        index: player.name + index,
        photoUrl: player.photoUrl
      })));
    } else {
      setCurrentBattingTeam(initialBowlingTeam);
      setCurrentBowlingTeam(initialBattingTeam);
      setBattingTeamPlayers(initialBowlingPlayers.map((player, index) => ({
        ...player,
        index: player.name + index,
        photoUrl: player.photoUrl
      })));
      setBowlingTeamPlayers(initialBattingPlayers.map((player, index) => ({
        ...player,
        index: player.name + index,
        photoUrl: player.photoUrl
      })));
    }
    
    setStriker(null);
    setNonStriker(null);
    setSelectedBowler(null);
    setSelectedBatsmenIndices([]);
    setBatsmenScores({});
    setBatsmenBalls({});
    setBatsmenStats({});
    setBowlerStats({});
    setWicketOvers([]);
    setRetiredHurtPlayers([]);

    const allPlayers = [...selectedPlayersFromProps.left, ...selectedPlayersFromProps.right];
    initializeTournamentStats(tournamentId, matchId, allPlayers, db);
  }, [isChasing, selectedPlayersFromProps, teamA, teamB, navigate, tournamentId, matchId, phase, tossWinner, tossDecision]);

  const displayModal = (title, message) => {
    setModalContent({ title, message });
    setShowModal(true);
  };

  const handleButtonClick = (view) => {
    setCurrentView(view);
    setShowThirdButtonOnly(view === 'start');
    setViewHistory(prev => [...prev, view]);
  };

  const goBack = () => {
    if (gameFinished && showModal) {
      return;
    }

    if (showDismissalModal) {
      setShowDismissalModal(false);
      setSelectedDismissalType('');
      setSelectedCatchType('');
      setSelectedInvolvedPlayer(null);
      setOutRuns(null);
      return;
    }

    if (showBowlerDropdown) {
      setShowBowlerDropdown(false);
      return;
    }
    if (showBatsmanDropdown) {
      cancelBatsmanDropdown();
      return;
    }

    if (viewHistory.length > 1) {
      const newHistory = [...viewHistory];
      newHistory.pop();
      const previousView = newHistory[newHistory.length - 1];
      setViewHistory(newHistory);
      setCurrentView(previousView);
      setShowThirdButtonOnly(previousView === 'start');
      
      if (previousView === 'toss') {
        setBowlerVisible(false);
        setSelectedBowler(null);
      }
    } else {
      navigate(-1);
    }
  };

  const updateBatsmanScore = async (batsmanIndex, runs) => {
    setBatsmenScores(prev => ({
      ...prev,
      [batsmanIndex]: (prev[batsmanIndex] || 0) + runs
    }));
    const player = battingTeamPlayers.find(p => p.index === batsmanIndex);
    if (player) {
      const statUpdates = {
        "careerStats.batting.runs": runs
      };
      await updatePlayerCareerStats(player.name, statUpdates, db);
    }
  };

  const updateBatsmanBalls = async (batsmanIndex) => {
    setBatsmenBalls(prev => ({
      ...prev,
      [batsmanIndex]: (prev[batsmanIndex] || 0) + 1
    }));
    const player = battingTeamPlayers.find(p => p.index === batsmanIndex);
    if (player) {
      const statUpdates = {
        "careerStats.batting.innings": 1
      };
      await updatePlayerCareerStats(player.name, statUpdates, db);
    }
  };

  const updateBatsmanStats = async (batsmanIndex, runs, isDotBall = false) => {
    let newRuns = 0;
    let currentStats = {};
    setBatsmenStats(prev => {
      currentStats = prev[batsmanIndex] || {
        runs: 0,
        balls: 0,
        dotBalls: 0,
        ones: 0,
        twos: 0,
        threes: 0,
        fours: 0,
        sixes: 0,
        milestone: null
      };
      
      newRuns = currentStats.runs + runs;
      let milestone = currentStats.milestone;
      if (newRuns >= 100 && currentStats.runs < 100) milestone = 100;
      else if (newRuns >= 50 && currentStats.runs < 50) milestone = 50;

      return {
        ...prev,
        [batsmanIndex]: {
          ...currentStats,
          runs: newRuns,
          balls: currentStats.balls + (isDotBall || runs > 0 ? 1 : 0),
          dotBalls: isDotBall ? currentStats.dotBalls + 1 : currentStats.dotBalls,
          ones: runs === 1 ? currentStats.ones + 1 : currentStats.ones,
          twos: runs === 2 ? currentStats.twos + 1 : currentStats.twos,
          threes: runs === 3 ? currentStats.threes + 1 : currentStats.threes,
          fours: runs === 4 ? currentStats.fours + 1 : currentStats.fours,
          sixes: runs === 6 ? currentStats.sixes + 1 : currentStats.sixes,
          milestone
        }
      };
    });
    const player = battingTeamPlayers.find(p => p.index === batsmanIndex);
    if (player) {
      const statUpdates = {
        "careerStats.batting.runs": runs,
        "careerStats.batting.fifties": (newRuns >= 50 && currentStats.runs < 50) ? 1 : 0,
        "careerStats.batting.centuries": (newRuns >= 100 && currentStats.runs < 100) ? 1 : 0,
        "careerStats.batting.fours": (runs === 4) ? 1 : 0,
        "careerStats.batting.sixes": (runs === 6) ? 1 : 0,
        "careerStats.batting.highest": Math.max(newRuns, currentStats.highest || 0) - currentStats.runs,
        "careerStats.batting.average": 0,
        "careerStats.batting.strikeRate": 0,
        "careerStats.batting.innings": (isDotBall || runs > 0) ? 1 : 0,
        "careerStats.batting.matches": 0,
        "careerStats.batting.notOuts": 0,
        "careerStats.batting.wickets": 0
      };
      const tournamentUpdates = {
        runs: runs,
        ballsFaced: 1,
      };
      await updateTournamentBatting(tournamentId, matchId, player.name, tournamentUpdates, db);
      await updatePlayerCareerStats(player.name, statUpdates, db);
      await updatePlayerBattingAverage(player.name, db);
    }
  };

  const updateBowlerStats = async (bowlerIndex, isWicket = false, isValidBall = false, runsConceded = 0) => {
    let currentBowler = {};
    setBowlerStats(prev => {
      currentBowler = prev[bowlerIndex] || { wickets: 0, ballsBowled: 0, oversBowled: '0.0', runsConceded: 0 };
      const ballsBowled = currentBowler.ballsBowled + (isValidBall ? 1 : 0);
      const overs = Math.floor(ballsBowled / 6) + (ballsBowled % 6) / 10;
      return {
        ...prev,
        [bowlerIndex]: {
          wickets: isWicket ? (currentBowler.wickets || 0) + 1 : currentBowler.wickets || 0,
          ballsBowled,
          oversBowled: overs.toFixed(1),
          runsConceded: (currentBowler.runsConceded || 0) + runsConceded
        }
      };
    });
    const player = bowlingTeamPlayers.find(p => p.index === bowlerIndex);
    if (player) {
      const statUpdates = {
        "careerStats.bowling.wickets": isWicket ? 1 : 0,
        "careerStats.bowling.innings": isValidBall ? 1 : 0,
        "careerStats.bowling.runsConceded": runsConceded,
        "careerStats.bowling.average": 0,
        "careerStats.bowling.best": 0,
        "careerStats.bowling.economy": 0,
        "careerStats.bowling.strikeRate": 0
      };
      const tournamentUpdates = {
        wickets: isWicket ? 1 : 0,
        ballsBowled: isValidBall ? 1 : 0,
        runsConceded: runsConceded,
      };
      await updateTournamentBowling(tournamentId, matchId, player.name, tournamentUpdates, db);
      await updatePlayerCareerStats(player.name, statUpdates, db);
      await updatePlayerBowlingAverage(player.name, db);
    }
  };

  const recordDismissal = async (batsmanIndex, dismissalType, catchType = null, involvedPlayer = null) => {
    const currentOver = `${overNumber - 1}.${validBalls + 1}`;
    setWicketOvers(prev => [...prev, { 
      batsmanIndex, 
      over: currentOver,
      dismissalType,
      catchType,
      involvedPlayer: involvedPlayer ? { name: involvedPlayer.name, index: involvedPlayer.index } : null
    }]);

    const batsman = battingTeamPlayers.find(p => p.index === batsmanIndex);
    if (batsman) {
      const statUpdates = {
        "careerStats.batting.dismissals": 1
      };
      await updateTournamentBatting(tournamentId, matchId, batsman.name, { dismissals: 1 }, db);
      await updatePlayerCareerStats(batsman.name, statUpdates, db);
      await updatePlayerBattingAverage(batsman.name, db);
    }
    if (involvedPlayer) {
      let fieldingUpdate = {};
      if (['Caught', 'Caught Behind', 'Caught & Bowled'].includes(dismissalType)) {
        fieldingUpdate = { catches: 1 };
      } else if (dismissalType === 'Stumped') {
        fieldingUpdate = { stumpings: 1 };
      } else if (dismissalType === 'Run Out') {
        fieldingUpdate = { runOuts: 1 };
      }
      await updateTournamentFielding(tournamentId, matchId, involvedPlayer.name, fieldingUpdate, db);
    }

    let isBowlerWicket = false;

    switch (dismissalType) {
      case 'Caught':
      case 'Caught Behind':
        if (involvedPlayer) {
          const statUpdates = {
            "careerStats.fielding.catches": 1
          };
          await updatePlayerCareerStats(involvedPlayer.name, statUpdates, db);
        }
        isBowlerWicket = true;
        break;
      case 'Caught & Bowled':
        if (selectedBowler) {
          const statUpdates = {
            "careerStats.fielding.catches": 1
          };
          await updatePlayerCareerStats(selectedBowler.name, statUpdates, db);
        }
        isBowlerWicket = true;
        break;
      case 'Bowled':
      case 'LBW':
        isBowlerWicket = true;
        break;
      case 'Stumped':
        if (involvedPlayer) {
          const statUpdates = {
            "careerStats.fielding.stumpings": 1
          };
          await updatePlayerCareerStats(involvedPlayer.name, statUpdates, db);
        }
        isBowlerWicket = true;
        break;
      case 'Run Out':
        if (involvedPlayer) {
          const statUpdates = {
            "careerStats.fielding.runOuts": 1
          };
          await updatePlayerCareerStats(involvedPlayer.name, statUpdates, db);
        }
        break;
      default:
        break;
    }

    if (isBowlerWicket && selectedBowler) {
      await updateBowlerStats(selectedBowler.index, true, true, 0);
    }
  };

  const playAnimation = (type) => {
    setAnimationType(type);
    setShowAnimation(true);
    setTimeout(() => {
      setShowAnimation(false);
    }, 3000);
  };

  const saveMatchData = async (isFinal = false) => {
    try {
      if (!auth.currentUser) {
        console.error('No authenticated user found.');
        return;
      }
      const overs = `${overNumber - 1}.${validBalls}`;
      const battingTeam = isChasing ? teamB : teamA;
      const bowlingTeam = isChasing ? teamA : teamB;
      const playerStats = battingTeamPlayers.map(player => {
        const stats = batsmenStats[player.index] || {};
        const wicket = wicketOvers.find(w => w.batsmanIndex === player.index);
        return {
          index: player.index || '',
          name: player.name || 'Unknown',
          photoUrl: player.photoUrl || '',
          role: player.role || '',
          runs: stats.runs || 0,
          balls: stats.balls || 0,
          dotBalls: stats.dotBalls || 0,
          ones: stats.ones || 0,
          twos: stats.twos || 0,
          threes: stats.threes || 0,
          fours: stats.fours || 0,
          sixes: stats.sixes || 0,
          milestone: stats.milestone || null,
          wicketOver: wicket ? wicket.over : null,
          dismissalType: wicket?.dismissalType || null,
          catchType: wicket?.catchType || null,
          involvedPlayer: wicket?.involvedPlayer || null
        };
      });
      const bowlerStatsArray = bowlingTeamPlayers.map(player => {
        const stats = bowlerStats[player.index] || {};
        return {
          index: player.index || '',
          name: player.name || 'Unknown',
          photoUrl: player.photoUrl || '',
          role: player.role || '',
          wickets: stats.wickets || 0,
          oversBowled: stats.oversBowled || '0.0',
          runsConceded: stats.runsConceded || 0
        };
      });
      const matchData = {
        matchId,
        tournamentId,
        userId: auth.currentUser.uid,
        createdAt: Timestamp.fromDate(new Date()),
        tournamentName,
        umpire: 'naga',
        phase: phase || 'Unknown',
        Format: maxOvers,
        teamA: {
          name: teamA?.name || 'Team A',
          flagUrl: teamA?.flagUrl || '',
          players: selectedPlayersFromProps.left.map(p => ({
            name: p.name || 'Unknown',
            index: p.name + selectedPlayersFromProps.left.findIndex(pl => pl.name === p.name),
            photoUrl: p.photoUrl || '',
            role: p.role || ''
          })),
          totalScore: isChasing ? (firstInningsData?.totalScore || 0) : playerScore,
          wickets: isChasing ? (firstInningsData?.wickets || 0) : outCount,
          overs: isChasing ? (firstInningsData?.overs || '0.0') : overs,
          result: isFinal ? (playerScore < targetScore - 1 ? 'Win' : playerScore === targetScore - 1 ? 'Tie' : 'Loss') : null
        },
        teamB: {
          name: teamB?.name || 'Team B',
          flagUrl: teamB?.flagUrl || '',
          players: selectedPlayersFromProps.right.map(p => ({
            name: p.name || 'Unknown',
            index: p.name + selectedPlayersFromProps.right.findIndex(pl => pl.name === p.name),
            photoUrl: p.photoUrl || '',
            role: p.role || ''
          })),
          totalScore: isChasing ? playerScore : (firstInningsData?.totalScore || 0),
          wickets: isChasing ? outCount : (firstInningsData?.wickets || 0),
          overs: isChasing ? overs : (firstInningsData?.overs || '0.0'),
          result: isFinal ? (playerScore < targetScore - 1 ? 'Loss' : playerScore === targetScore - 1 ? 'Tie' : 'Win') : null
        },
        firstInnings: firstInningsData || {
          teamName: currentBattingTeam?.name || 'Team A',
          totalScore: playerScore,
          wickets: outCount,
          overs,
          playerStats,
          bowlerStats: bowlerStatsArray
        },
        secondInnings: isChasing ? {
          teamName: currentBattingTeam?.name || 'Team B',
          totalScore: playerScore,
          wickets: outCount,
          overs,
          playerStats,
          bowlerStats: bowlerStatsArray
        } : null,
        matchResult: isFinal ? (playerScore < targetScore - 1 ? teamA?.name || 'Team A' : playerScore === targetScore - 1 ? 'Tie' : teamB?.name || 'Team B') : null,
        player: {
          striker: striker ? { name: striker.name, index: striker.index, role: striker.role } : null,
          nonStriker: nonStriker ? { name: nonStriker.name, index: nonStriker.index, role: nonStriker.role } : null,
          bowler: selectedBowler ? { name: selectedBowler.name, index: selectedBowler.index, role: selectedBowler.role } : null
        },
        // New: Add time and date (fetched at start)
        time: matchTime,
        date: matchDate,
        // New: Add status field
        status: isFinal ? "past" : "live",
      };
      const docId = `${tournamentId}_${matchId}`;
      await setDoc(doc(db, 'scoringpage', docId), matchData);
      console.log('Match data updated successfully:', matchData);
    } catch (error) {
      console.error('Error saving match data:', error);
    }
  };

  const handleScoreButtonClick = (value, isLabel) => {
    if (gameFinished) return;

    // Handle numeric buttons with debouncing
    if (!isLabel && typeof value === 'number' && [0, 1, 2, 3, 4, 6].includes(value)) {
      if (isButtonFrozen) {
        setShowHurryMessage(true);
        setTimeout(() => setShowHurryMessage(false), 2000);
        return;
      }

      // Freeze buttons for 2 seconds
      setIsButtonFrozen(true);
      setTimeout(() => setIsButtonFrozen(false), 2000);
    }

    let runsToAdd = 0;
    let isValidBall = false;

    if (isLabel) {
      setActiveNumber(null);
      setActiveLabel(value);
    } else {
      setActiveLabel(null);
      setActiveNumber(value);
    }

    if (pendingWide) {
      if (!isLabel && typeof value === 'number') {
        runsToAdd = value + 1;
        setPlayerScore(prev => prev + runsToAdd);
        setTopPlays(prev => [...prev, `W${value}`]);
        setCurrentOverBalls(prev => [...prev, `W${value}`]);

        if (striker) {
          updateBatsmanScore(striker.index, value + 1);
          updateBatsmanStats(striker.index, value + 1);
        }
        if (selectedBowler) {
          updateBowlerStats(selectedBowler.index, false, false, runsToAdd);
        }

        setPendingWide(false);
        return;
      }
    }

    if (pendingNoBall) {
      if (!isLabel && typeof value === 'number') {
        runsToAdd = value + 1;
        setPlayerScore(prev => prev + runsToAdd);
        setTopPlays(prev => [...prev, `NB${value}`]);
        setCurrentOverBalls(prev => [...prev, `NB${value}`]);

        if (striker) {
          updateBatsmanScore(striker.index, value + 1);
          updateBatsmanStats(striker.index, value + 1);
        }
        if (selectedBowler) {
          updateBowlerStats(selectedBowler.index, false, false, runsToAdd);
        }

        setPendingNoBall(false);
        return;
      }
    }

    if (pendingLegBy) {
      if (!isLabel && typeof value === 'number') {
        runsToAdd = value;
        setPlayerScore(prev => prev + runsToAdd);
        setTopPlays(prev => [...prev, `L${value}`]);
        setCurrentOverBalls(prev => [...prev, `L${value}`]);
        setValidBalls(prev => prev + 1);
        isValidBall = true;

        const legByBatsmanIndex = legByBatsmanType === 'striker' ? striker.index : nonStriker.index;
        updateBatsmanBalls(legByBatsmanIndex);

        if (selectedBowler) {
          updateBowlerStats(selectedBowler.index, false, true, runsToAdd);
        }

        if (value % 2 !== 0) {
          const temp = striker;
          setStriker(nonStriker);
          setNonStriker(temp);
        }

        setPendingLegBy(false);
        setLegByBatsmanType('striker');
        return;
      }
    }

    if (pendingOut) {
      if (!isLabel && typeof value === 'number') {
        if (value !== 0 && value !== 1 && value !== 2) return;
        setOutRuns(value);
        playAnimation('out');
        setTimeout(() => {
          setShowDismissalModal(true);
        }, 3000);
        return;
      }
    }

    if (pendingRetiredHurt) {
      return;
    }

    const extraBalls = ['No-ball', 'Wide', 'No ball'];
    const playValue = typeof value === 'string' ? value.charAt(0) : value;

    if (isLabel) {
      if (value === 'Wide' || value === 'No-ball' || value === 'Leg By' || value === 'OUT' || value === 'Retired Hurt') {
        setShowRunInfo(true);
      } else {
        setShowRunInfo(false);
      }

      if (value === 'Six') {
        playAnimation('six');
        runsToAdd = 6;
        setPlayerScore(prev => prev + runsToAdd);
        setTopPlays(prev => [...prev, '6']);
        setCurrentOverBalls(prev => [...prev, '6']);

        if (striker) {
          updateBatsmanScore(striker.index, 6);
          updateBatsmanStats(striker.index, 6);
          updateBatsmanBalls(striker.index);
        }
        setValidBalls(prev => prev + 1);
        isValidBall = true;

        if (selectedBowler) {
          updateBowlerStats(selectedBowler.index, false, true, runsToAdd);
        }
      } else if (value === 'Four') {
        playAnimation('four');
        runsToAdd = 4;
        setPlayerScore(prev => prev + runsToAdd);
        setTopPlays(prev => [...prev, '4']);
        setCurrentOverBalls(prev => [...prev, '4']);

        if (striker) {
          updateBatsmanScore(striker.index, 4);
          updateBatsmanStats(striker.index, 4);
          updateBatsmanBalls(striker.index);
        }
        setValidBalls(prev => prev + 1);
        isValidBall = true;

        if (selectedBowler) {
          updateBowlerStats(selectedBowler.index, false, true, runsToAdd);
        }
      } else if (value === 'Wide') {
        setPendingWide(true);
        return;
      } else if (value === 'No-ball') {
        setPendingNoBall(true);
        return;
      } else if (value === 'Leg By') {
        setShowLegByModal(true);
        return;
      } else if (value === 'OUT' || value === 'Wicket' || value === 'lbw') {
        setPendingOut(true);
        return;
      } else if (value === 'Retired Hurt') {
        setShowRetiredHurtModal(true);
        return;
      }

      if (!extraBalls.includes(value)) {
        setValidBalls(prev => prev + 1);

        if (striker && value !== 'Wide' && value !== 'No-ball') {
          updateBatsmanBalls(striker.index);
        }
      } else {
        setShowRunInfo(false);
      }
    } else {
      runsToAdd = value;
      setPlayerScore(prev => prev + runsToAdd);
      setTopPlays(prev => [...prev, value]);
      setCurrentOverBalls(prev => [...prev, value]);
      setValidBalls(prev => prev + 1);
      isValidBall = true;

      if (striker) {
        updateBatsmanScore(striker.index, value);
        updateBatsmanStats(striker.index, value, value === 0);
        updateBatsmanBalls(striker.index);
      }

      if (selectedBowler) {
        updateBowlerStats(selectedBowler.index, false, true, runsToAdd);
      }

      if (value % 2 !== 0) {
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
      }

      if (value === 6) {
        playAnimation('six');
      } else if (value === 4) {
        playAnimation('four');
      }

      if (!pendingOut && !pendingWide && !pendingNoBall && !pendingLegBy && typeof value === 'number' && value !== 0) {
        setSelectedRun(value);
        setShowMainWheel(true);
      }
    }
  };

  const handleLegByModalSubmit = () => {
    if (!legByBatsmanType) return;
    setPendingLegBy(true);
    setShowLegByModal(false);
    setShowRunInfo(true);
  };

  const handleRetiredHurtModalSubmit = () => {
    if (!retiredHurtBatsmanType) return;

    const retiredBatsman = retiredHurtBatsmanType === 'striker' ? striker : nonStriker;

    setRetiredHurtPlayers(prev => [...prev, retiredBatsman]);

    if (retiredHurtBatsmanType === 'striker') {
      setStriker(null);
      setNextBatsmanEnd('striker');
    } else {
      setNonStriker(null);
      setNextBatsmanEnd('non-striker');
    }

    setShowRetiredHurtModal(false);
    setShowBatsmanDropdown(true);

    setCurrentOverBalls(prev => [...prev, 'RH']);
    setTopPlays(prev => [...prev, 'RH']);
    setValidBalls(prev => prev + 1);
  };

  const handleDismissalModalSubmit = () => {
    if (!selectedDismissalType) return;

    let isValid = true;
    if (['Caught', 'Caught Behind'].includes(selectedDismissalType)) {
      if (!selectedCatchType || !selectedInvolvedPlayer) isValid = false;
    } else if (['Run Out', 'Stumped', 'Caught Behind'].includes(selectedDismissalType)) {
      if (!selectedInvolvedPlayer) isValid = false;
    } else if (selectedDismissalType === 'Run Out') {
      if (!outBatsmanType) isValid = false;
    }

    if (!isValid) return;

    playAnimation('out');

    setTimeout(() => {
      setPlayerScore(prev => prev + outRuns);

      let displayText = `O${outRuns} ${selectedDismissalType}`;
      if (selectedCatchType) displayText += ` - ${selectedCatchType}`;
      displayText;

      setTopPlays(prev => [...prev, displayText]);
      setCurrentOverBalls(prev => [...prev, displayText]);

      let outBatsman = outBatsmanType === 'striker' ? striker : nonStriker;
      const batsmanIndex = outBatsman.index;

      updateBatsmanScore(batsmanIndex, outRuns);
      updateBatsmanStats(batsmanIndex, outRuns, outRuns === 0);
      updateBatsmanBalls(batsmanIndex);

      recordDismissal(batsmanIndex, selectedDismissalType, selectedCatchType, selectedInvolvedPlayer);

      setValidBalls(prev => prev + 1);

      setOutCount(prev => prev + 1);

      let positionToRemove = outBatsmanType;

      if (outRuns % 2 !== 0) {
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);

        positionToRemove = positionToRemove === 'striker' ? 'non-striker' : 'striker';
      }

      if (positionToRemove === 'striker') {
        setStriker(null);
      } else {
        setNonStriker(null);
      }

      setNextBatsmanEnd(positionToRemove);

      const availableBatsmen = getAvailableBatsmen();

      if (availableBatsmen.length === 0) {
        setShowDismissalModal(false);
        setPendingOut(false);
        setSelectedDismissalType('');
        setSelectedCatchType('');
        setSelectedInvolvedPlayer(null);
        setOutRuns(null);
        setOutBatsmanType('striker');
      } else {
        setShowBatsmanDropdown(true);
        setShowDismissalModal(false);
        setPendingOut(false);
        setSelectedDismissalType('');
        setSelectedCatchType('');
        setSelectedInvolvedPlayer(null);
        setOutRuns(null);
        setOutBatsmanType('striker');
      }
    }, 1000);
  };

  const handleUndoBall = async () => {
    if (currentOverBalls.length === 0) {
      if (pastOvers.length === 0) return;
      const lastOver = pastOvers.pop();
      setCurrentOverBalls(lastOver);
      setPastOvers([...pastOvers]);
      setOverNumber(prev => prev - 1);
      setValidBalls(6);
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);
    }

    const lastBall = currentOverBalls.pop();
    setCurrentOverBalls([...currentOverBalls]);
    setTopPlays(prev => prev.slice(0, -1));
    let runs = 0;
    let isValid = false;
    let isWicket = false;
    let isWide = false;
    let isNoBall = false;
    let isLegBy = false;
    let dismissalType = null;
    let catchType = null;
    let involvedPlayer = null;
    if (typeof lastBall === 'number') {
      runs = lastBall;
      isValid = true;
      if (runs % 2 !== 0) {
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
      }
    } else if (typeof lastBall === 'string') {
      if (lastBall.startsWith('W+')) {
        isWide = true;
        runs = parseInt(lastBall.slice(2)) + 1;
      } else if (lastBall.startsWith('NB+')) {
        isNoBall = true;
        runs = parseInt(lastBall.slice(3)) + 1;
      } else if (lastBall.startsWith('L+')) {
        isLegBy = true;
        runs = parseInt(lastBall.slice(2));
        isValid = true;
        if (runs % 2 !== 0) {
          const temp = striker;
          setStriker(nonStriker);
          setNonStriker(temp);
        }
      } else if (lastBall.startsWith('O+')) {
        isWicket = true;
        isValid = true;
        const parts = lastBall.match(/O\+(\d+) \((.+?)( - (.+?))?\)/);
        if (parts) {
          runs = parseInt(parts[1]);
          dismissalType = parts[2];
          catchType = parts[4] || null;
        } else {
          runs = parseInt(lastBall.slice(2));
        }
        const lastWicket = wicketOvers.pop();
        setWicketOvers([...wicketOvers]);
        setOutCount(prev => prev - 1);
        if (lastWicket && lastWicket.involvedPlayer) {
          let statPath;
          switch (lastWicket.dismissalType) {
            case 'Caught':
            case 'Caught Behind':
            case 'Caught & Bowled':
              statPath = "careerStats.fielding.catches";
              break;
            case 'Stumped':
              statPath = "careerStats.fielding.stumpings";
              break;
            case 'Run Out':
              statPath = "careerStats.fielding.runOuts";
              break;
          }
          if (statPath) {
            await updatePlayerCareerStats(lastWicket.involvedPlayer.name, { [statPath]: -1 }, db);
          }
        }
        const batsman = battingTeamPlayers.find(p => p.index === lastWicket.batsmanIndex);
        if (batsman) {
          await updatePlayerCareerStats(batsman.name, { "careerStats.batting.dismissals": -1 }, db);
          await updatePlayerBattingAverage(batsman.name, db);
        }
      }
    }

    setPlayerScore(prev => prev - runs);
    if (isValid) {
      setValidBalls(prev => Math.max(0, prev - 1));
      if (striker) {
        await updateBatsmanScore(striker.index, -runs);
        await updateBatsmanStats(striker.index, -runs, runs === 0);
        await updateBatsmanBalls(striker.index, -1);
      }
      if (selectedBowler) {
        await updateBowlerStats(selectedBowler.index, isWicket ? -1 : 0, true, -runs);
      }
    } else if (isWide || isNoBall) {
      if (striker) {
        await updateBatsmanScore(striker.index, -runs);
        await updateBatsmanStats(striker.index, -runs);
      }
      if (selectedBowler) {
        await updateBowlerStats(selectedBowler.index, false, false, -runs);
      }
    }

    setPendingWide(false);
    setPendingNoBall(false);
    setPendingLegBy(false);
    setPendingOut(false);
    setActiveLabel(null);
    setActiveNumber(null);
    setShowRunInfo(false);
  };

  useEffect(() => {
    if (modalContent.title !== 'Match Result') return;

    const canvas = document.getElementById('fireworks-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    let fireworks = [];

    function randomColor() {
      return `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)`;
    }

    function createFirework(x, y) {
      const color = randomColor();
      const particles = [];
      const particleCount = 30;

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = Math.random() * 1 + 0.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
          size: Math.random() * 2 + 0.5,
        });
      }

      fireworks.push({ particles });
    }

    function launch() {
      createFirework(width / 2, height / 3);
      createFirework(width / 4, height / 1.8);
      createFirework((3 * width) / 4, height / 1.8);
    }

    const interval = setInterval(launch, 1500);
    update();

    function update() {
      ctx.clearRect(0, 0, width, height);

      fireworks.forEach(firework => {
        firework.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.005;

          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
        firework.particles = firework.particles.filter(p => p.alpha > 0);
      });
      fireworks = fireworks.filter(f => f.particles.length > 0);
      ctx.globalAlpha = 1;
      requestAnimationFrame(update);
    }
    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
      fireworks = [];
      ctx.clearRect(0, 0, width, height);
    };
  }, [modalContent.title]);

  useEffect(() => {
    if (gameFinished) {
      saveMatchData(true);
      return;
    }
    if (outCount >= 10 || (validBalls === 6 && overNumber > maxOvers - 1)) {
      if (!isChasing) {
        const overs = `${overNumber - 1}.${validBalls}`;
        const playerStats = battingTeamPlayers.map(player => {
          const stats = batsmenStats[player.index] || {};
          const wicket = wicketOvers.find(w => w.batsmanIndex === player.index);
          return {
            index: player.index || '',
            name: player.name || 'Unknown',
            photoUrl: player.photoUrl || '',
            role: player.role || '',
            runs: stats.runs || 0,
            balls: stats.balls || 0,
            dotBalls: stats.dotBalls || 0,
            ones: stats.ones || 0,
            twos: stats.twos || 0,
            threes: stats.threes || 0,
            fours: stats.fours || 0,
            sixes: stats.sixes || 0,
            milestone: stats.milestone || null,
            wicketOver: wicket ? wicket.over : null,
            dismissalType: wicket?.dismissalType || null,
            catchType: wicket?.catchType || null,
            involvedPlayer: wicket?.involvedPlayer || null
          };
        });
        const bowlerStatsArray = bowlingTeamPlayers.map(player => {
          const stats = bowlerStats[player.index] || {};
          return {
            index: player.index || '',
            name: player.name || 'Unknown',
            photoUrl: player.photoUrl || '',
            role: player.role || '',
            wickets: stats.wickets || 0,
            oversBowled: stats.oversBowled || '0.0',
            runsConceded: stats.runsConceded || 0
          };
        });
        setFirstInningsData({
          teamName: teamA?.name || 'Team A',
          totalScore: playerScore,
          wickets: outCount,
          overs,
          playerStats,
          bowlerStats: bowlerStatsArray
        });
        setTargetScore(playerScore + 1);
        setIsChasing(true);
        resetInnings();
        setViewHistory(['toss']);
        saveMatchData();
        displayModal('Innings Break', `You need to chase ${playerScore + 1} runs`);
      } else {
        let winnerTeamName = '';
        if (playerScore < targetScore - 1) {
          winnerTeamName = teamA.name;
          displayModal('Match Result', `${teamA.name} wins by ${targetScore - 1 - playerScore} runs!`);
          setGameFinished(true);
        } else if (playerScore === targetScore - 1) {
          winnerTeamName = 'Tie';
          displayModal('Match Result', 'Match tied!');
          setGameFinished(true);
        } else {
          winnerTeamName = teamB.name;
          displayModal('Match Result', `${teamB.name} wins by ${10 - outCount} wickets!`);
          setGameFinished(true);
        }
        saveMatchData(true);
      }
      return;
    }
    if (isChasing && playerScore >= targetScore && targetScore > 0) {
      displayModal('Match Result', `${teamB.name} wins by ${10 - outCount} wickets!`);
      setGameFinished(true);
      saveMatchData(true);
      return;
    }

    if (validBalls === 6) {
      setPastOvers(prev => [...prev, currentOverBalls]);
      setCurrentOverBalls([]);
      setOverNumber(prev => prev + 1);
      setValidBalls(0);
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);
      displayModal('Over Finished', `Over ${overNumber} completed!`);
      setTimeout(() => {
        setShowBowlerDropdown(true);
      }, 1000);
      saveMatchData();
    }
  }, [validBalls, currentOverBalls, nonStriker, overNumber, isChasing, targetScore, playerScore, gameFinished, outCount, maxOvers, teamA, teamB, playedOvers, playedWickets]);

  const resetInnings = () => {
    setCurrentOverBalls([]);
    setPastOvers([]);
    setPlayerScore(0);
    setOutCount(0);
    setValidBalls(0);
    setOverNumber(1);
    setStriker(null);
    setNonStriker(null);
    setSelectedBowler(null);
    setSelectedBatsmenIndices([]);
    setTopPlays([]);
    setBowlerVisible(false);
    setCurrentView('toss');
    setShowThirdButtonOnly(false);
    setViewHistory(['toss']);
    setBatsmenScores({});
    setBatsmenBalls({});
    setBatsmenStats({});
    setBowlerStats({});
    setWicketOvers([]);
    setGameFinished(false);
    setPendingWide(false);
    setPendingNoBall(false);
    setPendingOut(false);
    setPendingLegBy(false);
    setPendingRetiredHurt(false);
    setActiveLabel(null);
    setActiveNumber(null);
    setShowRunInfo(false);
    setShowDismissalModal(false);
    setSelectedDismissalType('');
    setSelectedCatchType('');
    setSelectedInvolvedPlayer(null);
    setOutRuns(null);
    setRetiredHurtPlayers([]);
  };

  const resetGame = () => {
    resetInnings();
    setIsChasing(false);
    setTargetScore(0);
    setViewHistory(['toss']);
  };

  const getStrikeRate = (batsmanIndex) => {
    const runs = batsmenScores[batsmanIndex] || 0;
    const balls = batsmenBalls[batsmanIndex] || 0;
    if (balls === 0) return 0;
    return ((runs / balls) * 100).toFixed(2);
  };

  const handlePlayerSelect = (player) => {
    if (!striker) {
      setStriker(player);
      setSelectedBatsmenIndices(prev => [...prev, player.index]);
      setBatsmenScores(prev => ({ ...prev, [player.index]: 0 }));
      setBatsmenBalls(prev => ({ ...prev, [player.index]: 0 }));
      setBatsmenStats(prev => ({
        ...prev,
        [player.index]: {
          runs: 0,
          balls: 0,
          dotBalls: 0,
          ones: 0,
          twos: 0,
          threes: 0,
          fours: 0,
          sixes: 0,
          milestone: null
        }
      }));
    } else if (!nonStriker && striker.index !== player.index) {
      setNonStriker(player);
      setSelectedBatsmenIndices(prev => [...prev, player.index]);
      setBatsmenScores(prev => ({ ...prev, [player.index]: 0 }));
      setBatsmenBalls(prev => ({ ...prev, [player.index]: 0 }));
      setBatsmenStats(prev => ({
        ...prev,
        [player.index]: {
          runs: 0,
          balls: 0,
          dotBalls: 0,
          ones: 0,
          twos: 0,
          threes: 0,
          fours: 0,
          sixes: 0,
          milestone: null
        }
      }));
    }
  };

  const handleBowlerSelect = (player) => {
    setSelectedBowler(player);
    setBowlerStats(prev => ({
      ...prev,
      [player.index]: {
        wickets: prev[player.index]?.wickets || 0,
        ballsBowled: prev[player.index]?.ballsBowled || 0,
        oversBowled: prev[player.index]?.oversBowled || '0.0',
        runsConceded: prev[player.index]?.runsConceded || 0
      }
    }));
    setShowBowlerDropdown(false);
  };

  const handleBatsmanSelect = (player) => {
    if (retiredHurtPlayers.some(p => p.index === player.index)) {
      setRetiredHurtPlayers(prev => prev.filter(p => p.index !== player.index));
    }
    if (nextBatsmanEnd === 'striker') {
      setStriker(player);
    } else {
      setNonStriker(player);
    }
    setSelectedBatsmenIndices(prev => [...prev, player.index]);
    setShowBatsmanDropdown(false);
    setBatsmenScores(prev => ({ ...prev, [player.index]: 0 }));
    setBatsmenBalls(prev => ({ ...prev, [player.index]: 0 }));
    setBatsmenStats(prev => ({
      ...prev,
      [player.index]: {
        runs: 0,
        balls: 0,
        dotBalls: 0,
        ones: 0,
        twos: 0,
        threes: 0,
        fours: 0,
        sixes: 0,
        milestone: null
      }
    }));
    setNextBatsmanEnd(null);
  };

  const getAvailableBatsmen = () => {
    const notBatted = battingTeamPlayers.filter(player =>
      !selectedBatsmenIndices.includes(player.index)
    );
    const availableRetired = (outCount < 9) ? retiredHurtPlayers : [];
    return [...notBatted, ...availableRetired];
  };

  const cancelStriker = () => {
    setSelectedBatsmenIndices(prev => prev.filter(i => i !== striker?.index));
    const newScores = { ...batsmenScores };
    delete newScores[striker?.index];
    setBatsmenScores(newScores);
    const newBalls = { ...batsmenBalls };
    delete newBalls[striker?.index];
    setBatsmenBalls(newBalls);
    const newStats = { ...batsmenStats };
    delete newStats[striker?.index];
    setBatsmenStats(newStats);
    setStriker(null);
  };

  const cancelNonStriker = () => {
    setSelectedBatsmenIndices(prev => prev.filter(i => i !== nonStriker?.index));
    const newScores = { ...batsmenScores };
    delete newScores[nonStriker?.index];
    setBatsmenScores(newScores);
    const newBalls = { ...batsmenBalls };
    delete newBalls[nonStriker?.index];
    setBatsmenBalls(newBalls);
    const newStats = { ...batsmenStats };
    delete newStats[nonStriker?.index];
    setBatsmenStats(newStats);
    setNonStriker(null);
  };

  const cancelBatsmanDropdown = () => {
    setShowBatsmanDropdown(false);
    setPendingOut(false);
    setTopPlays(prev => prev.slice(0, -1));
    setCurrentOverBalls(prev => prev.slice(0, -1));
    setValidBalls(prev => Math.max(0, prev - 1));
    setWicketOvers(prev => prev.filter(w => w.batsmanIndex !== striker?.index));
  };

  const updateWinnerInFirebase = async (winnerTeamName) => {
    if (!tournamentId || !teamA || !teamB || !matchId || !phase) {
      console.error('Missing required data to update winner:', { tournamentId, teamA, teamB, matchId, phase });
      return;
    }

    try {
      const tournamentRef = doc(db, 'roundrobin', tournamentId);
      const tournamentDoc = await getDoc(tournamentRef);
      if (!tournamentDoc.exists()) {
        console.error('Tournament not found.');
        return;
      }

      const tournamentData = tournamentDoc.data();
      let matchesToUpdate = [];
      let phaseKey = '';
      let matchIndex = -1;

      if (phase.includes('Group Stage')) {
        const groupNumber = phase.match(/Group Stage (\d+)/)?.[1];
        if (!groupNumber) {
          console.error('Invalid group stage phase:', phase);
          return;
        }
        phaseKey = `roundRobin.group_stage_${groupNumber}`;
        matchesToUpdate = tournamentData.roundRobin?.[`group_stage_${groupNumber}`] || [];
      } else if (phase.includes('Semi-Final')) {
        phaseKey = 'semiFinals';
        matchesToUpdate = Object.values(tournamentData.semiFinals || {});
      } else if (phase === 'Final') {
        phaseKey = 'finals';
        matchesToUpdate = Object.values(tournamentData.finals || {});
      } else {
        console.error('Invalid phase:', phase);
        return;
      }

      matchIndex = matchesToUpdate.findIndex(match =>
        match.id === matchId &&
        ((match.team1 === teamA.name && match.team2 === teamB.name) ||
         (match.team1 === teamB.name && match.team2 === teamA.name))
      );

      if (matchIndex === -1) {
        console.error('Match not found:', { matchId, teamA: teamA.name, teamB: teamB.name, phase });
        return;
      }
      if (phase.includes('Group Stage')) {
        const updatedMatches = [...matchesToUpdate];
        updatedMatches[matchIndex] = {
          ...updatedMatches[matchIndex],
          winner: winnerTeamName === 'Tie' ? 'Tie' : winnerTeamName
        };

        const groupNumber = phase.match(/Group Stage (\d+)/)?.[1];
        await updateDoc(tournamentRef, {
          [`roundRobin.group_stage_${groupNumber}`]: updatedMatches
        });
      } else if (phase.includes('Semi-Final')) {
        const updatePath = `semiFinals.match_${matchIndex + 1}.winner`;
        await updateDoc(tournamentRef, {
          [updatePath]: winnerTeamName === 'Tie' ? 'Tie' : winnerTeamName
        });
      } else if (phase === 'Final') {
        const updatePath = `finals.match_${matchIndex + 1}.winner`;
        await updateDoc(tournamentRef, {
          [updatePath]: winnerTeamName === 'Tie' ? 'Tie' : winnerTeamName
        });
      }
      if (winnerTeamName !== 'Tie') {
        const teams = tournamentData.teams || [];
        const teamIndex = teams.findIndex(team => team.teamName === winnerTeamName);
        if (teamIndex === -1) {
          console.error(`Team ${winnerTeamName} not found in teams array.`);
          return;
        }

        const updatedTeams = [...teams];
        const currentPoints = updatedTeams[teamIndex].points || 0;
        updatedTeams[teamIndex] = {
          ...updatedTeams[teamIndex],
          points: currentPoints + 2
        };

        await updateDoc(tournamentRef, {
          teams: updatedTeams
        });
        console.log(`Points updated: ${winnerTeamName} now has ${currentPoints + 2} points`);
      }

      console.log(`Winner updated: ${winnerTeamName} for match ${matchId} in ${phase}`);
    } catch (err) {
      console.error('Error updating winner in Firebase:', err);
    }
  };
  async function updatePointsTable(tournamentId, teamA, teamB, winnerTeamName, isTie, firstInnings, secondInnings, maxOvers) {
  try {
    const pointsTableRef = doc(db, 'PointsTable', tournamentId);
    const pointsTableDoc = await getDoc(pointsTableRef);

    let teams = [];
    if (pointsTableDoc.exists()) {
      teams = pointsTableDoc.data().teams || [];
    } else {
      // Initialize if document doesn't exist
      await setDoc(pointsTableRef, { tournamentId, teams: [] });
    }

    // Helper to get/update team stats
    const getTeamIndex = (teamName) => teams.findIndex(t => t.teamName === teamName);
    const updateTeamStats = (teamName, isWin, isLoss, isDraw, runsScored, oversFaced, runsConceded, oversBowled) => {
      const index = getTeamIndex(teamName);
      if (index === -1) {
        // Add new team if not present
        teams.push({
          teamName,
          matches: 1,
          wins: isWin ? 1 : 0,
          losses: isLoss ? 1 : 0,
          draws: isDraw ? 1 : 0,
          points: isWin ? 2 : (isDraw ? 1 : 0),
          runsScored,
          oversFaced,
          runsConceded,
          oversBowled,
          nrr: ((runsScored / oversFaced) - (runsConceded / oversBowled)).toFixed(3) || 0,
        });
      } else {
        // Update existing team
        const updatedTeam = { ...teams[index] };
        updatedTeam.matches += 1;
        if (isWin) updatedTeam.wins += 1;
        if (isLoss) updatedTeam.losses += 1;
        if (isDraw) updatedTeam.draws += 1;
        updatedTeam.points += isWin ? 2 : (isDraw ? 1 : 0);
        updatedTeam.runsScored += runsScored;
        updatedTeam.oversFaced += oversFaced;
        updatedTeam.runsConceded += runsConceded;
        updatedTeam.oversBowled += oversBowled;
        updatedTeam.nrr = ((updatedTeam.runsScored / updatedTeam.oversFaced) - (updatedTeam.runsConceded / updatedTeam.oversBowled)).toFixed(3) || 0;
        teams[index] = updatedTeam;
      }
    };

    // Determine stats for each team
    const battingFirstTeam = firstInnings.teamName; // Assuming firstInnings is batting first
    const battingSecondTeam = secondInnings ? secondInnings.teamName : teamB.name; // Fallback if no second innings

    // Runs and overs (handle all-out by using actual overs; otherwise maxOvers)
    const teamARuns = (battingFirstTeam === teamA.name) ? firstInnings.totalScore : (secondInnings ? secondInnings.totalScore : 0);
    const teamAOversFaced = (battingFirstTeam === teamA.name) ? (firstInnings.wickets === 10 ? firstInnings.overs : maxOvers) : (secondInnings ? (secondInnings.wickets === 10 ? secondInnings.overs : maxOvers) : 0);
    const teamBRuns = (battingFirstTeam === teamB.name) ? firstInnings.totalScore : (secondInnings ? secondInnings.totalScore : 0);
    const teamBOversFaced = (battingFirstTeam === teamB.name) ? (firstInnings.wickets === 10 ? firstInnings.overs : maxOvers) : (secondInnings ? (secondInnings.wickets === 10 ? secondInnings.overs : maxOvers) : 0);

    // Conceded = opponent's scored; bowled = opponent's faced
    updateTeamStats(teamA.name,
      winnerTeamName === teamA.name,
      winnerTeamName === teamB.name,
      isTie,
      teamARuns, teamAOversFaced, teamBRuns, teamBOversFaced
    );
    updateTeamStats(teamB.name,
      winnerTeamName === teamB.name,
      winnerTeamName === teamA.name,
      isTie,
      teamBRuns, teamBOversFaced, teamARuns, teamAOversFaced
    );

    // Update Firestore
    await updateDoc(pointsTableRef, { teams });
    console.log('PointsTable updated for tournamentId:', tournamentId);
  } catch (error) {
    console.error('Error updating PointsTable:', error);
  }
}

async function updateMatchWinnerInSchedule(tournamentId, matchId, winnerTeamName) {
  const docRef = doc(db, "roundrobin", tournamentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const data = docSnap.data();
  const matchSchedule = data.matchSchedule || [];
  // Find match index
  const idx = matchSchedule.findIndex(
    (ms) => ms.matchId === matchId
  );
  if (idx === -1) return;

  // Update winner
  matchSchedule[idx].winner = winnerTeamName;

  await updateDoc(docRef, {
    matchSchedule,
  });
}

  const handleModalOkClick = () => {
    setShowModal(false);
    if (gameFinished && modalContent.title === 'Match Result') {
      let winnerTeamName = '';
      let isTie = false;
      let winningDifference = '';
      
      if (playerScore < targetScore - 1) {
        winnerTeamName = teamA.name;
        winningDifference = `${targetScore - 1 - playerScore} runs`;
      } else if (playerScore === targetScore - 1) {
        winnerTeamName = 'Tie';
        isTie = true;
        winningDifference = 'Tie';
      } else {
        winnerTeamName = teamB.name;
        winningDifference = `${10 - outCount} wickets`;
      }
      updateWinnerInFirebase(winnerTeamName);
      updateMatchWinnerInSchedule(
        tournamentId,     // document id
        matchId,          // e.g. "group_1_1"
        winnerTeamName    // e.g. "NS1"
      );

      
      // New call to update PointsTable
      updatePointsTable(tournamentId, teamA, teamB, winnerTeamName, isTie, firstInningsData, isChasing ? { teamName: currentBattingTeam.name, totalScore: playerScore, wickets: outCount, overs: overNumber - 1 + (validBalls / 6) } : null, maxOvers);

      if (originPage) {
        navigate(originPage, { 
          state: { 
            activeTab: 'Match Results', 
            winner: winnerTeamName,
            winningDifference: winningDifference,
            tournamentId: tournamentId,
            tournamentName: tournamentName,
            information: information,
            teamA: {
              name: teamA.name,
              flagUrl: teamA.flagUrl,
              score: isChasing ? targetScore - 1 : playerScore,
              wickets: isChasing ? playedWickets : outCount,
              balls: isChasing ? playedOvers : (overNumber - 1) * 6 + validBalls
            },
            teamB: {
              name: teamB.name,
              flagUrl: teamB.flagUrl,
              score: isChasing ? playerScore : targetScore - 1,
              wickets: isChasing ? outCount : 0,
              balls: isChasing ? (overNumber - 1) * 6 + validBalls : 0
            }
          }
        });
      } else {
        navigate('/');
      }
    } else if (modalContent.title === 'Innings Break') {
      resetInnings();
      setIsChasing(true);
      setBowlerVisible(false);
      setCurrentView('toss');
      setShowThirdButtonOnly(false);
      setViewHistory(['toss']);
    }
  };

  if (!currentView && !showThirdButtonOnly) {
    return (
      <div className="text-white text-center p-4">
        <h1>Loading...</h1>
      </div>
    );
  }
  if (!teamA || !teamB) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-xl">Loading team data...</p>
      </div>
    );
  }
  return (
    <ErrorBoundary>
      <section
        className="w-full flex flex-col items-center"
        style={{
          backgroundImage: 'linear-gradient(140deg,#080006 15%,#FF0077)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        {HeaderComponent ? <HeaderComponent /> : <div className="text-white">Header Missing</div>}
        {showAnimation && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="w-full h-full flex items-center justify-center">
              {animationType === 'six' && (
                <Player
                  autoplay
                  loop={true}
                  src={sixAnimation}
                  style={{ width: '500px', height: '500px' }}
                />
              )}
              {animationType === 'four' && (
                <Player
                  autoplay
                  loop={true}
                  src={fourAnimation}
                  style={{ width: '500px', height: '500px' }}
                />
              )}
              {animationType === 'out' && (
                <Player
                  autoplay
                  loop={true}
                  src={outAnimation}
                  style={{ width: '500px', height: '500px' }}
                />
              )}
            </div>
          </div>
        )}
        <button
          onClick={goBack}
          className="absolute left-4 top-24 md:left-10 md:top-32 z-10 w-10 h-10 flex items-center justify-center"
        >
          <img
            alt="Back"
            className="w-6 h-6 transform rotate-180 mb-5"
            src={backButton}
            onError={(e) => (e.target.src = '')}
          />
        </button>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#4C0025] p-6 rounded-lg max-w-md w-full">
              {modalContent.title === 'Match Result' && (
                <canvas id="fireworks-canvas" className="absolute inset-0 w-full h-full z-0"></canvas>
              )}
              {modalContent.title === 'Match Result' && (
                <DotLottieReact
                  src="https://lottie.host/42c7d544-9ec0-4aaf-895f-3471daa49e49/a5beFhswU6.lottie"
                  style={{
                    position: 'absolute',
                    left: '0%',
                    top: '0%',
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}loop
                  autoplay
                />
              )}
              <h3 className="text-white text-xl font-bold mb-4 relative z-10">{modalContent.title}</h3>
              <p className="text-white mb-6 relative z-10">{modalContent.message}</p>
              <div className="flex justify-center relative z-10">
                <button
                  onClick={handleModalOkClick}
                  className="w-40 h-12 bg-[#FF62A1] text-white font-bold text-lg rounded-lg border-2 border-white"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        {showDismissalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#4C0025] p-4 md:p-6 rounded-lg max-w-md w-full mx-4 relative">
              <button
                onClick={() => {
                  setShowDismissalModal(false);
                  setSelectedDismissalType('');
                  setSelectedCatchType('');
                  setSelectedInvolvedPlayer(null);
                  setOutRuns(null);
                  setPendingOut(false);
                }}
                className="absolute top-2 right-2 w-6 h-6 text-white font-bold flex items-center justify-center text-xl"
              >
                ×
              </button>
              <h3 className="text-white text-lg md:text-xl font-bold mb-4">Select Dismissal Details</h3>
              <div className="mb-4">
                <label className="text-white block mb-2">Dismissal Type</label>
                <select
                  value={selectedDismissalType}
                  onChange={(e) => setSelectedDismissalType(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                >
                  <option value="">Select Dismissal Type</option>
                  {dismissalTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              {selectedDismissalType === 'Run Out' && (
                <div className="mb-4">
                  <label className="text-white block mb-2">Which batsman is out?</label>
                  <select
                    value={outBatsmanType}
                    onChange={(e) => setOutBatsmanType(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  >
                    <option value="">Select Batsman</option>
                    <option value="striker">{striker?.name} (Striker)</option>
                    <option value="non-striker">{nonStriker?.name} (Non-Striker)</option>
                  </select>
                </div>
              )}
              {['Caught', 'Caught Behind'].includes(selectedDismissalType) && (
                <div className="mb-4">
                  <label className="text-white block mb-2">Catch Type</label>
                  <select
                    value={selectedCatchType}
                    onChange={(e) => setSelectedCatchType(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  >
                    <option value="">Select Catch Type</option>
                    {catchTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}
              {selectedDismissalType && !['Bowled', 'LBW', 'Caught & Bowled'].includes(selectedDismissalType) && (
                <div className="mb-4">
                  <label className="text-white block mb-2">
                    {selectedDismissalType === 'Stumped' ? 'Wicketkeeper' : 
                     selectedDismissalType === 'Run Out' ? 'Fielder' : 
                     'Fielder'}
                  </label>
                  <select
                    value={selectedInvolvedPlayer?.index || ''}
                    onChange={(e) => {
                      const player = bowlingTeamPlayers.find(p => p.index === e.target.value);
                      setSelectedInvolvedPlayer(player);
                    }}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  >
                    <option value="">Select Player</option>
                    {bowlingTeamPlayers
                      .filter(player => {
                        if (selectedDismissalType === 'Stumped') return true; // Show all for Stumped
                        if (selectedDismissalType === 'Caught Behind') return player.role.toLowerCase().includes('keeper');
                        return true;
                      })
                      .map(player => (
                        <option key={player.index} value={player.index}>{player.name}</option>
                      ))}
                  </select>
                </div>
              )}
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleDismissalModalSubmit}
                  disabled={!selectedDismissalType || 
                    (selectedDismissalType === 'Run Out' && !outBatsmanType) ||
                    (['Caught', 'Caught Behind'].includes(selectedDismissalType) && (!selectedCatchType || !selectedInvolvedPlayer)) ||
                    (['Run Out', 'Stumped', 'Caught Behind'].includes(selectedDismissalType) && !selectedInvolvedPlayer)}
                  className={`w-40 h-12 text-white font-bold text-lg rounded-lg border-2 border-white ${
                    selectedDismissalType && 
                    (selectedDismissalType !== 'Run Out' || outBatsmanType) &&
                    (!['Caught', 'Caught Behind'].includes(selectedDismissalType) || (selectedCatchType && selectedInvolvedPlayer)) &&
                    (!['Run Out', 'Stumped', 'Caught Behind'].includes(selectedDismissalType) || selectedInvolvedPlayer)
                      ? 'bg-[#FF62A1] hover:bg-[#FF62A1]/80' : 'bg-gray-500 cursor-not-allowed'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
        {showLegByModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#4C0025] p-4 md:p-6 rounded-lg max-w-md w-full mx-4 relative">
              <button
                onClick={() => setShowLegByModal(false)}
                className="absolute top-2 right-2 w-6 h-6 text-white font-bold flex items-center justify-center text-xl"
              >
                ×
              </button>
              <h3 className="text-white text-lg md:text-xl font-bold mb-4">Select Leg By Details</h3>
              <div className="mb-4">
                <label className="text-white block mb-2">Leg By off which batsman?</label>
                <select
                  value={legByBatsmanType}
                  onChange={(e) => setLegByBatsmanType(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                >
                  <option value="">Select Batsman</option>
                  <option value="striker">{striker?.name} (Striker)</option>
                  <option value="non-striker">{nonStriker?.name} (Non-Striker)</option>
                </select>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleLegByModalSubmit}
                  disabled={!legByBatsmanType}
                  className={`w-40 h-12 text-white font-bold text-lg rounded-lg border-2 border-white ${
                    legByBatsmanType ? 'bg-[#FF62A1] hover:bg-[#FF62A1]/80' : 'bg-gray-500 cursor-not-allowed'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
        {showRetiredHurtModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#4C0025] p-4 md:p-6 rounded-lg max-w-md w-full mx-4 relative">
              <button
                onClick={() => setShowRetiredHurtModal(false)}
                className="absolute top-2 right-2 w-6 h-6 text-white font-bold flex items-center justify-center text-xl"
              >
                ×
              </button>
              <h3 className="text-white text-lg md:text-xl font-bold mb-4">Select Retired Hurt Details</h3>
              <div className="mb-4">
                <label className="text-white block mb-2">Which batsman is retired hurt?</label>
                <select
                  value={retiredHurtBatsmanType}
                  onChange={(e) => setRetiredHurtBatsmanType(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                >
                  <option value="">Select Batsman</option>
                  <option value="striker">{striker?.name} (Striker)</option>
                  <option value="non-striker">{nonStriker?.name} (Non-Striker)</option>
                </select>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleRetiredHurtModalSubmit}
                  disabled={!retiredHurtBatsmanType}
                  className={`w-40 h-12 text-white font-bold text-lg rounded-lg border-2 border-white ${
                    retiredHurtBatsmanType ? 'bg-[#FF62A1] hover:bg-[#FF62A1]/80' : 'bg-gray-500 cursor-not-allowed'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
        {currentView === 'toss' && (
          <>
            <div id="toss" className="text-center mb-4">
              <h2 className="text-white font-bold text-3xl md:text-[3rem] mt-20 md:mt-6">
                {bowlerVisible ? currentBowlingTeam?.name : currentBattingTeam?.name}
              </h2>
              <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#F0167C] to-white text-center">
                {bowlerVisible ? 'Choose the bowler' : 'Select Batsmen'}
              </h2>
            </div>
            <div className="flex gap-4">
              {!bowlerVisible && (
                <>
                  <div>
                    <button className="w-28 h-12 text-white text-lg md:w-25 md:h-10 font-bold bg-gradient-to-l from-[#12BFA5] to-[#000000] rounded-[1rem] shadow-lg">
                      Striker
                    </button>
                    {striker && (
                      <div className="relative text-white text-center mt-2 relative">
                        <div className="inline-block">
                          {striker.photoUrl ? (
                            <img
                              src={striker.photoUrl} 
                              alt="Striker"
                              className="w-20 h-20 md:w-10 md:h-10 lg:w-10 lg:h-10 rounded-full mx-auto object-cover aspect-square"
                              onError={(e) => (e.target.src = '')}
                            />
                          ) : (
                            <div className="w-20 h-20 md:w-10 md:h-10 lg:w-10 lg:h-10 rounded-full mx-auto flex items-center justify-center bg-gray-500 text-white text-2xl font-bold">
                              {striker.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <button
                            onClick={cancelStriker}
                            className="absolute -top-2 right-4 w-6 h-6 text-white font-bold flex items-center justify-center text-xl"
                          >
                            ×
                          </button>
                        </div>
                        <div>{striker.name}</div>
                        <div className="text-sm">{striker.role}</div>
                      </div>
                    )}
                  </div>
                  <div>
                    <button className="w-28 h-12 text-white text-lg md:w-nbsp:h-10 md:h-10 font-bold bg-gradient-to-l from-[#12BFA5] to-[#000000] rounded-[1rem] shadow-lg">
                      Non-Striker
                    </button>
                    {nonStriker && (
                      <div className="relative text-white text-center mt-2 relative">
                        <div className=" inline-block">
                          {nonStriker.photoUrl ? (
                            <img
                              src={nonStriker.photoUrl} 
                              alt="Non-striker"
                              className="w-20 h-20 md:w-15 md:h-15 lg:w-10 lg:h-10 w-full"
                              onError={(e) => (e.target.src = '')}
                            />
                          ) : (
                            <div className="w-20 h-20 md:w-15 md:h-15 lg:w-10 lg:h-10 rounded-full flex items-center justify-center bg-gray-500 text-white text-2xl font-bold">
                              {nonStriker.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <button
                            onClick={cancelNonStriker}
                            className="absolute -top-0 right-0 w-6 h-6 text-white font-bold flex items-center justify-center text-xl"
                          >
                            ×
                          </button>
                          </div>
                        <div>{nonStriker.name}</div>
                        <div className="text-sm">{nonStriker.role}</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            {!bowlerVisible && (striker === null || nonStriker === null) && (
              <div id="batsman-selection" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {getAvailableBatsmen().map((player) => (
                  <div
                    key={player.index}
                    onClick={() => handlePlayerSelect(player)}
                    className={`cursor-pointer flex flex-col items-center text-white text-center ${selectedBatsmenIndices.includes(player.index) ? 'opacity-50' : ''}`}
                  >
                    <div className="w-20 h-20 rounded-full border-[5px] border-[#F0167C] overflow-hidden flex items-center justify-center">
                      {player.photoUrl ? (
                        <img
                          src={player.photoUrl}
                          alt="Player"
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.src = '')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-500 text-white text-2xl font-bold">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="mt-2 font-bold text-lg">{player.name}</span>
                    <h2 className="text-sm font-light">{player.role}</h2>
                  </div>
                ))}
              </div>
            )}
            {striker && nonStriker && !bowlerVisible && (
              <button
                id="choosebowler"
                onClick={() => {
                  setBowlerVisible(true);
                  setViewHistory(prev => [...prev, 'bowler-selection']);
                }}
                className="w-30 rounded-3xl h-10 mt-4 bg-black text-white text-sm font-bold shadow-lg bg-[url('../assets/kumar/button.png')] transform transition duration-200 hover:scale-105 hover:shadow-xl active:scale-95 active:shadow-md"
                style={{
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                Choose Bowler
              </button>
            )}
            {selectedBowler && (
              <div className="relative inline-block text-center text-white">
                {selectedBowler.photoUrl ? (
                  <img
                    src={selectedBowler.photoUrl} 
                    alt="Bowler"
                    className="w-20 h-20 md:w-15 md:h-15 lg:w-15 lg:h-15 rounded-full mx-auto object-cover aspect-square"
                    onError={(e) => (e.target.src = '')}
                  />
                ) : (
                  <div className="w-20 h-20 md:w-15 md:h-15 lg:w-15 lg:h-15 rounded-full mx-auto flex items-center justify-center bg-gray-500 text-white text-2xl font-bold">
                    {selectedBowler.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>{selectedBowler.name}</div>
                <div className="text-sm">{selectedBowler.role}</div>
              </div>
            )}
            {bowlerVisible && (
              <>
                <div id="bowler-selection" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {bowlingTeamPlayers.map((player) => (
                    <div
                      key={player.index}
                      onClick={() => handleBowlerSelect(player)}
                      className={`cursor-pointer flex flex-col items-center text-white text-center ${selectedBowler?.index === player.index ? 'opacity-50' : ''}`}
                    >
                      <div className="w-20 h-20 rounded-full border-[5px] border-[#12BFA5] overflow-hidden flex items-center justify-center">
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl}
                            alt="Player"
                            className="w-full h-full object-cover"
                            onError={(e) => (e.target.src = '')}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-500 text-white text-2xl font-bold">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="mt-2 font-bold text-lg">{player.name}</span>
                      <h2 className="text-sm font-light">{player.role}</h2>
                    </div>
                  ))}
                </div>
                {selectedBowler && (
                  <button
                    onClick={() => handleButtonClick('start')}
                    className="w-30 h-10 mt-4 text-white font-bold rounded-3xl bg-black bg-[url('../assets/kumar/button.png')] bg-cover bg-center shadow-lg transform transition duration-200 hover:scale-105 hover:shadow-xl active:scale-95 active:shadow-md"
                  >
                    Let's Play
                  </button>
                )}
              </>
            )}
          </>
        )}
      {showThirdButtonOnly && (
  <div id="start" className="relative flex flex-col w-full h-full items-center px-4 mt-20 md:mt-10">
    <h2 className="gap-5 text-white font-bold text-center text-4xl md:text-3xl lg:text-5xl">
      Score Board
    </h2>
    <div className="mt-4 flex w-full md:flex-row w-full md:w-1/2 justify-around gap-20 h-fit pt-2">
      <div className="flex items-center justify-center mb-4 md:mb-0">
        {currentBattingTeam?.flagUrl ? (
          <img
            src={currentBattingTeam?.flagUrl}
            className="w-16 h-16 md:w-30 md:h-30 aspect-square"
            alt="Batting Team Flag"
            onError={(e) => (e.target.src = '')}
          />
        ) : (
          <div className="w-16 h-16 md:w-30 md:h-30 aspect-square rounded-full flex items-center justify-center bg-gray-500 text-white text-2xl font-bold">
            {currentBattingTeam?.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="ml-4 md:ml-10">
          <h3 className="text-white font-bold text-center text-sm md:text-2xl sm:text-3xl lg:text-4xl">
            {playerScore} - {outCount}
            <h2 className="text-base md:text-lg lg:text-xl sm:text-sm">{overNumber > maxOvers ? maxOvers : overNumber - 1}.{validBalls}</h2>
          </h3>
        </div>
      </div>
      <div className="flex items-center justify-center mb-4 md:mb-0">
        <div className="mr-4 md:mr-10">
          <h3 className="text-white font-bold text-center text-lg md:text-2xl sm:text-3xl lg:text-4xl text-center text-yellow-300 underline">
            {isChasing ? `Target: ${targetScore}` : 'Not yet'}
          </h3>
        </div>
        {currentBowlingTeam?.flagUrl ? (
          <img
            src={currentBowlingTeam?.flagUrl}
            className="w-16 h-16 md:w-30 md:h-30 aspect-square"
            alt="Bowling Team Flag"
            onError={(e) => (e.target.src = '')}
          />
        ) : (
          <div className="w-16 h-16 md:w-30 md:h-30 aspect-square rounded-full flex items-center justify-center bg-gray-500 text-white text-2xl font-bold">
            {currentBowlingTeam?.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
    <div className="w-full flex flex-col md:flex-row md:w-[50%] justify-around items-center justify-between mt-12">
      <div className="flex flex-row px-[4.8%] md:p-0 flex-row md:flex-row items-center justify-between gap-4 md:gap-8 mb-4 md:mb-0">
        <div className="text-center text-white">
          <h3 className={`text-lg md:text-xl font-bold ${striker ? 'text-yellow-300' : ''}`}>Striker</h3>
          {striker && (
            <div className="flex flex-col items-center justify-center w-full">
              <div className="font-bold text-sm md:text-base sm">{striker.name}</div>
              <div className="text-xs md:text-sm">{striker.role}</div>
              <div className="text-xs md:text-sm">
                {batsmenScores[striker.index] || 0} ({batsmenBalls[striker.index] || 0})
                <span className="text-yellow-300"> SR: {getStrikeRate(striker.index)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="hidden sm:block text-white text-center">
          <h3 className={`text-lg md:text-xl font-bold ${!striker ? 'text-yellow-300' : ''}`}>Non-Striker</h3>
          {nonStriker && (
            <div className="flex flex-col items-center w-full">
              <div className="font-bold text-sm md:text-base">{nonStriker.name}</div>
              <div className="text-xs md:text-sm">{nonStriker.role}</div>
              <div className="text-xs md:text-sm">
                {batsmenScores[nonStriker.index] || 0} ({batsmenBalls[nonStriker.index] || 0})
                <span className="text-yellow-300"> SR: {getStrikeRate(nonStriker.index)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="sm:hidden text-white text-center">
          <h3 className="text-lg md:text-xl font-bold">Bowler</h3>
          {selectedBowler && (
            <div className="flex flex-col items-center">
              <div className="font-bold text-sm md:text-base">{selectedBowler.name}</div>
              <div className="text-xs md:text-sm">{selectedBowler.role}</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile layout for buttons */}
      {/* Mobile layout for buttons */}

      {/* Desktop layout for buttons with overs history below */}
      <div className="hidden sm:flex flex-col items-end absolute right-0 md:right-4 lg:right-8 xl:right-12 2xl:right-20 top-0 md:top-4">
        <div className="flex gap-2">
          <button onClick={() => setShowPastOvers(showPastOvers => !showPastOvers)}
            className="w-32 h-10 md:h-12 bg-[#4C0025] text-white font-bold text-sm md:text-lg rounded-lg border-2 border-white"
          >
            {showPastOvers ? 'Hide Overs' : 'Show Overs'}
          </button>
          <button
            onClick={handleUndoBall}
            disabled={currentOverBalls.length === 0 && pastOvers.length === 0}
            className="w-32 h-10 md:h-12 bg-[#4C0025] text-white font-bold text-sm md:text-lg rounded-lg border-2 border-white disabled:bg-gray-500"
          >
            Undo Ball
          </button>
        </div>
        
        {/* Overs history positioned directly below the buttons */}
        {showPastOvers && (
          <div className="mt-2 text-white w-full">
            <div className="bg-[#4C0025] p-3 rounded-lg" style={{ maxHeight: '150px', overflowY: 'auto' }}>
              <h3 className="text-lg md:text-xl font-bold mb-2 text-center">Overs History</h3>
              <div className="flex flex-col gap-3">
                {[...pastOvers, currentOverBalls.length > 0 ? currentOverBalls : null]
                  .filter(Boolean)
                  .map((over, index) => (
                    <div key={`over-${index}`} className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">Over {index + 1}:</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {over.map((ball, ballIndex) => {
                          let displayBall = ball;
                          if (typeof ball === 'string' && ball.includes('+')) {
                            const [type, rest] = ball.split('+');
                            if (type.toLowerCase() === 'wd') displayBall = `Wd+${rest}`;
                            else if (type.toLowerCase() === 'nb') displayBall = `Nb+${rest}`;
                            else if (type.toLowerCase() === 'w') displayBall = `W+${rest}`;
                            else if (type.toLowerCase() === 'o') displayBall = `O+${rest}`;
                            else displayBall = `${type}+${rest}`;
                          }
                          const isWicket = typeof ball === 'string' && (ball.includes('W') || ball.includes('O'));
                          return (
                            <span
                              key={`ball-${index}-${ballIndex}`}
                              className={`w-6 h-6 flex items-center justify-center rounded-full px-1 text-xs md:text-sm whitespace-nowrap ${
                                isWicket ? 'bg-red-600' : 'bg-[#FF62A1]'
                              }`}
                            >
                              {displayBall}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="hidden sm:block w-20 text-white text-center">
        <h3 className="text-lg md:text-xl font-bold">Bowler</h3>
        {selectedBowler && (
          <div className="flex flex-col items-center">
            <div className="font-bold text-sm md:text-base">{selectedBowler.name}</div>
            <div className="text-xs md:text-sm">{selectedBowler.role}</div>
          </div>
        )}
      </div>
    </div>

    {/* Desktop layout for wide buttons */}
    <div className="hidden sm:flex flex-wrap justify-center gap-2 md:gap-4 mt-2">
  {['Wide', 'No-ball', 'OUT', 'Leg By', 'Retired Hurt'].map((label) => {
    const isActive = activeLabel === label;
    return (
      <button
        key={label}
        onClick={() => handleScoreButtonClick(label, true)}
        className={`min-w-[80px] md:min-w-[100px] h-10 md:h-12
          ${isActive ? 'bg-red-600' : 'bg-[#4C0025] hover:bg-gray-300'}
          text-white font-bold text-sm md:text-lg sm:text-sm font-semibold rounded-lg border-2 border-white items-center justify-center cursor-pointer transition-opacity hover:opacity-80 px-3`}
      >
        {label}
      </button>
    );
  })}
</div>


       <div className="mt-4 flex flex-wrap justify-center gap-2 md:gap-4">
      {[0, 1, 2, 3, 4, 6].map((num) => {
        const isActive = activeNumber === num;
        const isDisabled = pendingOut && num !== 0 && num !== 1 && num !== 2;
        return (
          <button
            key={num}
            onClick={() => handleScoreButtonClick(num)}
            className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
              ${isActive ? 'bg-green-500' : isDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#4C0025] hover:bg-green-300'}
              text-white font-bold text-lg md:text-xl rounded-full border-2 border-white
              flex items-center justify-center transition-colors duration-300`}
            disabled={isDisabled}
          >
            {num}
          </button>
        )
      })}
    </div>

    {/* Mobile layout for buttons - MOVED BELOW SCORING BUTTONS */}
    <div className="flex flex-col sm:hidden justify-center gap-2 mt-4 w-full">
      <div className="flex justify-center gap-2">
        {['Wide', 'No-ball', 'OUT', 'Leg By', 'Retired Hurt'].map((label) => {
          const isActive = activeLabel === label;
          return (
            <button
              key={label}
              onClick={() => handleScoreButtonClick(label, true)}
              className={`w-20 h-10
                ${isActive ? 'bg-red-600' : 'bg-[#4C0025] hover:bg-gray-300'}
                text-white font-bold text-sm font-semibold rounded-lg border-2 border-white items-center justify-center cursor-pointer transition-opacity hover:opacity-80`}
            >
              {label}
            </button>
          )
        })}
      </div>
      
      {/* Show Overs and Undo Ball buttons - MOVED HERE */}
      <div className="flex justify-center gap-2 mt-2">
        <button onClick={() => setShowPastOvers(showPastOvers => !showPastOvers)}
          className="w-32 h-10 bg-[#4C0025] text-white font-bold text-sm rounded-lg border-2 border-white"
        >
          {showPastOvers ? 'Hide Overs' : 'Show Overs'}
        </button>
        <button
          onClick={handleUndoBall}
          disabled={currentOverBalls.length === 0 && pastOvers.length === 0}
          className="w-32 h-10 bg-[#4C0025] text-white font-bold text-sm rounded-lg border-2 border-white disabled:bg-gray-500"
        >
          Undo Ball
        </button>
      </div>
      
      {/* Mobile overs history */}
      {showPastOvers && (
        <div className="mt-2 text-white w-full">
          <div className="bg-[#4C0025] p-3 rounded-lg" style={{ maxHeight: '150px', overflowY: 'auto' }}>
            <h3 className="text-lg font-bold mb-2 text-center">Overs History</h3>
            <div className="flex flex-col gap-3">
              {[...pastOvers, currentOverBalls.length > 0 ? currentOverBalls : null]
                .filter(Boolean)
                .map((over, index) => (
                  <div key={`over-${index}`} className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">Over {index + 1}:</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {over.map((ball, ballIndex) => {
                        let displayBall = ball;
                        if (typeof ball === 'string' && ball.includes('+')) {
                          const [type, rest] = ball.split('+');
                          if (type.toLowerCase() === 'wd') displayBall = `Wd+${rest}`;
                          else if (type.toLowerCase() === 'nb') displayBall = `Nb+${rest}`;
                          else if (type.toLowerCase() === 'w') displayBall = `W+${rest}`;
                          else if (type.toLowerCase() === 'o') displayBall = `O+${rest}`;
                          else displayBall = `${type}+${rest}`;
                        }
                        const isWicket = typeof ball === 'string' && (ball.includes('W') || ball.includes('O'));
                        return (
                          <span
                            key={`ball-${index}-${ballIndex}`}
                            className={`w-6 h-6 flex items-center justify-center rounded-full px-1 text-xs whitespace-nowrap ${
                              isWicket ? 'bg-red-600' : 'bg-[#FF62A1]'
                            }`}
                          >
                            {displayBall}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
    {/* <div className="mt-6 w-full md:w-[50%] bg-[#4C0025] p-4 md:p-6 rounded-lg shadow-lg">
              <h3 className="text-white text-lg md:text-xl font-bold mb-4 text-center">Pitch Analysis</h3>
              
            </div> */}
                <div>
                {isAICompanionOpen && (
                  <AIMatchCompanionModal
                    isOpen={isAICompanionOpen}
                    predictionData={predictionData}
                    tournamentId={tournamentId}
                    maxOvers={maxOvers}
                    battingBalls={(overNumber - 1) * 6 + validBalls}
                  />
                )}
              </div>
              {showRunInfo && (
              <p className="text-yellow-400 text-sm mt-2 text-center font-medium">
                {pendingOut ? 'Please select 0, 1, or 2 for runs on out' : 'Please select run, if not select 0'}
              </p>
            )}
            {showBatsmanDropdown && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#4C0025] p-4 md:p-6 rounded-lg max-w-md w-full mx-4 relative">
                  <button
                    onClick={cancelBatsmanDropdown}
                    className="absolute top-2 right-2 w-6 h-6 text-white font-bold flex items-center justify-center text-xl"
                  >
                    ×
                  </button>
                  <h3 className="text-white text-lg md:text-xl font-bold mb-4">Select Next Batsman</h3>
                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    {getAvailableBatsmen().map((player) => (
                      <div
                        key={player.index}
                        onClick={() => handleBatsmanSelect(player)}
                        className="cursor-pointer flex flex-col items-center text-white text-center p-2 hover:bg-[#FF62A1] rounded-lg"
                      >
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl}
                            alt="Player"
                            className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover aspect-square"
                            onError={(e) => (e.target.src = '')}
                          />
                        ) : (
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-gray-500 text-white text-xl font-bold">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs md:text-sm">{player.name}</span>
                        <span className="text-xs">{player.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {showBowlerDropdown && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#4C0025] p-4 md:p-6 rounded-lg max-w-md w-full mx-4 relative">
                  <button
                    className="absolute top-2 right-2 w-6 h-6 text-white font-bold flex items-center justify-center text-xl"
                    onClick={() => setShowBowlerDropdown(false)}
                  >
                    ×
                  </button>
                  <h3 className="text-white text-lg md:text-xl font-bold mb-4">Select Next Bowler</h3>
                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    {bowlingTeamPlayers.filter(player => player.index !== selectedBowler?.index).map((player) => (
                      <div
                        key={player.index}
                        onClick={() => handleBowlerSelect(player)}
                        className="cursor-pointer flex flex-col items-center text-white text-center p-2 hover:bg-[#FF62A1] rounded-lg"
                      >
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl}
                            alt="Player"
                            className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover aspect-square"
                            onError={(e) => (e.target.src = '')}
                          />
                        ) : (
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-gray-500 text-white text-xl font-bold">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs md:text-sm">{player.name}</span>
                        <span className="text-xs">{player.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {currentView === 'startInnings' && !showThirdButtonOnly && (
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-6">Innings Break</h2>
            <div className="text-2xl mb-8">
              <p className="text-center">First Innings Score: {playerScore}/{outCount}</p>
              <p className="text-center">Overs: {overNumber - 1}</p>
            </div>
            <button
              className="w-40 h-14 text-white text-lg font-bold bg-[url('../assets/kumar/button.png')] bg-cover bg-center shadow-lg"
              onClick={() => {
                setIsChasing(true);
                setTargetScore(playerScore + 1);
                setPlayedOvers(overNumber);
                setPlayedWickets(outCount);
                resetInnings();
                handleButtonClick('toss');
                saveMatchData();
              }}
            >
              Start Chase
            </button>
            
          </div>
        )}

        {showMainWheel && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center overflow-y-auto">
            <div className="my-2 bg-white rounded-xl w-[95%] max-w-4xl mx-auto flex flex-col items-center shadow-lg h-[95vh]">
              {/* MainWheel */}
              <MainWheel
                run={selectedRun}
                player={striker}
                setShowMainWheel={setShowMainWheel}
                tournamentId={tournamentId}
                currentOver={overNumber}  // Pass current over
                wickets={outCount}        // Pass wickets
                totalRuns={playerScore}   // Pass total runs
              />

              {/* Continue Button */}
              <button
                onClick={() => setShowMainWheel(false)}
                className="mt-5 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                Continue
              </button>
            </div>
          </div>
          )}


      </section>
    </ErrorBoundary>
  );
}

export default StartMatchPlayersRoundRobin;