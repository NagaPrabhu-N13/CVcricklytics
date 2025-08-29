import React, { useState, useEffect, Component } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeaderComponent from '../components/kumar/startMatchHeader';
// import flag1 from '../assets/kumar/Netherland.png';
// import flag2 from '../assets/kumar/ukraine.png';
// import btnbg from '../assets/kumar/button.png';
import backButton from '../assets/kumar/right-chevron.png';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Player } from '@lottiefiles/react-lottie-player';
import sixAnimation from '../assets/Animation/six.json';
import fourAnimation from '../assets/Animation/four.json';
import outAnimation from '../assets/Animation/out.json';
import { db, auth } from '../firebase';
import MainWheel from "../components/yogesh/wagonwheel/mainwheel";
import { getDoc, setDoc, doc, Timestamp, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import AIMatchCompanionModal from '../components/yogesh/LandingPage/AIMatchCompanion';
import { motion, AnimatePresence } from 'framer-motion';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
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

function StartMatchPlayers({ initialTeamA, initialTeamB, origin, onMatchEnd }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewHistory, setViewHistory] = useState(['toss']);

  // Extract all relevant data from location.state
  const originPage = location.state?.origin;
  const umpire = location.state?.scorer;
  const maxOvers = location.state?.overs;
  const teamA = location.state?.teamA || initialTeamA;
  const teamB = location.state?.teamB || initialTeamB;
  const selectedPlayersFromProps = location.state?.selectedPlayers || { left: [], right: [] };

  const [matchId] = useState(Date.now().toString());
  const [currentView, setCurrentView] = useState('toss');
  const [showThirdButtonOnly, setShowThirdButtonOnly] = useState(false);
  const [topPlays, setTopPlays] = useState([]);
  const [currentOverBalls, setCurrentOverBalls] = useState([]);
  const [pastOvers, setPastOvers] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [outCount, setOutCount] = useState(0);
  const [validBalls, setValidBalls] = useState(0);
  const [overNumber, setOverNumber] = useState(1);
  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [bowlerVisible, setBowlerVisible] = useState(false);
  const [selectedBowler, setSelectedBowler] = useState(null);
  const [showBowlerDropdown, setShowBowlerDropdown] = useState(false);
  const [showBatsmanDropdown, setShowBatsmanDropdown] = useState(false);
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
  const [showOutTypeModal, setShowOutTypeModal] = useState(false);
  const [outType, setOutType] = useState(null);
  const [showCatcherModal, setShowCatcherModal] = useState(false);
  const [showFielderModal, setShowFielderModal] = useState(false);
  const [catcher, setCatcher] = useState(null);
  const [fielder, setFielder] = useState(null);
  const [fielderRole, setFielderRole] = useState(null);
  const [currentOverRuns, setCurrentOverRuns] = useState(0);
  const [maidenOvers, setMaidenOvers] = useState({});
  const [showMainWheel, setShowMainWheel] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [showCatchModal, setShowCatchModal] = useState(false);
  const [selectedCatchType, setSelectedCatchType] = useState('');
  const [selectedFielder, setSelectedFielder] = useState(null);
  const [catchRuns, setCatchRuns] = useState(null);
  const [playedOvers, setPlayedOvers] = useState(0);
  const [playedWickets, setPlayedWickets] = useState(0);

  // Dynamic player data
  const [battingTeamPlayers, setBattingTeamPlayers] = useState([]);
  const [bowlingTeamPlayers, setBowlingTeamPlayers] = useState([]);
  const catchTypes = ['Diving', 'Running', 'Overhead', 'One-handed', 'Standard'];
  const extraBalls = ['Wide', 'No-ball', 'Leg By', 'OUT', 'lbw'];

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
        battingTeam: isChasing ? teamB.name : teamA.name, // chasing = batting second
       bowlingTeam: isChasing ? teamA.name : teamB.name,
       battingScore: playerScore,
       bowlingScore: targetScore,
       winA,
       winB,
       overNumber,
       nextOverProjection: `Predicted 8 runs with 1 boundary in Over ${overNumber}`,
       alternateOutcome: `If ${striker?.name || "the striker"} hits a 6 next ball, win probability increases by 5%.`,
     };
     
     
           setPredictionData(generatedPrediction);
         }
       }, [playerScore, outCount, overNumber]);
     

  // Generate team flag or fallback (first letter of team name)
  const getTeamFlag = (team) => {
    if (team?.flagUrl) {
      return <img src={team.flagUrl} alt={`${team.teamName} Flag`} className="w-16 h-16 md:w-30 md:h-30 aspect-square object-cover rounded-sm" />;
    }
    return (
      <div className="w-16 h-16 md:w-30 md:h-30 flex items-center justify-center bg-blue-500 text-white font-bold rounded-sm text-2xl md:text-4xl">
        {team?.teamName?.charAt(0).toUpperCase() || '?'}
      </div>
    );
  };

  // Generate player image or fallback (first letter of player name)
  const getPlayerImage = (player, sizeClass = 'w-20 h-20 md:w-15 md:h-15 lg:w-15 lg:h-15') => {
    if (player?.image) {
      return (
        <img
          src={player.image}
          alt={player.name}
          className={`${sizeClass} rounded-full object-cover aspect-square border-[5px] border-[#F0167C]`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '';
          }}
        />
      );
    }
    return (
      <div className={`${sizeClass} flex items-center justify-center bg-blue-500 text-white font-bold rounded-full border-[5px] border-[#F0167C] text-lg md:text-xl`}>
        {player?.name?.charAt(0).toUpperCase() || '?'}
      </div>
    );
  };

  useEffect(() => {
    if (!teamA || !teamB || !selectedPlayersFromProps.left || !selectedPlayersFromProps.right) {
      console.error("Missing match data in location state. Redirecting.");
      navigate('/');
      return;
    }

    const currentUserId = auth.currentUser ? auth.currentUser.uid : '';

    if (!isChasing) {
      setBattingTeamPlayers(selectedPlayersFromProps.left.map((player, index) => ({
        ...player,
        index: player.name + index,
        photoUrl: player.image,
        user: player.user,
        playerId: player.playerId,
      })));
      setBowlingTeamPlayers(selectedPlayersFromProps.right.map((player, index) => ({
        ...player,
        index: player.name + index,
        photoUrl: player.image,
        user: player.user,
        playerId: player.playerId,
      })));
    } else {
      setBattingTeamPlayers(selectedPlayersFromProps.right.map((player, index) => ({
        ...player,
        index: player.name + index,
        photoUrl: player.image,
        user: player.user,
        playerId: player.playerId,
      })));
      setBowlingTeamPlayers(selectedPlayersFromProps.left.map((player, index) => ({
        ...player,
        index: player.name + index,
        photoUrl: player.image,
        user: player.user,
        playerId: player.playerId,
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
    setCurrentOverRuns(0);
  }, [isChasing, selectedPlayersFromProps, teamA, teamB, navigate]);

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
    if (currentView === 'start' && showThirdButtonOnly) {
      setCurrentView('toss');
      setShowThirdButtonOnly(false);
      setBowlerVisible(true);
    } else if (bowlerVisible) {
      setBowlerVisible(false);
      setSelectedBowler(null);
    } else if (striker || nonStriker) {
      if (striker) {
        cancelStriker();
      } else if (nonStriker) {
        cancelNonStriker();
      }
    } else if (showCatchModal) {
      setShowCatchModal(false);
      setSelectedCatchType('');
      setSelectedFielder(null);
      setCatchRuns(null);
      return;
    } else if (showBowlerDropdown) {
      setShowBowlerDropdown(false);
      return;
    } else if (showBatsmanDropdown) {
      cancelBatsmanDropdown();
      return;
    } else if (viewHistory.length > 1) {
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

  const updateBatsmanStats = (batsmanIndex, runs, isDotBall = false) => {
    setBatsmenStats(prev => {
      const currentStats = prev[batsmanIndex] || {
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
      const newRuns = currentStats.runs + runs;
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
  };

  const updateBowlerStats = (bowlerIndex, isWicket = false, isValidBall = false, runsConceded = 0, isNoBall = false, isWide = false, isDotBall = false) => {
    setBowlerStats(prev => {
      const currentBowler = prev[bowlerIndex] || { wickets: 0, ballsBowled: 0, oversBowled: '0.0', runsConceded: 0, maidens: 0, noBalls: 0, wides: 0, dotBalls: 0 };
      const ballsBowled = currentBowler.ballsBowled + (isValidBall ? 1 : 0);
      const overs = Math.floor(ballsBowled / 6) + (ballsBowled % 6) / 10;
      
      return {
        ...prev,
        [bowlerIndex]: {
          ...currentBowler,
          wickets: isWicket ? (currentBowler.wickets || 0) + 1 : currentBowler.wickets || 0,
          ballsBowled,
          oversBowled: overs.toFixed(1),
          runsConceded: (currentBowler.runsConceded || 0) + runsConceded,
          maidens: currentBowler.maidens || 0,
          noBalls: isNoBall ? (currentBowler.noBalls || 0) + 1 : currentBowler.noBalls || 0,
          wides: isWide ? (currentBowler.wides || 0) + 1 : currentBowler.wides || 0,
          dotBalls: isDotBall ? (currentBowler.dotBalls || 0) + 1 : currentBowler.dotBalls || 0
        }
      };
    });
  };

  const updateMaidenOvers = (bowlerIndex) => {
    setMaidenOvers(prev => ({
      ...prev,
      [bowlerIndex]: (prev[bowlerIndex] || 0) + 1
    }));
    
    setBowlerStats(prev => ({
      ...prev,
      [bowlerIndex]: {
        ...prev[bowlerIndex],
        maidens: (prev[bowlerIndex]?.maidens || 0) + 1
      }
    }));
  };

  const recordWicketOver = (batsmanIndex, type, bowlerIndex, fielderIndex = null, fielderRole = null, catchType = null) => {
    const currentOver = `${overNumber - 1}.${validBalls}`;
    setWicketOvers(prev => [...prev, { 
      batsmanIndex, 
      over: currentOver,
      type,
      bowlerIndex,
      fielderIndex,
      fielderRole,
      catchType
    }]);
  };

  const recordWicket = (batsmanIndex, catchType = null, fielder = null) => {
    const currentOver = `${overNumber - 1}.${validBalls + 1}`;
    setWicketOvers(prev => [...prev, { 
      batsmanIndex, 
      over: currentOver,
      catchType,
      fielder: fielder ? { name: fielder.name, index: fielder.index } : null
    }]);
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

      // Prepare player stats
      const playerStats = battingTeamPlayers.map(player => {
        const stats = batsmenStats[player.index] || {};
        const wicket = wicketOvers.find(w => w.batsmanIndex === player.index);
        return {
          index: player.index || '',
          name: player.name || 'Unknown',
          photoUrl: player.image || '',
          role: player.role || '',
          user: player.user || 'No',
          playerId: player.playerId || '',
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
          dismissalType: wicket ? wicket.type : null,
          bowlerIndex: wicket ? wicket.bowlerIndex : null,
          fielderIndex: wicket ? wicket.fielderIndex : null,
          fielderRole: wicket ? wicket.fielderRole : null,
          catchType: wicket?.catchType || null,
          fielder: wicket?.fielder || null
        };
      });

      // Prepare bowler stats
      const bowlerStatsArray = bowlingTeamPlayers.map(player => {
        const stats = bowlerStats[player.index] || {};
        return {
          index: player.index || '',
          name: player.name || 'Unknown',
          photoUrl: player.image || '',
          role: player.role || '',
          user: player.user || 'No',
          playerId: player.playerId || '',
          wickets: stats.wickets || 0,
          oversBowled: stats.oversBowled || '0.0',
          runsConceded: stats.runsConceded || 0,
          maidens: stats.maidens || 0,
          noBalls: stats.noBalls || 0,
          wides: stats.wides || 0,
          dotBalls: stats.dotBalls || 0
        };
      });

      // Prepare fielding stats
      const fieldingStats = bowlingTeamPlayers.map(player => {
        const catches = wicketOvers.filter(w => 
          w.fielderIndex === player.index && w.type === 'catch'
        ).length;
        const stumpings = wicketOvers.filter(w => 
          w.fielderIndex === player.index && w.type === 'stumping' && w.fielderRole === 'wicketKeeper'
        ).length;
        const runOuts = wicketOvers.filter(w => 
          w.fielderIndex === player.index && w.type === 'runout' && w.fielderRole === 'fielder'
        ).length;
        
        return {
          index: player.index || '',
          name: player.name || 'Unknown',
          photoUrl: player.image || '',
          role: player.role || '',
          user: player.user || 'No',
          playerId: player.playerId || '',
          catches,
          stumpings,
          runOuts
        };
      });

      // Prepare match data
      const matchData = {
        matchId,
        userId: auth.currentUser.uid,
        createdAt: Timestamp.fromDate(new Date()),
        Format: maxOvers,
        umpire: umpire,
        teamA: {
          name: teamA?.teamName || 'Team A',
          flagUrl: teamA?.flagUrl || '',
          players: selectedPlayersFromProps.left.map(p => ({
            name: p.name || 'Unknown',
            index: p.name + selectedPlayersFromProps.left.findIndex(pl => pl.name === p.name),
            photoUrl: p.image || '',
            role: p.role || '',
            user: p.user || 'No',
            playerId: p.playerId || '',
          })),
          totalScore: isChasing ? (firstInningsData?.totalScore || 0) : playerScore,
          wickets: isChasing ? (firstInningsData?.wickets || 0) : outCount,
          overs: isChasing ? (firstInningsData?.overs || '0.0') : overs,
          result: isFinal ? (playerScore < targetScore - 1 ? 'Win' : playerScore === targetScore - 1 ? 'Tie' : 'Loss') : null
        },
        teamB: {
          name: teamB?.teamName || 'Team B',
          flagUrl: teamB?.flagUrl || '',
          players: selectedPlayersFromProps.right.map(p => ({
            name: p.name || 'Unknown',
            index: p.name + selectedPlayersFromProps.right.findIndex(pl => pl.name === p.name),
            photoUrl: p.image || '',
            role: p.role || '',
            user: p.user || 'No',
            playerId: p.playerId || '',
          })),
          totalScore: isChasing ? playerScore : (firstInningsData?.totalScore || 0),
          wickets: isChasing ? outCount : (firstInningsData?.wickets || 0),
          overs: isChasing ? overs : (firstInningsData?.overs || '0.0'),
          result: isFinal ? (playerScore < targetScore - 1 ? 'Loss' : playerScore === targetScore - 1 ? 'Tie' : 'Win') : null
        },
        firstInnings: firstInningsData || {
          teamName: teamA?.teamName || 'Team A',
          totalScore: playerScore,
          wickets: outCount,
          overs,
          playerStats,
          bowlerStats: bowlerStatsArray,
          fieldingStats
        },
        secondInnings: isChasing ? {
          teamName: teamB?.teamName || 'Team B',
          totalScore: playerScore,
          wickets: outCount,
          overs,
          playerStats,
          bowlerStats: bowlerStatsArray,
          fieldingStats
        } : null,
        matchResult: isFinal ? (playerScore < targetScore - 1 ? teamA?.teamName || 'Team A' : playerScore === targetScore - 1 ? 'Tie' : teamB?.teamName || 'Team B') : null
      };

      // Save to scoringpage collection
      await setDoc(doc(db, 'scoringpage', matchId), matchData);
      console.log('Match data updated successfully in scoringpage:', matchData);

      // Update clubTeams collection when match is finished
      if (isFinal) {
        // Function to update player stats in any team
        const updatePlayerStats = async (teamDocRef, playerId, newStats) => {
          const teamDoc = await getDoc(teamDocRef);
          if (teamDoc.exists()) {
            const teamData = teamDoc.data();
            const players = teamData.players || [];
            
            const playerIndex = players.findIndex(p => p.playerId === playerId);
            if (playerIndex !== -1) {
              const player = players[playerIndex];
              
              // Initialize careerStats if undefined
              const careerStats = player.careerStats || {
                batting: {
                  matches: 0,
                  innings: 0,
                  notOuts: 0,
                  runs: 0,
                  balls: 0,
                  highest: 0,
                  fours: 0,
                  sixes: 0,
                  centuries: 0,
                  fifties: 0,
                  average: 0,
                  strikeRate: 0
                },
                bowling: {
                  innings: 0,
                  wickets: 0,
                  runsConceded: 0,
                  overs: 0,
                  maidens: 0,
                  noBalls: 0,
                  wides: 0,
                  dotBalls: 0,
                  bestBowling: '0/0',
                  average: 0,
                  economy: 0,
                  strikeRate: 0
                },
                fielding: {
                  catches: 0,
                  stumpings: 0,
                  runOuts: 0
                }
              };

              // Determine best bowling figure
              const currentBest = careerStats.bowling.bestBowling || '0/0';
              const [currentWickets, currentRuns] = currentBest.split('/').map(Number);
              let newBestBowling = currentBest;
              if (newStats.wickets > currentWickets || 
                  (newStats.wickets === currentWickets && newStats.runsConceded < currentRuns)) {
                newBestBowling = `${newStats.wickets}/${newStats.runsConceded}`;
              }

              // Calculate centuries and fifties
              const centuries = newStats.milestone === 'Century' ? 1 : 0;
              const fifties = newStats.milestone === 'Half-Century' ? 1 : 0;

              // Update player stats
              players[playerIndex] = {
                ...player,
                matches: (player.matches || 0) + 1,
                runs: (player.runs || 0) + newStats.runs,
                wickets: (player.wickets || 0) + newStats.wickets,
                careerStats: {
                  ...careerStats,
                  batting: {
                    ...careerStats.batting,
                    matches: (careerStats.batting.matches || 0) + 1,
                    innings: (careerStats.batting.innings || 0) + (newStats.runs > 0 || newStats.balls > 0 ? 1 : 0),
                    notOuts: (careerStats.batting.notOuts || 0) + (newStats.wicketOver ? 0 : newStats.balls > 0 ? 1 : 0),
                    runs: (careerStats.batting.runs || 0) + newStats.runs,
                    balls: (careerStats.batting.balls || 0) + newStats.balls,
                    highest: Math.max(careerStats.batting.highest || 0, newStats.runs),
                    fours: (careerStats.batting.fours || 0) + newStats.fours,
                    sixes: (careerStats.batting.sixes || 0) + newStats.sixes,
                    centuries: (careerStats.batting.centuries || 0) + centuries,
                    fifties: (careerStats.batting.fifties || 0) + fifties,
                    average: 0,
                    strikeRate: 0
                  },
                  bowling: {
                    ...careerStats.bowling,
                    innings: (careerStats.bowling.innings || 0) + (newStats.oversBowled > 0 ? 1 : 0),
                    wickets: (careerStats.bowling.wickets || 0) + newStats.wickets,
                    runsConceded: (careerStats.bowling.runsConceded || 0) + newStats.runsConceded,
                    overs: (careerStats.bowling.overs || 0) + parseFloat(newStats.oversBowled),
                    maidens: (careerStats.bowling.maidens || 0) + newStats.maidens,
                    noBalls: (careerStats.bowling.noBalls || 0) + newStats.noBalls,
                    wides: (careerStats.bowling.wides || 0) + newStats.wides,
                    dotBalls: (careerStats.bowling.dotBalls || 0) + newStats.dotBalls,
                    bestBowling: newBestBowling,
                    average: 0,
                    economy: 0,
                    strikeRate: 0
                  },
                  fielding: {
                    catches: (careerStats.fielding.catches || 0) + newStats.catches,
                    stumpings: (careerStats.fielding.stumpings || 0) + newStats.stumpings,
                    runOuts: (careerStats.fielding.runOuts || 0) + newStats.runOuts
                  }
                }
              };

              await updateDoc(teamDocRef, {
                players: players
              });
            }
          }
        };

        // Function to find team documents by name
        const findTeamsByName = async (teamName) => {
          const teamsRef = collection(db, 'clubTeams');
          const q = query(teamsRef, where("teamName", "==", teamName));
          const querySnapshot = await getDocs(q);
          return querySnapshot.docs;
        };

        // Combine all player stats from both innings
        const allPlayerStats = [...(firstInningsData?.playerStats || []), ...playerStats];
        const allBowlerStats = [...(firstInningsData?.bowlerStats || []), ...bowlerStatsArray];
        const allFieldingStats = [...(firstInningsData?.fieldingStats || []), ...fieldingStats];

        // Create a map of all players with their combined stats
        const allPlayersMap = new Map();

        // Add batting stats
        allPlayerStats.forEach(stat => {
          if (!allPlayersMap.has(stat.playerId)) {
            allPlayersMap.set(stat.playerId, {
              ...stat,
              wickets: 0,
              oversBowled: '0.0',
              runsConceded: 0,
              maidens: 0,
              noBalls: 0,
              wides: 0,
              dotBalls: 0,
              catches: 0,
              stumpings: 0,
              runOuts: 0
            });
          } else {
            const existing = allPlayersMap.get(stat.playerId);
            allPlayersMap.set(stat.playerId, {
              ...existing,
              ...stat
            });
          }
        });

        // Add bowling stats
        allBowlerStats.forEach(stat => {
          if (!allPlayersMap.has(stat.playerId)) {
            allPlayersMap.set(stat.playerId, {
              playerId: stat.playerId,
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              ...stat,
              catches: 0,
              stumpings: 0,
              runOuts: 0
            });
          } else {
            const existing = allPlayersMap.get(stat.playerId);
            allPlayersMap.set(stat.playerId, {
              ...existing,
              wickets: stat.wickets,
              oversBowled: stat.oversBowled,
              runsConceded: stat.runsConceded,
              maidens: stat.maidens,
              noBalls: stat.noBalls,
              wides: stat.wides,
              dotBalls: stat.dotBalls
            });
          }
        });

        // Add fielding stats
        allFieldingStats.forEach(stat => {
          if (!allPlayersMap.has(stat.playerId)) {
            allPlayersMap.set(stat.playerId, {
              playerId: stat.playerId,
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              wickets: 0,
              oversBowled: '0.0',
              runsConceded: 0,
              maidens: 0,
              noBalls: 0,
              wides: 0,
              dotBalls: 0,
              catches: stat.catches,
              stumpings: stat.stumpings,
              runOuts: stat.runOuts
            });
          } else {
            const existing = allPlayersMap.get(stat.playerId);
            allPlayersMap.set(stat.playerId, {
              ...existing,
              catches: stat.catches,
              stumpings: stat.stumpings,
              runOuts: stat.runOuts
            });
          }
        });

        // Find all team documents for both teams
        const teamADocs = await findTeamsByName(teamA.teamName);
        const teamBDocs = await findTeamsByName(teamB.teamName);

        // Update all players in all Team A documents
        for (const teamDoc of teamADocs) {
          for (const player of selectedPlayersFromProps.left) {
            const playerStats = allPlayersMap.get(player.playerId);
            if (playerStats) {
              await updatePlayerStats(teamDoc.ref, player.playerId, playerStats);
            }
          }

          // Update team stats for Team A
          const isWinner = matchData.matchResult === teamA.teamName;
          await updateDoc(teamDoc.ref, {
            matches: (teamDoc.data().matches || 0) + 1,
            wins: isWinner ? (teamDoc.data().wins || 0) + 1 : (teamDoc.data().wins || 0),
            points: isWinner ? (teamDoc.data().points || 0) + 2 : 
                   matchData.matchResult === 'Tie' ? (teamDoc.data().points || 0) + 1 : 
                   (teamDoc.data().points || 0),
            losses: !isWinner && matchData.matchResult !== 'Tie' ? 
                   (teamDoc.data().losses || 0) + 1 : (teamDoc.data().losses || 0),
            lastMatch: matchData.matchResult || ''
          });
        }

        // Update all players in all Team B documents
        for (const teamDoc of teamBDocs) {
          for (const player of selectedPlayersFromProps.right) {
            const playerStats = allPlayersMap.get(player.playerId);
            if (playerStats) {
              await updatePlayerStats(teamDoc.ref, player.playerId, playerStats);
            }
          }

          // Update team stats for Team B
          const isWinner = matchData.matchResult === teamB.teamName;
          await updateDoc(teamDoc.ref, {
            matches: (teamDoc.data().matches || 0) + 1,
            wins: isWinner ? (teamDoc.data().wins || 0) + 1 : (teamDoc.data().wins || 0),
            points: isWinner ? (teamDoc.data().points || 0) + 2 : 
                   matchData.matchResult === 'Tie' ? (teamDoc.data().points || 0) + 1 : 
                   (teamDoc.data().points || 0),
            losses: !isWinner && matchData.matchResult !== 'Tie' ? 
                   (teamDoc.data().losses || 0) + 1 : (teamDoc.data().losses || 0),
            lastMatch: matchData.matchResult || ''
          });
        }
      }
    } catch (error) {
      console.error('Error saving match data:', error);
    }
  };

  const handleScoreButtonClick = (value, isLabel) => {
    if (gameFinished) return;

    let runsToAdd = 0;
    let isValidBall = false;
    let isDotBall = false;
    let isWide = false;
    let isNoBall = false;

    if (isLabel) {
      setActiveNumber(null);
      setActiveLabel(value);
    } else {
      setActiveLabel(null);
      setActiveNumber(value);
      isDotBall = value === 0;
    }

    // Handle pending wide
    if (pendingWide && !isLabel && typeof value === 'number') {
      setShowRunInfo(false);
      runsToAdd = 1 + value;
      setPlayerScore(prev => prev + runsToAdd);
      setCurrentOverRuns(prev => prev + runsToAdd);
      setTopPlays(prev => [...prev, `W+${value}`]);
      setCurrentOverBalls(prev => [...prev, `W+${value}`]);
      if (selectedBowler) updateBowlerStats(selectedBowler.index, false, false, runsToAdd, false, true);
      if (value % 2 !== 0) {
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
      }
      if (striker) {
        updateBatsmanScore(striker.index, value + 1);
        updateBatsmanStats(striker.index, value + 1);
      }
      setPendingWide(false);
      saveMatchData();
      return;
    }

    // Handle pending no-ball
    if (pendingNoBall && !isLabel && typeof value === 'number') {
      setShowRunInfo(false);
      runsToAdd = 1 + value;
      setPlayerScore(prev => prev + runsToAdd);
      setCurrentOverRuns(prev => prev + runsToAdd);
      setTopPlays(prev => [...prev, `NB+${value}`]);
      setCurrentOverBalls(prev => [...prev, `NB+${value}`]);
      if (striker) {
        updateBatsmanScore(striker.index, value);
        updateBatsmanStats(striker.index, value);
        updateBatsmanBalls(striker.index);
      }
      if (selectedBowler) updateBowlerStats(selectedBowler.index, false, false, runsToAdd, true);
      if (value % 2 !== 0) {
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
      }
      setPendingNoBall(false);
      saveMatchData();
      return;
    }

    // Handle pending leg-bye
    if (pendingLegBy && !isLabel && typeof value === 'number') {
      setShowRunInfo(false);
      runsToAdd = value;
      setPlayerScore(prev => prev + runsToAdd);
      setCurrentOverRuns(prev => prev + runsToAdd);
      setTopPlays(prev => [...prev, `L+${value}`]);
      setCurrentOverBalls(prev => [...prev, `L+${value}`]);
      setValidBalls(prev => prev + 1);
      isValidBall = true;
      if (striker) updateBatsmanBalls(striker.index);
      if (selectedBowler) updateBowlerStats(selectedBowler.index, false, true, runsToAdd);
      if (value % 2 !== 0) {
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
      }
      setPendingLegBy(false);
      saveMatchData();
      return;
    }

    // Handle pending out
    if (pendingOut && !isLabel && typeof value === 'number') {
      if (value !== 0 && value !== 1 && value !== 2) {
        return;
      }

      setCatchRuns(value);
      playAnimation('out');
      setTimeout(() => {
        runsToAdd = value;
        setPlayerScore(prev => prev + runsToAdd);
        setCurrentOverRuns(prev => prev + runsToAdd);
        setTopPlays(prev => [...prev, `O+${value}`]);
        setCurrentOverBalls(prev => [...prev, `O+${value}`]);
        if (striker) {
          updateBatsmanScore(striker.index, value);
          updateBatsmanStats(striker.index, value);
          updateBatsmanBalls(striker.index);
        }
        setValidBalls(prev => prev + 1);
        isValidBall = true;
        setShowOutTypeModal(true);
        saveMatchData();
      }, 5000);
      setPendingOut(false);
      return;
    }

    if (isLabel) {
      if (value === 'Wide' || value === 'No-ball' || value === 'Leg By' || value === 'OUT') {
        setShowRunInfo(true);
      } else {
        setShowRunInfo(false);
      }

      if (value === 'Wide') {
        setPendingWide(true);
        isWide = true;
        return;
      } else if (value === 'No-ball') {
        setPendingNoBall(true);
        isNoBall = true;
        return;
      } else if (value === 'Leg By') {
        setPendingLegBy(true);
        return;
      } else if (value === 'OUT' || value === 'lbw') {
        setPendingOut(true);
        return;
      }
      if (!extraBalls.includes(value)) {
        setValidBalls(prev => prev + 1);
        if (striker && value !== 'Wide' && value !== 'No-ball') {
          updateBatsmanBalls(striker.index);
        }
        saveMatchData();
      }
    } else {
      setShowRunInfo(false);
      runsToAdd = value;
      setPlayerScore(prev => prev + runsToAdd);
      setCurrentOverRuns(prev => prev + runsToAdd);
      setTopPlays(prev => [...prev, value]);
      setCurrentOverBalls(prev => [...prev, value]);
      setValidBalls(prev => prev + 1);
      isValidBall = true;
      if (striker) {
        updateBatsmanScore(striker.index, value);
        updateBatsmanStats(striker.index, value, value === 0);
        updateBatsmanBalls(striker.index);
      }
      if (selectedBowler) updateBowlerStats(selectedBowler.index, false, true, runsToAdd, isNoBall, isWide, value === 0);
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

  const handleOutTypeSelect = (type) => {
    setOutType(type);
    if (type === 'catch') {
      setShowCatcherModal(true);
    } else if (type === 'runout') {
      setShowFielderModal(true);
    } else if (type === 'bowled' || type === 'lbw') {
      recordWicketOver(striker.index, type, selectedBowler.index);
      if (selectedBowler) {
        updateBowlerStats(selectedBowler.index, true, true);
      }
      setOutCount(prev => prev + 1);
      setShowBatsmanDropdown(true);
    }
    setShowOutTypeModal(false);
  };

  const handleCatcherSelect = (player) => {
    setCatcher(player);
    recordWicketOver(striker.index, 'catch', selectedBowler.index, player.index, 'fielder');
    if (selectedBowler) {
      updateBowlerStats(selectedBowler.index, true, true);
    }
    setOutCount(prev => prev + 1);
    setShowCatcherModal(false);
    setShowBatsmanDropdown(true);
  };

  const handleFielderSelect = (player) => {
    setFielder(player);
    setShowFielderModal(false);
    setFielderRole(null);
  };

  const handleFielderRoleSelect = (role) => {
    setFielderRole(role);
    if (role === 'wicketKeeper') {
      recordWicketOver(striker.index, 'stumping', selectedBowler.index, fielder.index, role);
    } else {
      recordWicketOver(striker.index, 'runout', selectedBowler.index, fielder.index, role);
    }
    if (selectedBowler) {
      updateBowlerStats(selectedBowler.index, true, true);
    }
    setOutCount(prev => prev + 1);
    setShowBatsmanDropdown(true);
  };

  const handleCatchModalSubmit = () => {
    if (!selectedCatchType || !selectedFielder) {
      return;
    }
    recordWicketOver(
      striker.index, 
      'catch', 
      selectedBowler.index, 
      selectedFielder.index, 
      'fielder',
      selectedCatchType
    );
    if (selectedBowler) {
      updateBowlerStats(selectedBowler.index, true, true);
    }
    setOutCount(prev => prev + 1);
    setShowCatchModal(false);
    setShowBatsmanDropdown(true);
  
    playAnimation('out');
    setTimeout(() => {
      setPlayerScore(prev => prev + catchRuns);
      setTopPlays(prev => [...prev, `O+${catchRuns} (${selectedCatchType})`]);
      setCurrentOverBalls(prev => [...prev, `O+${catchRuns} (${selectedCatchType})`]);
      if (striker) {
        updateBatsmanScore(striker.index, catchRuns);
        updateBatsmanStats(striker.index, catchRuns, catchRuns === 0);
        updateBatsmanBalls(striker.index);
        recordWicket(striker.index, selectedCatchType, selectedFielder);
      }

      setValidBalls(prev => prev + 1);
      if (selectedBowler) updateBowlerStats(selectedBowler.index, true, true, catchRuns);
      setShowBatsmanDropdown(true);
      setShowCatchModal(false);
      setPendingOut(false);
      setSelectedCatchType('');
      setSelectedFielder(null);
      setCatchRuns(null);
      saveMatchData();
    }, 1000);
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
            photoUrl: player.image || '',
            role: player.role || '',
            user: player.user || 'No',
            playerId: player.playerId || '',
            userId: auth.currentUser ? auth.currentUser.uid : '',
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
            dismissalType: wicket ? wicket.type : null,
            bowlerIndex: wicket ? wicket.bowlerIndex : null,
            fielderIndex: wicket ? wicket.fielderIndex : null,
            fielderRole: wicket ? wicket.fielderRole : null,
            catchType: wicket?.catchType || null,
            fielder: wicket?.fielder || null
          };
        });
        const bowlerStatsArray = bowlingTeamPlayers.map(player => {
          const stats = bowlerStats[player.index] || {};
          return {
            index: player.index || '',
            name: player.name || 'Unknown',
            photoUrl: player.image || '',
            role: player.role || '',
            user: player.user || 'No',
            playerId: player.playerId || '',
            userId: auth.currentUser ? auth.currentUser.uid : '',
            wickets: stats.wickets || 0,
            oversBowled: stats.oversBowled || '0.0',
            runsConceded: stats.runsConceded || 0,
            maidens: stats.maidens || 0,
            noBalls: stats.noBalls || 0,
            wides: stats.wides || 0,
            dotBalls: stats.dotBalls || 0
          };
        });
        const fieldingStats = bowlingTeamPlayers.map(player => {
          const catches = wicketOvers.filter(w => 
            w.fielderIndex === player.index && w.type === 'catch'
          ).length;
          const stumpings = wicketOvers.filter(w => 
            w.fielderIndex === player.index && w.type === 'stumping' && w.fielderRole === 'wicketKeeper'
          ).length;
          const runOuts = wicketOvers.filter(w => 
            w.fielderIndex === player.index && w.type === 'runout' && w.fielderRole === 'fielder'
          ).length;
          
          return {
            index: player.index || '',
            name: player.name || 'Unknown',
            photoUrl: player.image || '',
            role: player.role || '',
            user: player.user || 'No',
            playerId: player.playerId || '',
            userId: auth.currentUser ? auth.currentUser.uid : '',
            catches,
            stumpings,
            runOuts
          };
        });
        setFirstInningsData({
          teamName: teamA?.teamName || 'Team A',
          totalScore: playerScore,
          wickets: outCount,
          overs,
          playerStats,
          bowlerStats: bowlerStatsArray,
          fieldingStats
        });
        setTargetScore(playerScore + 1);
        setIsChasing(true);
        resetInnings();
        saveMatchData();
        displayModal('Innings Break', `You need to chase ${playerScore + 1} runs`);
      } else {
        let winnerTeamName = '';
        if (playerScore < targetScore - 1) {
          winnerTeamName = teamA.teamName;
          displayModal('Match Result', `${teamA.teamName} wins by ${targetScore - 1 - playerScore} runs!`);
          setGameFinished(true);
        } else if (playerScore === targetScore - 1) {
          winnerTeamName = 'Tie';
          displayModal('Match Result', 'Match tied!');
          setGameFinished(true);
        } else {
          winnerTeamName = teamB.teamName;
          displayModal('Match Result', `${teamB.teamName} wins!`);
          setGameFinished(true);
        }
      }
      return;
    }

    if (isChasing && playerScore >= targetScore && targetScore > 0) {
      displayModal('Match Result', `${teamB.teamName} wins!`);
      setGameFinished(true);
      return;
    }

    if (validBalls === 6) {
      // Check for maiden over (all balls are dot balls with 0 runs)
      const isMaidenOver = currentOverBalls.every(ball => {
        if (typeof ball === 'number') return ball === 0;
        if (typeof ball === 'string') {
          // Exclude wides and no-balls from maiden consideration
          if (ball.toLowerCase().includes('w')) return false; // Wide
          if (ball.toLowerCase().includes('nb')) return false; // No-ball
          if (ball.toLowerCase().includes('l')) return false; // Leg byes
          return parseInt(ball.split('+')[1]) === 0; // Check if runs are 0
        }
        return false;
      });

      if (isMaidenOver && selectedBowler) {
        updateMaidenOvers(selectedBowler.index);
      }
      
      setPastOvers(prev => [...prev, currentOverBalls]);
      setCurrentOverBalls([]);
      setCurrentOverRuns(0);
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
    setCurrentOverRuns(0);
    setOutType(null);
    setCatcher(null);
    setFielder(null);
    setFielderRole(null);
    setShowCatchModal(false);
    setSelectedCatchType('');
    setSelectedFielder(null);
    setCatchRuns(null);
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
        runsConceded: prev[player.index]?.runsConceded || 0,
        maidens: prev[player.index]?.maidens || 0,
        noBalls: prev[player.index]?.noBalls || 0,
        wides: prev[player.index]?.wides || 0,
        dotBalls: prev[player.index]?.dotBalls || 0
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
    setCurrentOverBalls(prev => prev.slice(0, -1));
    setValidBalls(prev => Math.max(0, prev - 1));
    saveMatchData();
  };

  const handleModalOkClick = () => {
    setShowModal(false);

    if (gameFinished && modalContent.title === 'Match Result') {
      let winnerTeamName = '';
      if (playerScore < targetScore - 1) {
        winnerTeamName = teamA.teamName;
      } else if (playerScore === targetScore - 1) {
        winnerTeamName = 'Tie';
      } else {
        winnerTeamName = teamB.teamName;
      }

      const originPage = location.state?.origin;
      if (originPage) {
        navigate(originPage, { state: { activeTab: 'Match Results', winner: winnerTeamName, matchId } });
      } else {
        navigate('/', { state: { matchId } });
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
          backgroundImage: 'linear-gradient(140deg,#08000F 15%,#FF0077)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        {HeaderComponent ? <HeaderComponent /> : <div className="text-white">Header Missing</div>}

        {/* Animation Overlay */}
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

        {currentView === 'toss' && !striker && !nonStriker && !bowlerVisible && !showThirdButtonOnly && (
          <button
            onClick={goBack}
            className="absolute left-4 top-24 md:left-10 md:flex items-center justify-center w-10 h-10 z-10"
          >
            <img
              alt="Back"
              className="w-6 h-6 transform rotate-180 mb-5"
              src={backButton}
            />
          </button>
        )}

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

        {/* Out Type Selection Modal */}
        {showOutTypeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#4C0025] p-6 rounded-lg max-w-md w-full">
              <h3 className="text-white text-xl font-bold mb-4">Select Out Type</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleOutTypeSelect('catch')}
                  className="w-full h-12 bg-[#FF62A1] text-white font-bold text-lg rounded-lg border-2 border-white"
                >
                  Catch
                </button>
                <button
                  onClick={() => handleOutTypeSelect('bowled')}
                  className="w-full h-12 bg-[#FF62A1] text-white font-bold text-lg rounded-lg border-2 border-white"
                >
                  Bowled
                </button>
                <button
                  onClick={() => handleOutTypeSelect('runout')}
                  className="w-full h-12 bg-[#FF62A1] text-white font-bold text-lg rounded-lg border-2 border-white"
                >
                  Run Out
                </button>
                <button
                  onClick={() => handleOutTypeSelect('lbw')}
                  className="w-full h-12 bg-[#FF62A1] text-white font-bold text-lg rounded-lg border-2 border-white"
                >
                  LBW
                </button>
                <button
                  onClick={() => {
                    setShowOutTypeModal(false);
                    setPendingOut(false);
                    setTopPlays(prev => prev.slice(0, -1));
                    setCurrentOverBalls(prev => prev.slice(0, -1));
                    setValidBalls(prev => Math.max(0, prev - 1));
                  }}
                  className="w-full h-12 bg-red-600 text-white font-bold text-lg rounded-lg border-2 border-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showCatchModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#4C0025] p-4 md:p-6 rounded-lg max-w-md w-full mx-4 relative">
              <button
                onClick={() => {
                  setShowCatchModal(false);
                  setSelectedCatchType('');
                  setSelectedFielder(null);
                  setCatchRuns(null);
                  setPendingOut(false);
                }}
                className="absolute top-2 right-2 w-6 h-6 text-white font-bold flex items-center justify-center text-xl"
              >
                ×
              </button>
              <h3 className="text-white text-lg md:text-xl font-bold mb-4">Select Catch Details</h3>
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
              <div className="mb-4">
                <label className="text-white block mb-2">Fielder</label>
                <select
                  value={selectedFielder?.index || ''}
                  onChange={(e) => {
                    const fielder = bowlingTeamPlayers.find(p => p.index === e.target.value);
                    setSelectedFielder(fielder);
                  }}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                >
                  <option value="">Select Fielder</option>
                  {bowlingTeamPlayers.map(player => (
                    <option key={player.index} value={player.index}>{player.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleCatchModalSubmit}
                  disabled={!selectedCatchType || !selectedFielder}
                  className={`w-40 h-12 text-white font-bold text-lg rounded-lg border-2 border-white ${
                    selectedCatchType && selectedFielder ? 'bg-[#FF62A1] hover:bg-[#FF62A1]/80' : 'bg-gray-500 cursor-not-allowed'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Catcher Selection Modal */}
        {showCatcherModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#4C0025] p-6 rounded-lg max-w-md w-full">
              <h3 className="text-white text-xl font-bold mb-4">Select Catcher</h3>
              <div className="grid grid-cols-2 gap-4">
                {bowlingTeamPlayers.map(player => (
                  <div
                    key={player.index}
                    onClick={() => handleCatcherSelect(player)}
                    className="cursor-pointer flex flex-col items-center text-white text-center  p-2 hover:bg-[#FF62A1] rounded-lg"
                  >
                    {getPlayerImage(player, 'w-12 h-12 md:w-16 md:h-16')}
                    <span className="text-xs md:text-sm">{player.name}</span>
                    <span className="text-xs">{player.role}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowCatcherModal(false);
                  setShowOutTypeModal(true);
                }}
                className="w-full h-12 mt-4 bg-red-600 text-white font-bold text-lg rounded-lg border-2 border-white"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Fielder Selection Modal */}
        {showFielderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#4C0025] p-6 rounded-lg max-w-md w-full">
              <h3 className="text-white text-xl font-bold mb-4">Select Fielder</h3>
              <div className="grid grid-cols-2 gap-4">
                {bowlingTeamPlayers.map(player => (
                  <div
                    key={player.index}
                    onClick={() => handleFielderSelect(player)}
                    className="cursor-pointer flex flex-col items-center text-white text-center p-2 hover:bg-[#FF62A1] rounded-lg"
                  >
                    {getPlayerImage(player, 'w-12 h-12 md:w-16 md:h-16')}
                    <span className="text-xs md:text-sm">{player.name}</span>
                    <span className="text-xs">{player.role}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowFielderModal(false);
                  setShowOutTypeModal(true);
                }}
                className="w-full h-12 mt-4 bg-red-600 text-white font-bold text-lg rounded-lg border-2 border-white"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Fielder Role Selection Modal */}
        {fielder && !fielderRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#4C0025] p-6 rounded-lg max-w-md w-full">
              <h3 className="text-white text-xl font-bold mb-4">Select Fielder Role</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleFielderRoleSelect('wicketKeeper')}
                  className="w-full h-12 bg-[#FF62A1] text-white font-bold text-lg rounded-lg border-2 border-white"
                >
                  Wicket Keeper
                </button>
                <button
                  onClick={() => handleFielderRoleSelect('fielder')}
                  className="w-full h-12 bg-[#FF62A1] text-white font-bold text-lg rounded-lg border-2 border-white"
                >
                  Fielder
                </button>
              </div>
              <button
                onClick={() => {
                  setFielder(null);
                  setShowFielderModal(true);
                }}
                className="w-full h-12 mt-4 bg-red-600 text-white font-bold text-lg rounded-lg border-2 border-white"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {(currentView !== 'toss' || striker || nonStriker || bowlerVisible || showThirdButtonOnly) && (
          <button
            onClick={goBack}
            className="absolute left-4 top-24 md:left-10 md:top-32 z-10 w-10 h-10 flex items-center justify-center"
          >
            <img src={backButton} alt="Back" className="w-6 h-6 transform rotate-180 mb-5" onError={(e) => (e.target.src = '')} />
          </button>
        )}

        {showThirdButtonOnly && (
          <div id="start" className="relative flex flex-col w-full h-full items-center px-4 mt-20 md:mt-10">
            <h2 className="gap-5 text-4xl md:text-3xl lg:text-5xl text-white font-bold text-center">Score Board</h2>
            <div className="mt-4 flex flex-col md:flex-row w-full md:w-1/2 justify-around gap-20 h-fit pt-2">
              <div className="flex items-center justify-center mb-4 md:mb-0">
                {getTeamFlag(isChasing ? teamB : teamA)}
                <div className="ml-4 md:ml-10">
                  <h3 className="text-sm md:text-2xl lg:text-4xl text-white font-bold text-center">
                    {playerScore} - {outCount}
                    <h2 className="text-base md:text-lg lg:text-xl">{overNumber > maxOvers ? maxOvers : overNumber - 1}.{validBalls}</h2>
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-center mb-4 md:mb-0">
                <div className="mr-4 md:mr-10">
                  <h3 className="text-lg md:text-2xl lg:text-4xl text-white font-bold text-center text-yellow-300 underline">
                    {isChasing ? `Target: ${targetScore}` : 'Not yet'}
                  </h3>
                </div>
                {getTeamFlag(isChasing ? teamA : teamB)}
              </div>
            </div>

            <div className="mt-2 flex flex-col md:flex-row w-full md:w-[45%] justify-between relative">
              <div className="flex flex-row px-[4.8%] md:p-0 justify-between md:flex-row md:items-center gap-4 md:gap-8 mb-4 md:mb-0">
                <div className="text-white text-center">
                  <h3 className={`text-lg md:text-xl font-bold ${striker ? 'text-yellow-300' : 'text-gray-400'}`}>Striker</h3>
                  {striker && (
                    <div className="flex flex-col items-center w-full">
                      <div className="font-bold text-sm md:text-base">{striker.name}</div>
                      <div className="text-xs md:text-sm">{striker.role}</div>
                      <div className="text-xs md:text-sm">
                        {batsmenScores[striker.index] || 0} ({batsmenBalls[striker.index] || 0})
                        <span className="text-yellow-300"> SR: {getStrikeRate(striker.index)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="hidden sm:block text-white text-center">
                  <h3 className={`text-lg md:text-xl font-bold ${!striker ? 'text-yellow-300' : 'text-gray-400'}`}>Non-Striker</h3>
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
                      {bowlerStats[selectedBowler.index] && (
                        <div className="text-xs">
                          {bowlerStats[selectedBowler.index].oversBowled} - {bowlerStats[selectedBowler.index].runsConceded} - {bowlerStats[selectedBowler.index].wickets}
                          {bowlerStats[selectedBowler.index].maidens > 0 && (
                            <span className="text-yellow-300"> (M: {bowlerStats[selectedBowler.index].maidens})</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="hidden sm:block w-20 text-white text-center font-weight-bold">
                <h3 className="text-lg md:text-xl font-bold">Bowler</h3>
                {selectedBowler && (
                  <div className="flex flex-col items-center">
                    <div className="font-bold text-sm md:text-base">{selectedBowler.name}</div>
                    <div className="text-xs md:text-sm">{selectedBowler.role}</div>
                    {bowlerStats[selectedBowler.index] && (
                      <div className="text-xs">
                        {bowlerStats[selectedBowler.index].oversBowled} - {bowlerStats[selectedBowler.index].runsConceded} - {bowlerStats[selectedBowler.index].wickets}
                        {bowlerStats[selectedBowler.index].maidens > 0 && (
                          <span className="text-yellow-300"> (M: {bowlerStats[selectedBowler.index].maidens})</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="absolute right-0 md:right-4 lg:right-8 xl:right-12 2xl:right-20 top-0 md:top-4">
              <button
                onClick={() => setShowPastOvers(!showPastOvers)}
                className="w-24 md:w-32 h-10 md:h-12 bg-[#4C0025] text-white font-bold text-sm md:text-lg rounded-lg border-2 border-white"
              >
                {showPastOvers ? 'Hide Overs' : 'Show Overs'}
              </button>
              {showPastOvers && (
                <div className="mt-2 md:mt-4 text-white w-48 md:w-64 absolute right-0">
                  <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-4 text-center">Overs History</h3>
                  <div className="bg-[#4C0025] p-3 rounded-lg w-full max-h-48 md:max-h-64 overflow-y-auto">
                    {[...pastOvers, currentOverBalls.length > 0 ? currentOverBalls : null]
                      .filter(Boolean)
                      .reverse()
                      .map((over, index) => (
                        <div key={index} className="mb-2">
                          <div className="text-sm md:text-base font-bold text-yellow-300">
                            Over {pastOvers.length - index}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {over.map((ball, ballIndex) => {
                              let displayBall = ball;
                              if (typeof ball === 'string' && ball.includes('+')) {
                                const [type, runs] = ball.split('+');
                                if (type.toLowerCase() === 'w') displayBall = `Wd+${runs}`;
                                else if (type.toLowerCase() === 'nb') displayBall = `Nb+${runs}`;
                                else if (type.toLowerCase() === 'o') displayBall = `W+${runs}`;
                                else if (type.toLowerCase() === 'l') displayBall = `L+${runs}`;
                                else displayBall = `${type}+${runs}`;
                              }
                              const isWicket = typeof ball === 'string' && (ball.toLowerCase().includes('o') || ball.toLowerCase().includes('w'));
                              return (
                                <div
                                  key={`ball-${ballIndex}`}
                                  className={`w-6 h-6 flex items-center justify-center rounded-full px-1 text-xs md:text-sm whitespace-nowrap ${isWicket ? 'bg-red-600' : 'bg-[#FF62A1]'}`}
                                >
                                  {displayBall}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2 md:gap-4">
              {[0, 1, 2, 3, 4, 6].map((num) => {
                const isActive = activeNumber === num;
                return (
                  <button
                    key={num}
                    onClick={() => handleScoreButtonClick(num)}
                    className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 ${isActive ? 'bg-green-500' : 'bg-[#4C0025] hover:bg-green-600'} text-white font-bold text-lg md:text-xl rounded-full border-2 border-white flex items-center justify-center transition-colors duration-300 ${pendingOut && (num === 4 || num === 6) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={pendingOut && (num === 4 || num === 6)}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex flex-wrap justify-center gap-2 md:gap-4">
              {['Wide', 'No-ball', 'OUT', 'Leg By', 'lbw'].map((label) => {
                const isActive = activeLabel === label;
                return (
                  <button
                    key={label}
                    onClick={() => handleScoreButtonClick(label, true)}
                    className={`w-20 h-10 md:w-24 md:h-12 ${isActive ? 'bg-red-600' : 'bg-[#4C0025] hover:bg-red-400'} text-white font-bold text-sm md:text-lg rounded-lg border-2 border-white flex items-center justify-center transition-colors duration-300`}
                  >
                    {label}
                  </button>
                );
              })}
              {/* <div  className="mt-12">
                                <motion.button
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
                                  
                          <div >
                                 {isAICompanionOpen && (
                                  <AIMatchCompanionModal
                                    isOpen={isAICompanionOpen}
                                    predictionData={predictionData}
                                  />
                                )}
                              </div>
              
            </div>
            {showRunInfo && (
              <p className="text-yellow-400 text-sm mt-2 text-center font-medium">
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
                        {getPlayerImage(player, 'w-12 h-12 md:w-16 md:h-16')}
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
                        {getPlayerImage(player, 'w-12 h-12 md:w-16 md:h-16')}
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

        {currentView === 'toss' && !showThirdButtonOnly && (
          <div className="flex flex-col items-center">
            <div id="toss" className="text-center mb-4">
              <h2 className="text-white font-bold text-3xl md:text-[3rem] mt-20 md:mt-6">
                {bowlerVisible ? (isChasing ? teamA.teamName : teamB.teamName) : (isChasing ? teamB.teamName : teamA.teamName)}
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
                      <div className="relative text-white text-center mt-2">
                        <div className="inline-block">
                          {getPlayerImage(striker)}
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
                      <div className="relative text-white text-center mt-2">
                        <div className="inline-block">
                          {getPlayerImage(nonStriker)}
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
      <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full border-[5px] border-[#F0167C] overflow-hidden flex items-center justify-center">
        {getPlayerImage(player)}
      </div>
      <span className="mt-2 font-bold text-sm sm:text-base md:text-lg">{player.name}</span>
      <h2 className="text-xs sm:text-sm font-light">{player.role}</h2>
    </div>
  ))}
</div>
            )}

            {striker && nonStriker && !bowlerVisible && (
              <button
                id="choosebowler"
                onClick={() => setBowlerVisible(true)}
                className="w-30 rounded-3xl h-10 mt-4 bg-black text-white font-bold text-sm shadow-lg bg-[url('../assets/kumar/button.png')] transform transition duration-200 hover:scale-105 hover:shadow-xl active:scale-95 active:shadow-md"
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
                {getPlayerImage(selectedBowler)}
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
      <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full border-[5px] border-[#12BFA5] overflow-hidden flex items-center justify-center">
        {getPlayerImage(player)}
      </div>
      <span className="mt-2 font-bold text-sm sm:text-base md:text-lg">{player.name}</span>
      <h2 className="text-xs sm:text-sm font-light">{player.role}</h2>
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
              className="w-40 h-14 text-white text-lg font-bold bg-[url('../assets/kumar/button.png')] bg-cover bg-center shadow-lg"
            >
              Start Chase
            </button>
          </div>
        )}
        {showMainWheel && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="relative bg-white p-6 rounded-lg w-[90%] max-w-3xl mx-auto">
              <button
                onClick={() => setShowMainWheel(false)}
                className="absolute top-8 right-8 bg-black text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-800 transition"
              >
                ✕
              </button>
              <MainWheel
                run={selectedRun}
                onClose={() => setShowMainWheel(false)}
              />
            </div>
          </div>
        )}
      </section>
      <style jsx>{`
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </ErrorBoundary>
  );
}

export default StartMatchPlayers;