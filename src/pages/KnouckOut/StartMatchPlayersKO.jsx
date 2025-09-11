import React, { useState, useEffect, Component } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../../firebase';
import HeaderComponent from '../../components/kumar/startMatchHeader';
import backButton from '../../assets/kumar/right-chevron.png';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Player } from '@lottiefiles/react-lottie-player';
import sixAnimation from '../../assets/Animation/six.json';
import fourAnimation from '../../assets/Animation/four.json';
import outAnimation from '../../assets/Animation/out.json';
import MainWheel from "../../components/yogesh/wagonwheel/mainwheel"
import AIMatchCompanionModal from '../../components/yogesh/LandingPage/AIMatchCompanion';

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

// Helper to update PlayerDetails for batting stats
async function updatePlayerBattingDetails(playerName, newStats) {
  try {
    const playerDetailsRef = collection(db, 'PlayerDetails');
    const q = query(playerDetailsRef, where('name', '==', playerName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // If no document found, create a new one with initial stats
      const newDocRef = doc(playerDetailsRef);
      const runs = newStats.runs || 0;
      const balls = newStats.balls || 0;
      const dismissals = newStats.isOut ? 1 : 0;
      await setDoc(newDocRef, {
        name: playerName,
        runs: runs,
        balls: balls,
        fours: newStats.fours || 0,
        sixes: newStats.sixes || 0,
        highestScore: runs, // Initial highest
        strikeRate: balls > 0 ? (runs / balls) * 100 : 0,
        average: dismissals > 0 ? runs / dismissals : 0,
        // Add other initial fields as needed
        innings: 1,
        notOuts: newStats.isOut ? 0 : 1,
        centuries: runs >= 100 ? 1 : 0,
        fifties: runs >= 50 ? 1 : 0,
        // Nested careerStats if needed
        careerStats: {
          batting: {
            runs: runs,
            balls: balls,
            fours: newStats.fours || 0,
            sixes: newStats.sixes || 0,
            highest: runs,
            strikeRate: balls > 0 ? (runs / balls) * 100 : 0,
            average: dismissals > 0 ? runs / dismissals : 0,
            centuries: runs >= 100 ? 1 : 0,
            fifties: runs >= 50 ? 1 : 0,
            dismissals: dismissals,
            // Other fields
          },
          // Other nested fields
        },
        updatedAt: Timestamp.fromDate(new Date()),
        // Add other required fields
      });
      console.log(`Created new PlayerDetails for ${playerName}`);
    } else {
      querySnapshot.forEach(async (docSnap) => {
        const docData = docSnap.data();
        const currentRuns = Number(docData.runs) || 0;
        const currentBalls = Number(docData.balls) || 0;
        const currentFours = Number(docData.fours) || 0;
        const currentSixes = Number(docData.sixes) || 0;
        const currentHighest = Number(docData.highestScore) || 0;
        const currentInnings = Number(docData.careerStats?.batting?.innings) || 0;
        const currentNotOuts = Number(docData.careerStats?.batting?.notOuts) || 0;
        const currentCenturies = Number(docData.centuries) || 0;
        const currentFifties = Number(docData.fifties) || 0;
        const currentDismissals = Number(docData.careerStats?.batting?.dismissals) || 0;

        const updatedRuns = currentRuns + (newStats.runs || 0);
        const updatedBalls = currentBalls + (newStats.balls || 0);
        const updatedFours = currentFours + (newStats.fours || 0);
        const updatedSixes = currentSixes + (newStats.sixes || 0);
        const updatedHighest = Math.max(currentHighest, updatedRuns);
        const updatedInnings = currentInnings + (newStats.balls > 0 ? 1 : 0); // Increment innings if balls faced
        const updatedNotOuts = newStats.isOut ? currentNotOuts : currentNotOuts + 1;
        const updatedCenturies = updatedRuns >= 100 ? currentCenturies + 1 : currentCenturies;
        const updatedFifties = updatedRuns >= 50 && updatedRuns < 100 ? currentFifties + 1 : currentFifties;
        const updatedDismissals = newStats.isOut ? currentDismissals + 1 : currentDismissals;

        const updatedStrikeRate = updatedBalls > 0 ? (updatedRuns / updatedBalls) * 100 : 0;
        const updatedAverage = updatedDismissals > 0 ? updatedRuns / updatedDismissals : 0;

        await updateDoc(docSnap.ref, {
          runs: updatedRuns,
          balls: updatedBalls,
          fours: updatedFours,
          sixes: updatedSixes,
          highestScore: updatedHighest,
          strikeRate: updatedStrikeRate,
          average: updatedAverage,
          centuries: updatedCenturies,
          fifties: updatedFifties,
          // Update nested careerStats
          'careerStats.batting.runs': updatedRuns,
          'careerStats.batting.balls': updatedBalls,
          'careerStats.batting.fours': updatedFours,
          'careerStats.batting.sixes': updatedSixes,
          'careerStats.batting.highest': updatedHighest,
          'careerStats.batting.strikeRate': updatedStrikeRate,
          'careerStats.batting.average': updatedAverage,
          'careerStats.batting.innings': updatedInnings,
          'careerStats.batting.notOuts': updatedNotOuts,
          'careerStats.batting.centuries': updatedCenturies,
          'careerStats.batting.fifties': updatedFifties,
          'careerStats.batting.dismissals': updatedDismissals,
          updatedAt: Timestamp.fromDate(new Date()),
        });
        console.log(`Updated PlayerDetails for ${playerName}`);
      });
    }
  } catch (error) {
    console.error('Error updating PlayerDetails:', error);
  }
}

// Helper to update PlayerDetails for bowling stats
async function updatePlayerBowlingDetails(playerName, newStats) {
  try {
    const playerDetailsRef = collection(db, 'PlayerDetails');
    const q = query(playerDetailsRef, where('name', '==', playerName));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      // If no document found, create a new one with initial bowling stats
      const newDocRef = doc(playerDetailsRef);
      const updatedWickets = newStats.wickets || 0;
      const updatedBalls = newStats.balls || 0;
      const updatedRunsConceded = newStats.runsConceded || 0;
      const updatedEconomy = updatedBalls > 0 ? (updatedRunsConceded / updatedBalls) * 6 : 0;
      const updatedAverage = updatedWickets > 0 ? updatedRunsConceded / updatedWickets : 0;
      const updatedBest = updatedWickets > 0 ? `${updatedWickets}/${updatedRunsConceded}` : "0";
      await setDoc(newDocRef, {
        name: playerName,
        // Bowling fields
        average: updatedAverage,
        bestBowling: updatedBest,
        economy: updatedEconomy,
        innings: updatedBalls > 0 ? 1 : 0,
        strikeRate: updatedWickets > 0 ? updatedBalls / updatedWickets : 0,
        wickets: updatedWickets,
        // Nested careerStats
        careerStats: {
          bowling: {
            average: updatedAverage,
            best: updatedBest,
            economy: updatedEconomy,
            innings: updatedBalls > 0 ? 1 : 0,
            strikeRate: updatedWickets > 0 ? updatedBalls / updatedWickets : 0,
            wickets: updatedWickets,
            runsConceded: updatedRunsConceded,
          },
          // Other nested fields
        },
        updatedAt: Timestamp.fromDate(new Date()),
        // Add other required fields
      });
      console.log(`Created new PlayerDetails for bowler ${playerName}`);
    } else {
      querySnapshot.forEach(async (docSnap) => {
        const docData = docSnap.data();
        const currentAverage = Number(docData.careerStats?.bowling?.average) || 0;
        const currentBest = docData.careerStats?.bowling?.best || "0";
        const currentEconomy = Number(docData.careerStats?.bowling?.economy) || 0;
        const currentInnings = Number(docData.careerStats?.bowling?.innings) || 0;
        const currentStrikeRate = Number(docData.careerStats?.bowling?.strikeRate) || 0;
        const currentWickets = Number(docData.careerStats?.bowling?.wickets) || 0;

        const updatedWickets = currentWickets + (newStats.wickets || 0);
        const updatedBalls = (Number(docData.careerStats?.bowling?.balls) || 0) + (newStats.balls || 0);
        const updatedRunsConceded = (Number(docData.careerStats?.bowling?.runs) || 0) + (newStats.runsConceded || 0);
        const updatedInnings = currentInnings + (newStats.balls > 0 ? 1 : 0);
        const updatedEconomy = updatedBalls > 0 ? (updatedRunsConceded / updatedBalls) * 6 : currentEconomy;
        const updatedAverage = updatedWickets > 0 ? updatedRunsConceded / updatedWickets : currentAverage;
        const updatedStrikeRate = updatedWickets > 0 ? updatedBalls / updatedWickets : currentStrikeRate;
        const updatedBest = updatedWickets > parseInt(currentBest.split('/')[0] || 0) ? `${updatedWickets}/${updatedRunsConceded}` : currentBest;

        await updateDoc(docSnap.ref, {
          average: updatedAverage,
          bestBowling: updatedBest,
          economy: updatedEconomy,
          innings: updatedInnings,
          strikeRate: updatedStrikeRate,
          wickets: updatedWickets,
          // Update nested careerStats.bowling
          'careerStats.bowling.average': updatedAverage,
          'careerStats.bowling.best': updatedBest,
          'careerStats.bowling.economy': updatedEconomy,
          'careerStats.bowling.innings': updatedInnings,
          'careerStats.bowling.strikeRate': updatedStrikeRate,
          'careerStats.bowling.wickets': updatedWickets,
          'careerStats.bowling.balls': updatedBalls,
          'careerStats.bowling.runs': updatedRunsConceded,
          'careerStats.bowling.conceded': updatedRunsConceded,
          updatedAt: Timestamp.fromDate(new Date()),
        });
        console.log(`Updated bowling details for ${playerName}`);
      });
    }
  } catch (error) {
    console.error('Error updating bowling PlayerDetails:', error);
  }
}

// Helper to increment matches count for players after the match ends
async function incrementMatchesAfterMatch(players) {
  for (const player of players) {
    try {
      const playerQuery = query(collection(db, 'PlayerDetails'), where('name', '==', player.name));
      const querySnapshot = await getDocs(playerQuery);
      querySnapshot.forEach(async (docSnap) => {
        const data = docSnap.data();
        const currentMatches = data.matches || 0;
        await updateDoc(docSnap.ref, { matches: currentMatches + 1 });
      });
    } catch (error) {
      console.error(`Error incrementing matches for ${player.name}:`, error);
    }
  }
}

function StartMatchPlayersKnockout({ initialTeamA, initialTeamB, origin, onMatchEnd, currentFixture }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract all relevant data from location.state
  const originPage = location.state?.origin;
  const maxOvers = location.state?.overs;
  const teamA = location.state?.teamA;
  const teamB = location.state?.teamB;
  const selectedPlayersFromProps = location.state?.selectedPlayers || { left: [], right: [] };
  const tournamentId = location.state?.tournamentId;
  const tournamentName = location.state?.tournamentName;
  const currentPhase = location.state?.currentPhase;
  const matchId = location.state?.matchId;

  // Log for debugging
  console.log(tournamentName)
  console.log('Tournament ID in StartMatchPlayers:', tournamentId);
  console.log('Current Phase in StartMatchPlayers:', currentPhase);
  console.log('Match ID in StartMatchPlayers:', matchId);
  const [currentView, setCurrentView] = useState('toss');
  const [showThirdButtonOnly, setShowThirdButtonOnly] = useState(false);
  const [topPlays, setTopPlays] = useState([]);
  const [currentOverBalls, setCurrentOverBalls] = useState([]);
  const [currentOverScores, setCurrentOverScores] = useState([]);
  const [pastOvers, setPastOvers] = useState([]);
  const [pastOversScores, setPastOversScores] = useState([]);
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
  const [pendingLegBy, setPendingLegBy] = useState(false);
  const [activeLabel, setActiveLabel] = useState(null);
  const [activeNumber, setActiveNumber] = useState(null);
  const [showRunInfo, setShowRunInfo] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState(null);
  const [firstInningsData, setFirstInningsData] = useState(null);
  const [stateHistory, setStateHistory] = useState([]);
  const [showMainWheel, setShowMainWheel] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [showCatchModal, setShowCatchModal] = useState(false);
  const [selectedCatchType, setSelectedCatchType] = useState('');
  const [selectedFielder, setSelectedFielder] = useState(null);

  // Dynamic player data
  const [battingTeamPlayers, setBattingTeamPlayers] = useState([]);
  const [bowlingTeamPlayers, setBowlingTeamPlayers] = useState([]);

   const [isAICompanionOpen, setIsAICompanionOpen] = useState(true);
   const [predictionData, setPredictionData] = useState(null);
   

useEffect(() => {
    const isOverCompleted = validBalls === 0 && overNumber > 0;
    const shouldTriggerPrediction =
      playerScore >= 10 || outCount > 0 || isOverCompleted;

    if (shouldTriggerPrediction) {
      const winA = Math.max(0, 100 - (playerScore + outCount * 5));
      const winB = 100 - winA;
      const generatedPrediction = {
        battingTeam: isChasing ? teamB.name : teamA.name,
        bowlingTeam: isChasing ? teamA.name : teamB.name,
        battingScore: playerScore,
        bowlingScore: targetScore,
        winA,
        winB,
        tournamentId,
        overNumber,
        nextOverProjection: `Predicted 8 runs with 1 boundary in Over ${overNumber}`,
        alternateOutcome: `If ${striker?.name || "the striker"} hits a 6 next ball, win probability increases by 5%.`,
      };

      setPredictionData(generatedPrediction);
    }
  }, [playerScore, outCount, overNumber]);
   

  useEffect(() => {
    if (!teamA || !teamB || !selectedPlayersFromProps.left || !selectedPlayersFromProps.right) {
      console.error("Missing match data in location state. Redirecting.");
      navigate('/');
      return;
    }

    if (!isChasing) {
      setBattingTeamPlayers(selectedPlayersFromProps.left.map((player, index) => ({
        ...player,
        index: player.name + index,
        photoUrl: player.photoUrl
      })));
      setBowlingTeamPlayers(selectedPlayersFromProps.right.map((player, index) => ({
        ...player,
        index: player.name + index,
        photoUrl: player.photoUrl
      })));
    } else {
      setBattingTeamPlayers(selectedPlayersFromProps.right.map((player, index) => ({
        ...player,
        index: player.name + index,
        photoUrl: player.photoUrl
      })));
      setBowlingTeamPlayers(selectedPlayersFromProps.left.map((player, index) => ({
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
    setStateHistory([]);
  }, [isChasing, selectedPlayersFromProps, teamA, teamB, navigate]);

  useEffect(() => {
    if (bowlerVisible && !showThirdButtonOnly) {
      setStateHistory(prev => [...prev, { view: 'toss', bowlerVisible: false, showThirdButtonOnly: false }]);
    } else if (showThirdButtonOnly) {
      setStateHistory(prev => [...prev, { view: 'toss', bowlerVisible: true, showThirdButtonOnly: false }]);
    }
  }, [bowlerVisible, showThirdButtonOnly]);

  const displayModal = (title, message) => {
    setModalContent({ title, message });
    setShowModal(true);
  };

  const handleButtonClick = (view) => {
    setCurrentView(view);
    setShowThirdButtonOnly(view === 'start');
  };

  const goBack = () => {
    if (gameFinished && showModal) {
      return;
    }

    if (stateHistory.length > 0) {
      const previousState = stateHistory[stateHistory.length - 1];
      setCurrentView(previousState.view);
      setBowlerVisible(previousState.bowlerVisible);
      setShowThirdButtonOnly(previousState.showThirdButtonOnly);
      setStateHistory(prev => prev.slice(0, -1));
    } else {
      navigate(-1, { state: { ...location.state, matchId } });
    }
  };

  const updateBatsmanScore = (batsmanIndex, runs) => {
    setBatsmenScores(prev => ({
      ...prev,
      [batsmanIndex]: (prev[batsmanIndex] || 0) + runs
    }));
  };

  const updateBatsmanBalls = (batsmanIndex) => {
    setBatsmenBalls(prev => ({
      ...prev,
      [batsmanIndex]: (prev[batsmanIndex] || 0) + 1
    }));
  };
  const updateBatsmanStats = (batsmanIndex, runs) => {
    setBatsmenStats(prev => {
      const currentRuns = (prev[batsmanIndex].runs || 0) + runs;
      const milestone = currentRuns >= 100 ? 'Century' : currentRuns >= 50 ? 'Half-Century' : null;
      return {
        ...prev,
        [batsmanIndex]: {
          ...prev[batsmanIndex],
          runs: currentRuns,
          balls: (prev[batsmanIndex].balls || 0) + 1,
          dotBalls: runs === 0 ? (prev[batsmanIndex].dotBalls || 0) + 1 : (prev[batsmanIndex].dotBalls || 0),
          ones: runs === 1 ? (prev[batsmanIndex].ones || 0) + 1 : (prev[batsmanIndex].ones || 0),
          twos: runs === 2 ? (prev[batsmanIndex].twos || 0) + 1 : (prev[batsmanIndex].twos || 0),
          threes: runs === 3 ? (prev[batsmanIndex].threes || 0) + 1 : (prev[batsmanIndex].threes || 0),
          fours: runs === 4 ? (prev[batsmanIndex].fours || 0) + 1 : (prev[batsmanIndex].fours || 0),
          sixes: runs === 6 ? (prev[batsmanIndex].sixes || 0) + 1 : (prev[batsmanIndex].sixes || 0),
          milestone: milestone
        }
      };
    });
  };

  const updateBowlerStats = (bowlerIndex, isWicket = false, isValidBall = false, runsConceded = 0) => {
    setBowlerStats(prev => {
      const currentBowler = prev[bowlerIndex] || { wickets: 0, ballsBowled: 0, oversBowled: '0.0', runsConceded: 0 };
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
  };

  const recordWicketOver = (batsmanIndex, catchDetails = null) => {
    const currentOver = `${overNumber - 1}.${validBalls}`;
    setWicketOvers(prev => [...prev, { batsmanIndex, over: currentOver, catchDetails }]);
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

      // Define battingTeam and bowlingTeam at the top to ensure they are always defined
      const battingTeam = isChasing ? teamB : teamA;
      const bowlingTeam = isChasing ? teamA : teamB;

      const overs = `${overNumber - 1}.${validBalls}`;

      const playerStats = battingTeamPlayers.map(player => {
        const stats = batsmenStats[player.index] || {};
        const wicket = wicketOvers.find(w => w.batsmanIndex === player.index);
        return {
          age: player.age || 0,
          audioUrl: "",
          average: 0,
          battingStyle: player.battingStyle || "Right Handed Bat",
          bestBowling: "0",
          bio: player.bio || "Right hands batman",
          bowlingStyle: player.bowlingStyle || "Right Arm Off Spin",
          careerStats: {
            batting: {
              average: 0,
              centuries: stats.milestone === 'Century' ? 1 : 0,
              fifties: stats.milestone === 'Half-Century' ? 1 : 0,
              fours: stats.fours || 0,
              highest: stats.runs || 0,
              innings: stats.balls > 0 ? 1 : 0,
              matches: 1,
              notOuts: wicket ? 0 : 1,
              runs: stats.runs || 0,
              sixes: stats.sixes || 0,
              strikeRate: getStrikeRate(player.index)
            },
            bowling: {
              average: 0,
              best: "0",
              economy: 0,
              innings: 0,
              strikeRate: 0,
              wickets: 0
            },
            fielding: {
              catches: wicket?.catchDetails ? 1 : 0,
              runOuts: 0,
              stumpings: 0
            }
          },
          centuries: stats.milestone === 'Century' ? 1 : 0,
          fifties: stats.milestone === 'Half-Century' ? 1 : 0,
          highestScore: stats.runs || 0,
          image: player.photoUrl || "",
          matches: 1,
          name: player.name || "Unknown",
          playerId: player.index || "",
          recentMatches: [],
          role: player.role || "player",
          runs: stats.runs || 0,
          strikeRate: getStrikeRate(player.index),
          teamName: battingTeam?.name || "Unknown",
          user: "yes",
          userId: auth.currentUser.uid
        };
      });
      const bowlerStatsArray = bowlingTeamPlayers.map(player => {
        const stats = bowlerStats[player.index] || {};
        return {
          age: player.age || 0,
          audioUrl: "",
          average: 0,
          battingStyle: player.battingStyle || "Right Handed Bat",
          bestBowling: stats.wickets > 0 ? `${stats.wickets}/${stats.runsConceded}` : "0",
          bio: player.bio || "Right hands batman",
          bowlingStyle: player.bowlingStyle || "Right Arm Off Spin",
          careerStats: {
            batting: {
              average: 0,
              centuries: 0,
              fifties: 0,
              fours: 0,
              highest: 0,
              innings: 0,
              matches: 1,
              notOuts: 0,
              runs: 0,
              sixes: 0,
              strikeRate: 0
            },
            bowling: {
              average: stats.runsConceded && stats.wickets ? (stats.runsConceded / stats.wickets).toFixed(2) : 0,
              best: stats.wickets > 0 ? `${stats.wickets}/${stats.runsConceded}` : "0",
              economy: stats.ballsBowled ? ((stats.runsConceded / stats.ballsBowled) * 6).toFixed(2) : 0,
              innings: stats.ballsBowled > 0 ? 1 : 0,
              strikeRate: stats.wickets && stats.ballsBowled ? (stats.ballsBowled / stats.wickets).toFixed(2) : 0,
              wickets: stats.wickets || 0
            },
            fielding: {
              catches: wicketOvers.some(w => w.catchDetails?.fielder === player.name) ? 1 : 0,
              runOuts: 0,
              stumpings: 0
            }
          },
          centuries: 0,
          fifties: 0,
          highestScore: 0,
          image: player.photoUrl || "",
          matches: 1,
          name: player.name || "Unknown",
          playerId: player.index || "",
          recentMatches: [],
          role: player.role || "player",
          runs: 0,
          strikeRate: 0,
          teamName: bowlingTeam?.name || "Unknown",
          user: "yes",
          userId: auth.currentUser.uid
        };
      });
      const matchData = {
        tournamentName,
        tournamentId,
        currentPhase,
        matchId,
        userId: auth.currentUser.uid,
        createdAt: Timestamp.fromDate(new Date()),
        Format: maxOvers,
        umpire: location.state?.scorer || 'Unknown',
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
          teamName: teamA?.name || 'Team A',
          totalScore: playerScore,
          wickets: outCount,
          overs,
          playerStats,
          bowlerStats: bowlerStatsArray
        },
        secondInnings: isChasing ? {
          teamName: teamB?.name || 'Team B',
          totalScore: playerScore,
          wickets: outCount,
          overs,
          playerStats,
          bowlerStats: bowlerStatsArray
        } : null,
        matchResult: isFinal ? (playerScore < targetScore - 1 ? teamA?.name || 'Team A' : playerScore === targetScore - 1 ? 'Tie' : teamB?.name || 'Team B') : null
      };
      const docId = `${tournamentId}_${matchId}`;
      await setDoc(doc(db, 'scoringpage', docId), matchData);
      console.log('Match data updated successfully:', matchData);

      if (isFinal) {
        // Increment matches for all players in both teams at the end of the match
        const allPlayers = [...battingTeamPlayers, ...bowlingTeamPlayers];
        await incrementMatchesAfterMatch(allPlayers);
      }
    } catch (error) {
      console.error('Error saving match data:', error);
    }
  };

  const calculateCurrentOverScores = (balls) => {
    let totalScore = 0;
    const scores = [];
    if (pastOvers.length > 0) {
      totalScore = pastOversScores[pastOversScores.length - 1] || 0;
    }
    balls.forEach(ball => {
      if (typeof ball === 'number') {
        totalScore += ball;
      } else if (typeof ball === 'string') {
        if (ball.startsWith('W+')) {
          const runs = parseInt(ball.replace('W+', ''), 10) + 1;
          totalScore += runs;
        } else if (ball.startsWith('NB+')) {
          const runs = parseInt(ball.replace('NB+', ''), 10) + 1;
          totalScore += runs;
        } else if (ball.startsWith('L+')) {
          const runs = parseInt(ball.replace('L+', ''), 10);
          totalScore += runs;
        } else if (ball.startsWith('O+')) {
          const runs = parseInt(ball.replace('O+', ''), 10);
          totalScore += runs;
        }
      }
      scores.push(totalScore);
    });
    return scores;
  };

  const handleScoreButtonClick = (value, isLabel) => {
    if (gameFinished) return;

    let runsToAdd = 0;
    let isValidBall = false;
    let isWicket = false; // For bowling update

    if (isLabel) {
      setActiveNumber(null);
      setActiveLabel(value);
    } else {
      setActiveLabel(null);
      setActiveNumber(value);
    }

    if (pendingWide && !isLabel && typeof value === 'number') {
      setShowRunInfo(false);
      runsToAdd = value + 1;
      setPlayerScore(prev => prev + runsToAdd);
      setTopPlays(prev => [...prev, `W+${value}`]);
      const newBalls = [...currentOverBalls, `W+${value}`];
      setCurrentOverBalls(newBalls);
      setCurrentOverScores(calculateCurrentOverScores(newBalls));
      if (selectedBowler) {
        updateBowlerStats(selectedBowler.index, false, false, runsToAdd);
        // Update Firestore bowling stats
        updatePlayerBowlingDetails(selectedBowler.name, {
          balls: 0, // Wide is not a valid ball
          runsConceded: runsToAdd,
          wickets: 0
        });
      }
      if (value % 2 !== 0) {
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
      }
      setPendingWide(false);
      saveMatchData();
      return;
    }

    if (pendingNoBall && !isLabel && typeof value === 'number') {
      setShowRunInfo(false);
      runsToAdd = value + 1;
      setPlayerScore(prev => prev + runsToAdd);
      setTopPlays(prev => [...prev, `NB+${value}`]);
      const newBalls = [...currentOverBalls, `NB+${value}`];
      setCurrentOverBalls(newBalls);
      setCurrentOverScores(calculateCurrentOverScores(newBalls));
      if (striker) {
        updateBatsmanScore(striker.index, value);
        updateBatsmanStats(striker.index, value);
        updateBatsmanBalls(striker.index);

        // Update PlayerDetails
        updatePlayerBattingDetails(striker.name, {
          runs: value,
          balls: 1,
          fours: value === 4 ? 1 : 0,
          sixes: value === 6 ? 1 : 0,
          isOut: false,
        });
      }
      if (selectedBowler) {
        updateBowlerStats(selectedBowler.index, false, false, runsToAdd);
        // Update Firestore bowling stats (no-ball doesn't count as valid ball but runs are conceded)
        updatePlayerBowlingDetails(selectedBowler.name, {
          balls: 0, // No-ball not counted in overs
          runsConceded: runsToAdd,
          wickets: 0
        });
      }
      if (value % 2 !== 0) {
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
      }
      setPendingNoBall(false);
      saveMatchData();
      return;
    }
    if (pendingLegBy && !isLabel && typeof value === 'number') {
      setShowRunInfo(false);
      runsToAdd = value;
      setPlayerScore(prev => prev + runsToAdd);
      setTopPlays(prev => [...prev, `L+${value}`]);
      const newBalls = [...currentOverBalls, `L+${value}`];
      setCurrentOverBalls(newBalls);
      setCurrentOverScores(calculateCurrentOverScores(newBalls));
      setValidBalls(prev => prev + 1);
      isValidBall = true;
      if (striker) {
        updateBatsmanBalls(striker.index);
        // Update PlayerDetails (leg byes don't count as runs for batsman, but balls faced might)
        updatePlayerBattingDetails(striker.name, {
          runs: 0, // Leg byes not added to batsman runs
          balls: 1,
          fours: value === 4 ? 1 : 0, // But count as four if applicable? Typically leg byes are extras, adjust as per rules
          sixes: value === 6 ? 1 : 0,
          isOut: false,
        });
      }
      if (selectedBowler) {
        updateBowlerStats(selectedBowler.index, false, true, runsToAdd);
        // Update Firestore bowling stats (leg byes are conceded runs, valid ball)
        updatePlayerBowlingDetails(selectedBowler.name, {
          balls: 1,
          runsConceded: runsToAdd,
          wickets: 0
        });
      }
      if (value % 2 !== 0) {
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
      }
      setPendingLegBy(false);
      saveMatchData();
      return;
    }

    if (pendingOut && !isLabel && typeof value === 'number') {
      if (value !== 0 && value !== 1 && value !== 2) return;
      playAnimation('out');
      setTimeout(() => {
        setShowCatchModal(true);
      }, 3000);
      return;
    }

    if (isLabel) {
      if (value === 'Wide' || value === 'No-ball' || value === 'Leg By') {
        setShowRunInfo(true);
      } else {
        setShowRunInfo(false);
      }

      if (value === 'Wide') {
        setPendingWide(true);
        return;
      } else if (value === 'No-ball') {
        setPendingNoBall(true);
        return;
      } else if (value === 'Leg By') {
        setPendingLegBy(true);
        return;
      } else if (value === 'OUT' || value === 'Wicket' || value === 'lbw') {
        setPendingOut(true);
        return;
      }
    } else {
      setShowRunInfo(false);
      runsToAdd = value;
      setPlayerScore(prev => prev + runsToAdd);
      setTopPlays(prev => [...prev, value]);
      const newBalls = [...currentOverBalls, value];
      setCurrentOverBalls(newBalls);
      setCurrentOverScores(calculateCurrentOverScores(newBalls));
      setValidBalls(prev => prev + 1);
      isValidBall = true;
      if (striker) {
        updateBatsmanScore(striker.index, value);
        updateBatsmanStats(striker.index, value);
        updateBatsmanBalls(striker.index);

        // Update PlayerDetails
        updatePlayerBattingDetails(striker.name, {
          runs: value,
          balls: 1,
          fours: value === 4 ? 1 : 0,
          sixes: value === 6 ? 1 : 0,
          isOut: false,
        });
      }
      if (selectedBowler) {
        updateBowlerStats(selectedBowler.index, false, true, runsToAdd);
        // Update Firestore bowling stats
        updatePlayerBowlingDetails(selectedBowler.name, {
          balls: 1,
          runsConceded: runsToAdd,
          wickets: 0
        });
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
    }

    if (!pendingOut && !pendingWide && !pendingNoBall && !pendingLegBy && typeof value === 'number') {
      setSelectedRun(value);
      setShowMainWheel(true);
    }

    saveMatchData();
  };

  const handleCatchSubmit = () => {
    if (!selectedCatchType || !selectedFielder) return;
    
    playAnimation('out');
    setTimeout(() => {
      const runsToAdd = activeNumber || 0;
      setPlayerScore(prev => prev + runsToAdd);
      setTopPlays(prev => [...prev, `O+${runsToAdd}`]);
      const newBalls = [...currentOverBalls, `O+${runsToAdd}`];
      setCurrentOverBalls(newBalls);
      setCurrentOverScores(calculateCurrentOverScores(newBalls));
      if (striker) {
        updateBatsmanScore(striker.index, runsToAdd);
        updateBatsmanStats(striker.index, runsToAdd);
        updateBatsmanBalls(striker.index);
        recordWicketOver(striker.index, { type: selectedCatchType, fielder: selectedFielder.name });

        // Update PlayerDetails for out
        updatePlayerBattingDetails(striker.name, {
          runs: runsToAdd,
          balls: 1,
          fours: runsToAdd === 4 ? 1 : 0,
          sixes: runsToAdd === 6 ? 1 : 0,
          isOut: true, // Mark as out
        });
      }
      setValidBalls(prev => prev + 1);
      if (selectedBowler) {
        updateBowlerStats(selectedBowler.index, true, true, runsToAdd);
        // Update Firestore bowling stats for wicket
        updatePlayerBowlingDetails(selectedBowler.name, {
          balls: 1,
          runsConceded: runsToAdd,
          wickets: 1
        });
      }
      setOutCount(prev => prev + 1);
      if (outCount + 1 < 10) {
        setShowBatsmanDropdown(true);
      }
      setShowCatchModal(false);
      setSelectedCatchType('');
      setSelectedFielder(null);
      setPendingOut(false);
      saveMatchData();
    }, 5000);
  };

  const undoLastBall = async () => {
    let removedBall;
    let newCurrentOverBalls = [...currentOverBalls];
    let newPastOvers = [...pastOvers];
    let newPastOversScores = [...pastOversScores];
    let newValidBalls = validBalls;
    let newPlayerScore = playerScore;
    let newOutCount = outCount;

    if (newCurrentOverBalls.length > 0) {
      removedBall = newCurrentOverBalls.pop();
      setCurrentOverBalls(newCurrentOverBalls);
      setCurrentOverScores(calculateCurrentOverScores(newCurrentOverBalls));
    } else if (newPastOvers.length > 0) {
      const lastOver = newPastOvers.pop();
      removedBall = lastOver.pop();
      if (lastOver.length > 0) {
        newPastOvers.push(lastOver);
      } else {
        // If last over is now empty, adjust overNumber and validBalls
        setOverNumber(prev => prev - 1);
        newValidBalls = 6; // Previous over was full
        setValidBalls(6);
      }
      setPastOvers(newPastOvers);
      newPastOversScores.pop();
      setPastOversScores(newPastOversScores);
    } else {
      console.log('No balls to undo');
      return;
    }

    // Determine the type of ball and adjust stats
    let runsToSubtract = 0;
    let ballsToSubtract = 0;
    let wicketsToSubtract = 0;
    let foursToSubtract = 0;
    let sixesToSubtract = 0;
    let isOut = false;

    if (typeof removedBall === 'number') {
      runsToSubtract = removedBall;
      ballsToSubtract = 1;
      foursToSubtract = removedBall === 4 ? 1 : 0;
      sixesToSubtract = removedBall === 6 ? 1 : 0;
    } else if (typeof removedBall === 'string') {
      if (removedBall.startsWith('W+')) {
        runsToSubtract = parseInt(removedBall.replace('W+', ''), 10) + 1;
        ballsToSubtract = 0;
      } else if (removedBall.startsWith('NB+')) {
        runsToSubtract = parseInt(removedBall.replace('NB+', ''), 10) + 1;
        ballsToSubtract = 0;
      } else if (removedBall.startsWith('L+')) {
        runsToSubtract = parseInt(removedBall.replace('L+', ''), 10);
        ballsToSubtract = 1;
      } else if (removedBall.startsWith('O+')) {
        runsToSubtract = parseInt(removedBall.replace('O+', ''), 10);
        ballsToSubtract = 1;
        wicketsToSubtract = 1;
        isOut = true;
      }
    }

    // Adjust local states
    newPlayerScore -= runsToSubtract;
    setPlayerScore(newPlayerScore);
    newValidBalls -= ballsToSubtract;
    setValidBalls(newValidBalls);
    newOutCount -= wicketsToSubtract;
    setOutCount(newOutCount);

    // Adjust batsman stats (assuming striker faced the ball)
    if (striker) {
      updateBatsmanScore(striker.index, -runsToSubtract);
      updateBatsmanBalls(striker.index, -ballsToSubtract);
      // Note: updateBatsmanStats might need reversal, but simplifying

      // Update Firestore with negative values
      await updatePlayerBattingDetails(striker.name, {
        runs: -runsToSubtract,
        balls: -ballsToSubtract,
        fours: -foursToSubtract,
        sixes: -sixesToSubtract,
        isOut: isOut ? false : false, // Adjust for undo out
      });
    }

    // Adjust bowler stats
    if (selectedBowler) {
      updateBowlerStats(selectedBowler.index, wicketsToSubtract === 1 ? true : false, ballsToSubtract === 1 ? true : false, -runsToSubtract);

      // Update Firestore with negative values
      await updatePlayerBowlingDetails(selectedBowler.name, {
        wickets: -wicketsToSubtract,
        balls: -ballsToSubtract,
        runsConceded: -runsToSubtract
      });
    }

    // Save updated match data
    await saveMatchData();
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
        const battingTeam = teamA;
        const bowlingTeam = teamB;
        const playerStats = battingTeamPlayers.map(player => {
          const stats = batsmenStats[player.index] || {};
          const wicket = wicketOvers.find(w => w.batsmanIndex === player.index);
          return {
            age: player.age || 0,
            audioUrl: "",
            average: 0,
            battingStyle: player.battingStyle || "Right Handed Bat",
            bestBowling: "0",
            bio: player.bio || "Right hands batman",
            bowlingStyle: player.bowlingStyle || "Right Arm Off Spin",
            careerStats: {
              batting: {
                average: 0,
                centuries: stats.milestone === 'Century' ? 1 : 0,
                fifties: stats.milestone === 'Half-Century' ? 1 : 0,
                fours: stats.fours || 0,
                highest: stats.runs || 0,
                innings: stats.balls > 0 ? 1 : 0,
                matches: 1,
                notOuts: wicket ? 0 : 1,
                runs: stats.runs || 0,
                sixes: stats.sixes || 0,
                strikeRate: getStrikeRate(player.index)
              },
              bowling: {
                average: 0,
                best: "0",
                economy: 0,
                innings: 0,
                strikeRate: 0,
                wickets: 0
              },
              fielding: {
                catches: wicket?.catchDetails ? 1 : 0,
                runOuts: 0,
                stumpings: 0
              }
            },
            centuries: stats.milestone === 'Century' ? 1 : 0,
            fifties: stats.milestone === 'Half-Century' ? 1 : 0,
            highestScore: stats.runs || 0,
            image: player.photoUrl || "",
            matches: 1,
            name: player.name || "Unknown",
            playerId: player.index || "",
            recentMatches: [],
            role: player.role || "player",
            runs: stats.runs || 0,
            strikeRate: getStrikeRate(player.index),
            teamName: battingTeam?.name || "Unknown",
            user: "yes",
            userId: auth.currentUser.uid
          };
        });
        const bowlerStatsArray = bowlingTeamPlayers.map(player => {
          const stats = bowlerStats[player.index] || {};
          return {
            age: player.age || 0,
            audioUrl: "",
            average: 0,
            battingStyle: player.battingStyle || "Right Handed Bat",
            bestBowling: stats.wickets > 0 ? `${stats.wickets}/${stats.runsConceded}` : "0",
            bio: player.bio || "Right hands batman",
            bowlingStyle: player.bowlingStyle || "Right Arm Off Spin",
            careerStats: {
              batting: {
                average: 0,
                centuries: 0,
                fifties: 0,
                fours: 0,
                highest: 0,
                innings: 0,
                matches: 1,
                notOuts: 0,
                runs: 0,
                sixes: 0,
                strikeRate: 0
              },
              bowling: {
                average: stats.runsConceded && stats.wickets ? (stats.runsConceded / stats.wickets).toFixed(2) : 0,
                best: stats.wickets > 0 ? `${stats.wickets}/${stats.runsConceded}` : "0",
                economy: stats.ballsBowled ? ((stats.runsConceded / stats.ballsBowled) * 6).toFixed(2) : 0,
                innings: stats.ballsBowled > 0 ? 1 : 0,
                strikeRate: stats.wickets && stats.ballsBowled ? (stats.ballsBowled / stats.wickets).toFixed(2) : 0,
                wickets: stats.wickets || 0
              },
              fielding: {
                catches: wicketOvers.some(w => w.catchDetails?.fielder === player.name) ? 1 : 0,
                runOuts: 0,
                stumpings: 0
              }
            },
            centuries: 0,
            fifties: 0,
            highestScore: 0,
            image: player.photoUrl || "",
            matches: 1,
            name: player.name || "Unknown",
            playerId: player.index || "",
            recentMatches: [],
            role: player.role || "player",
            runs: 0,
            strikeRate: 0,
            teamName: bowlingTeam?.name || "Unknown",
            user: "yes",
            userId: auth.currentUser.uid
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
          displayModal('Match Result', `${teamB.name} wins!`);
          setGameFinished(true);
        }
      }
      return;
    }
    if (isChasing && playerScore >= targetScore && targetScore > 0) {
      displayModal('Match Result', `${teamB.name} wins!`);
      setGameFinished(true);
      return;
    }

    if (validBalls === 6) {
      const currentOverScore = calculateOverScore([...pastOvers, currentOverBalls]);
      setPastOvers(prev => [...prev, currentOverBalls]);
      setPastOversScores(prev => [...prev, currentOverScore]);
      setCurrentOverBalls([]);
      setCurrentOverScores([]);
      setOverNumber(prev => prev + 1);
      setValidBalls(0);
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);
      displayModal('Over Finished', `Over ${overNumber} completed!`);
      setTimeout(() => {
        setShowBowlerDropdown(true);
      }, 1000);
    }
  }, [validBalls, currentOverBalls, nonStriker, overNumber, isChasing, targetScore, playerScore, gameFinished, outCount, maxOvers, teamA, teamB]);

  const calculateOverScore = (overs) => {
    let totalScore = 0;
    overs.forEach(over => {
      over.forEach(ball => {
        if (typeof ball === 'number') {
          totalScore += ball;
        } else if (typeof ball === 'string') {
          if (ball.startsWith('W+')) {
            const runs = parseInt(ball.replace('W+', ''), 10) + 1;
            totalScore += runs;
          } else if (ball.startsWith('NB+')) {
            const runs = parseInt(ball.replace('NB+', ''), 10) + 1;
            totalScore += runs;
          } else if (ball.startsWith('L+')) {
            const runs = parseInt(ball.replace('L+', ''), 10);
            totalScore += runs;
          } else if (ball.startsWith('O+')) {
            const runs = parseInt(ball.replace('O+', ''), 10);
            totalScore += runs;
          }
        }
      });
    });
    return totalScore;
  };
  const resetInnings = () => {
    setCurrentOverBalls([]);
    setCurrentOverScores([]);
    setPastOvers([]);
    setPastOversScores([]);
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
    setActiveLabel(null);
    setActiveNumber(null);
    setShowRunInfo(false);
    setShowCatchModal(false);
    setSelectedCatchType('');
    setSelectedFielder(null);
    setStateHistory([]);
    saveMatchData();
  };

  const resetGame = () => {
    resetInnings();
    setIsChasing(false);
    setTargetScore(0);
    setFirstInningsData(null);
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
    saveMatchData();
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
    saveMatchData();
  };

  const handleBatsmanSelect = (player) => {
    setStriker(player);
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
    saveMatchData();
  };

  const getAvailableBatsmen = () => {
    return battingTeamPlayers.filter(player =>
      !selectedBatsmenIndices.includes(player.index)
    );
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
    saveMatchData();
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
    saveMatchData();
  };

  const cancelBatsmanDropdown = () => {
    setShowBatsmanDropdown(false);
    setPendingOut(false);
    setTopPlays(prev => prev.slice(0, -1));
    const newBalls = currentOverBalls.slice(0, -1);
    setCurrentOverBalls(newBalls);
    setCurrentOverScores(calculateCurrentOverScores(newBalls));
    setValidBalls(prev => Math.max(0, prev - 1));
    saveMatchData();
  };

  const cancelCatchModal = () => {
    setShowCatchModal(false);
    setSelectedCatchType('');
    setSelectedFielder(null);
    setPendingOut(false);
    setActiveLabel(null);
    saveMatchData();
  };

  const handleModalOkClick = async () => {
    setShowModal(false);

    if (gameFinished && modalContent.title === 'Match Result') {
      let winnerTeamName = '';
      if (playerScore < targetScore - 1) {
        winnerTeamName = teamA.name;
      } else if (playerScore === targetScore - 1) {
        winnerTeamName = 'Tie';
      } else {
        winnerTeamName = teamB.name;
      }

      console.log('Starting Firebase update process...');
      console.log('Winner Team Name:', winnerTeamName);

      if (tournamentId && currentPhase && matchId) {
        console.log('Firebase IDs available:', {
          tournamentId,
          currentPhase,
          matchId,
        });

        try {
          const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
          const tournamentDoc = await getDoc(tournamentDocRef);

          if (tournamentDoc.exists()) {
            console.log('Tournament document found:', tournamentDoc.data());
            const rounds = tournamentDoc.data().rounds || [];
            const roundIndex = rounds.findIndex(
              round => round.stage === currentPhase
            );

            if (roundIndex !== -1) {
              const matches = rounds[roundIndex].matches || [];
              const matchIndex = matches.findIndex(
                match => match.id === matchId
              );

              if (matchIndex !== -1) {
                rounds[roundIndex].matches[matchIndex] = {
                  ...matches[matchIndex],
                  winner: winnerTeamName,
                  played: true,
                  team1: {
                    ...matches[matchIndex].team1,
                    score: isChasing ? targetScore - 1 : playerScore,
                    wickets: isChasing ? 0 : outCount,
                  },
                  team2: {
                    ...matches[matchIndex].team2,
                    score: isChasing ? playerScore : targetScore - 1,
                    wickets: isChasing ? outCount : 0,
                  },
                };
                await updateDoc(tournamentDocRef, {
                  rounds: rounds,
                  updatedAt: new Date(),
                });
                console.log(`Successfully updated winner to ${winnerTeamName} for match ${matchId} in phase ${currentPhase} of tournament ${tournamentId}`);
              } else {
                console.warn(`Match not found in round ${currentPhase} for matchId: ${matchId}`);
                const newMatch = {
                  id: matchId,
                  phase: currentPhase,
                  played: true,
                  round: rounds[roundIndex].roundNumber,
                  winner: winnerTeamName,
                  team1: {
                    name: teamA.name,
                    score: isChasing ? targetScore - 1 : playerScore,
                    wickets: isChasing ? 0 : outCount,
                  },
                  team2: {
                    name: teamB.name,
                    score: isChasing ? playerScore : targetScore - 1,
                    wickets: isChasing ? outCount : 0,
                  },
                };
                rounds[roundIndex].matches.push(newMatch);
                await updateDoc(tournamentDocRef, {
                  rounds: rounds,
                  updatedAt: new Date(),
                });
                console.log(`Added new match with winner ${winnerTeamName} to round ${currentPhase} in tournament ${tournamentId}`);
              }
            } else {
              console.warn(`Round not found for phase: ${currentPhase}`);
              const newRound = {
                stage: currentPhase,
                name: currentPhase === 'quarter' ? 'Quarterfinals' : currentPhase === 'semi' ? 'Semifinals' : 'Final',
                roundNumber: rounds.length,
                matches: [
                  {
                    id: matchId,
                    phase: currentPhase,
                    played: true,
                    round: rounds.length,
                    winner: winnerTeamName,
                    team1: {
                      name: teamA.name,
                      score: isChasing ? targetScore - 1 : playerScore,
                      wickets: isChasing ? 0 : outCount,
                    },
                    team2: {
                      name: teamB.name,
                      score: isChasing ? playerScore : targetScore - 1,
                      wickets: isChasing ? outCount : 0,
                    },
                  },
                ],
              };
              rounds.push(newRound);

              await updateDoc(tournamentDocRef, {
                rounds: rounds,
                updatedAt: new Date(),
              });
              console.log(`Created new round ${currentPhase} with match and winner ${winnerTeamName} in tournament ${tournamentId}`);
            }
          } else {
            console.warn(`Tournament document not found for tournamentId: ${tournamentId}`);
            await setDoc(tournamentDocRef, {
              tournamentId,
              rounds: [
                {
                  stage: currentPhase,
                  name: currentPhase === 'quarter' ? 'Quarterfinals' : currentPhase === 'semi' ? 'Semifinals' : 'Final',
                  roundNumber: 0,
                  matches: [
                    {
                      id: matchId,
                      phase: currentPhase,
                      played: true,
                      round: 0,
                      winner: winnerTeamName,
                      team1: {
                        name: teamA.name,
                        score: isChasing ? targetScore - 1 : playerScore,
                        wickets: isChasing ? 0 : outCount,
                      },
                      team2: {
                        name: teamB.name,
                        score: isChasing ? playerScore : targetScore - 1,
                        wickets: isChasing ? outCount : 0,
                      },
                    },
                  ],
                },
              ],
              teams: [],
              format: 'playOff',
              tournamentWinner: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            console.log(`Created new tournament document with round ${currentPhase} and winner ${winnerTeamName}`);
          }
        } catch (error) {
          console.error('Error during Firebase operation:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
          });
          displayModal('Error', 'Failed to update match result in the database. Please try again.');
          return;
        }
      } else {
        console.error('Missing Firebase IDs for update:', {
          tournamentId,
          currentPhase,
          matchId,
        });
        displayModal('Error', 'Missing match data. Cannot update the result.');
        return;
      }

      if (currentFixture?.id) {
        markFixtureAsCompleted(currentFixture.id);
      }

      saveMatchData(true);

      if (originPage) {
        console.log('Navigating to origin page:', originPage);
        navigate(originPage, {
          state: {
            activeTab: 'Match Results',
            winner: winnerTeamName,
            matchId: matchId,
            currentPhase: currentPhase,
            tournamentId: tournamentId,
            completedFixtureId: currentFixture?.id,
            teamA: {
              name: teamA.name,
              flagUrl: teamA.flagUrl,
              score: isChasing ? targetScore - 1 : playerScore,
              wickets: isChasing ? 0 : outCount,
              balls: isChasing ? 0 : (overNumber - 1) * 6 + validBalls,
            },
            teamB: {
              name: teamB.name,
              flagUrl: teamB.flagUrl,
              score: isChasing ? playerScore : targetScore - 1,
              wickets: isChasing ? outCount : 0,
              balls: isChasing ? (overNumber - 1) * 6 + validBalls : 0,
            },
            winningDifference: gameFinished
              ? playerScore < targetScore - 1
                ? `${targetScore - 1 - playerScore} runs`
                : playerScore > targetScore - 1
                ? `${10 - outCount} wickets`
                : 'Tie'
              : '',
          },
        });
      } else {
        console.log('No origin page, navigating to root');
        navigate('/');
      }
    } else if (modalContent.title === 'Innings Break') {
      resetInnings();
      setIsChasing(true);
      setBowlerVisible(false);
      setCurrentView('toss');
      setShowThirdButtonOnly(false);
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
                  style={{ width: '400px', height: '500px' }}
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
                  }}
                  loop
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

        {showCatchModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#4C0025] p-6 rounded-lg max-w-md w-full mx-4 relative">
              <button
                onClick={cancelCatchModal}
                className="absolute top-2 right-2 w-6 h-6 text-white font-bold flex items-center justify-center text-xl"
              >
                ×
              </button>
              <h3 className="text-white text-xl font-bold mb-4">Select Catch Details</h3>
              <div className="mb-4">
                <label className="text-white block mb-2">Catch Type:</label>
                <select
                  value={selectedCatchType}
                  onChange={(e) => setSelectedCatchType(e.target.value)}
                  className="w-full p-2 rounded bg-gray-800 text-white"
                >
                  <option value="">Select Catch Type</option>
                  <option value="Diving">Diving</option>
                  <option value="Running">Running</option>
                  <option value="Overhead">Overhead</option>
                  <option value="One-handed">One-handed</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="text-white block mb-2">Fielder:</label>
                <select
                  value={selectedFielder?.index || ''}
                  onChange={(e) => {
                    const fielder = bowlingTeamPlayers.find(p => p.index === e.target.value);
                    setSelectedFielder(fielder);
                  }}
                  className="w-full p-2 rounded bg-gray-800 text-white"
                >
                  <option value="">Select Fielder</option>
                  {bowlingTeamPlayers.map(player => (
                    <option key={player.index} value={player.index}>{player.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleCatchSubmit}
                  disabled={!selectedCatchType || !selectedFielder}
                  className={`w-40 h-12 text-white font-bold text-lg rounded-lg border-2 border-white ${
                    selectedCatchType && selectedFielder ? 'bg-[#FF62A1] hover:bg-[#FF4A8D]' : 'bg-gray-500 cursor-not-allowed'
                  }`}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'toss' && (
          <>
            <div id="toss" className="text-center mb-4">
              <h2 className="text-white font-bold text-3xl md:text-[3rem] mt-20 md:mt-6">
                {bowlerVisible ? (isChasing ? teamA.name : teamB.name) : (isChasing ? teamB.name : teamA.name)}
              </h2>
              <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#F0167C] to-white text-center">
                {bowlerVisible ? (isChasing ? 'Choose the bowler' : 'Choose the Bowler') : 'Select Batsmen'}
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
                          <img
                            src={striker.photoUrl}
                            alt="Striker"
                            className="w-20 h-20 md:w-10 md:h-10 lg:w-10 lg:h-10 rounded-full mx-auto object-cover aspect-square"
                            onError={(e) => (e.target.src = '')}
                          />
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
                    <button className="w-28 h-12 text-white text-lg md:w-25 md:h-10 font-bold bg-gradient-to-l from-[#12BFA5] to-[#000000] rounded-[1rem] shadow-lg">
                      Non-Striker
                    </button>
                    {nonStriker && (
                      <div className="relative text-white text-center mt-2 relative">
                        <div className="inline-block">
                          <img
                            src={nonStriker.photoUrl}
                            alt="Non-striker"
                            className="w-20 h-20 md:w-15 md:h-15 lg:w-10 lg:h-10 rounded-full mx-auto object-cover aspect-square"
                            onError={(e) => (e.target.src = '')}
                          />
                          <button
                            onClick={cancelNonStriker}
                            className="absolute -top-2 right-4 w-6 h-6 text-white font-bold flex items-center justify-center text-xl"
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
                      <img
                        src={player.photoUrl}
                        alt="Player"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.src = '')}
                      />
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
                onClick={() => setBowlerVisible(true)}
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
                <img
                  src={selectedBowler.photoUrl}
                  alt="Bowler"
                  className="w-20 h-20 md:w-15 md:h-15 lg:w-15 lg:h-15 rounded-full mx-auto object-cover aspect-square"
                  onError={(e) => (e.target.src = '')}
                />
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
                      <div
                        className={`w-20 h-20 md:w-15 md:h-15 lg:w-15 lg:h-15 rounded-full border-[5px] border-[#12BFA5] overflow-hidden flex items-center justify-center aspect-square`}
                      >
                        <img
                          src={player.photoUrl}
                          alt="Player"
                          className="w-full h-full object-cover aspect-square"
                          onError={(e) => (e.target.src = '')}
                        />
                      </div>
                      <span className="mt-2 font-bold text-lg">{player.name}</span>
                      <h2 className="text-sm font-light">{player.role}</h2>
                    </div>
                  ))}
                </div>

                {selectedBowler && (
                  <button
                    onClick={() => handleButtonClick('start')}
                    className="w-30 h-10 mt-4 text-white text-lg font-bold rounded-3xl bg-black bg-[url('../assets/kumar/button.png')] bg-cover bg-center shadow-lg transform transition duration-200 hover:scale-105 hover:shadow-xl active:scale-95 active:shadow-md"
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
      {['Wide', 'No-ball', 'OUT', 'Leg By'].map((label) => {
        const isActive = activeLabel === label;
        return (
          <button
            key={label}
            onClick={() => handleScoreButtonClick(label, true)}
            className={`w-20 h-10 md:w-20 h-12 md:h-12
              ${isActive ? 'bg-red-600' : 'bg-[#4C0025] hover:bg-gray-300'}
              text-white font-bold text-sm md:text-lg sm:text-sm font-semibold rounded-lg border-2 border-white items-center justify-center cursor-pointer transition-opacity hover:opacity-80`}
          >
            {label}
          </button>
        )
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
        {['Wide', 'No-ball', 'OUT', 'Leg By'].map((label) => {
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
            {/* &lt;div  className="mt-12">
                  &lt;motion.button
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 w-full max-w-md flex items-center justify-center gap-2 mx-auto"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsPitchAnalyzerOpen(true)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Match Companion
                  </motion.button>
            
                  <AnimatePresence>
                    {isPitchAnalyzerOpen && (
                      <PitchAnalyzer 
                        onClose={() => setIsPitchAnalyzerOpen(false)} 
                      />
                    )}
                  </AnimatePresence>
                </div> */}
                    
            <div>
                   {isAICompanionOpen && (
                    <AIMatchCompanionModal
                      isOpen={isAICompanionOpen}
                      predictionData={predictionData}
                      tournamentId={tournamentId}
                    />
                  )}
                </div>

            {showRunInfo && (
              <p className="text-yellow-300 text-sm mt-2 text-center font-medium">
                Please select run, if not select 0
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
                        <img
                          src={player.photoUrl}
                          alt="Player"
                          className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover aspect-square"
                          onError={(e) => (e.target.src = '')}
                        />
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
                    onClick={() => setShowBowlerDropdown(false)}
                    className="absolute top-2 right-2 w-6 h-6 text-white font-bold flex items-center justify-center text-xl"
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
                        <img
                          src={player.photoUrl}
                          alt="Player"
                          className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover aspect-square"
                          onError={(e) => (e.target.src = '')}
                        />
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
              <p>First Innings Score: {playerScore}/{outCount}</p>
              <p>Overs: {overNumber - 1}</p>
            </div>
            <button
              onClick={() => {
                setIsChasing(true);
                setTargetScore(playerScore + 1);
                resetInnings();
                handleButtonClick('toss');
              }}
              className="w-40 h-14 text-white md:text-lg font-medium bg-black bg-opacity-75 rounded-lg shadow-lg hover:bg-gray-800 transition-colors duration-200"
            >
              Start Chase
            </button>
          </div>
        )}
        {/* Place MainWheel here, outside condition */}
        {showMainWheel && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="relative bg-white p-6 rounded-lg w-[90%] max-w-3xl mx-auto">
              
              {/* Close Button in Top-Right */}
              <button
                onClick={() => setShowMainWheel(false)}
                className="absolute top-8 right-8 bg-black text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-800 transition"
              >
                ✕
              </button>
        
              {/* Main Content */}
              <MainWheel
                run={selectedRun}
                onClose={() => setShowMainWheel(false)}
              />
            </div>
          </div>
        )}
      </section>
    </ErrorBoundary>
  );
};

export default StartMatchPlayersKnockout;
