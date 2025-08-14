import React, { useState, useEffect, Component } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeaderComponent from '../components/kumar/startMatchHeader';
import flag1 from '../assets/kumar/Netherland.png';
import flag2 from '../assets/kumar/ukraine.png';
import btnbg from '../assets/kumar/button.png';
import backButton from '../assets/kumar/right-chevron.png';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Player } from '@lottiefiles/react-lottie-player';
// Replace these with your actual local animation file paths
import sixAnimation from '../assets/Animation/six.json';
import fourAnimation from '../assets/Animation/four.json';
import outAnimation from '../assets/Animation/out.json';

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

function StartMatchPlayers({initialTeamA, initialTeamB, origin, onMatchEnd, currentFixture }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract all relevant data from location.state
  const originPage = location.state?.origin;
  const maxOvers = location.state?.overs;
  const teamA = location.state?.teamA;
  const teamB = location.state?.teamB;
  const selectedPlayersFromProps = location.state?.selectedPlayers || { left: [], right: [] };

  const [playedOvers, setplayedOvers] = useState(0);
  const [playedWickets, setplayedWickets] = useState(0);

  const [currentView, setCurrentView] = useState('toss');
  const [showThirdButtonOnly, setShowThirdButtonOnly] = useState(false);
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

  // Dynamic player data
  const [battingTeamPlayers, setBattingTeamPlayers] = useState([]);
  const [bowlingTeamPlayers, setBowlingTeamPlayers] = useState([]);

  useEffect(() => {
    if (!teamA || !teamB || !selectedPlayersFromProps.left || !selectedPlayersFromProps.right) {
      console.error("Missing match data in location state. Redirecting.");
      navigate('/');
      return;
    }

    if (!isChasing) {
      setBattingTeamPlayers(selectedPlayersFromProps.left.map((player, index) => ({
        ...player,
        index: player.name + index
      })));
      setBowlingTeamPlayers(selectedPlayersFromProps.right.map((player, index) => ({
        ...player,
        index: player.name + index
      })));
    } else {
      setBattingTeamPlayers(selectedPlayersFromProps.right.map((player, index) => ({
        ...player,
        index: player.name + index
      })));
      setBowlingTeamPlayers(selectedPlayersFromProps.left.map((player, index) => ({
        ...player,
        index: player.name + index
      })));
    }
    
    setStriker(null);
    setNonStriker(null);
    setSelectedBowler(null);
    setSelectedBatsmenIndices([]);
    setBatsmenScores({});
    setBatsmenBalls({});
  }, [isChasing, selectedPlayersFromProps, teamA, teamB, navigate]);

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
    navigate(-1);
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

  const playAnimation = (type) => {
    setAnimationType(type);
    setShowAnimation(true);
    setTimeout(() => {
      setShowAnimation(false);
    }, 3000); // Animation duration
  };

  const handleScoreButtonClick = (value, isLabel) => {
    if (gameFinished) return;

    if (isLabel) {
      setActiveNumber(null);
      setActiveLabel(value);
    } else {
      setActiveLabel(null);
      setActiveNumber(value);
    }

    // Handle pending actions first
    if (pendingWide && !isLabel && typeof value === 'number') {
      setPlayerScore(prev => prev + value + 1);
      setTopPlays(prev => [...prev, `W+${value}`]);
      setCurrentOverBalls(prev => [...prev, `W+${value}`]);
      if (striker) updateBatsmanScore(striker.index, value + 1);
      setPendingWide(false);
      return;
    }

    if (pendingNoBall && !isLabel && typeof value === 'number') {
      setPlayerScore(prev => prev + value + 1);
      setTopPlays(prev => [...prev, `NB+${value}`]);
      setCurrentOverBalls(prev => [...prev, `NB+${value}`]);
      if (striker) updateBatsmanScore(striker.index, value + 1);
      setPendingNoBall(false);
      return;
    }

    if (pendingLegBy && !isLabel && typeof value === 'number') {
      setPlayerScore(prev => prev + value);
      setTopPlays(prev => [...prev, `L+${value}`]);
      setCurrentOverBalls(prev => [...prev, `L+${value}`]);
      if (striker) updateBatsmanScore(striker.index, value);
      setPendingLegBy(false);
      setValidBalls(prev => prev + 1);
      if (striker) updateBatsmanBalls(striker.index);
      if (value % 2 !== 0) {
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
      }
      return;
    }

    if (pendingOut && !isLabel && typeof value === 'number') {
      playAnimation('out');
      setTimeout(() => {
        setPlayerScore(prev => prev + value);
        setTopPlays(prev => [...prev, `O+${value}`]);
        setCurrentOverBalls(prev => [...prev, `O+${value}`]);
        if (striker) updateBatsmanScore(striker.index, value);
        setValidBalls(prev => prev + 1);
        if (striker) updateBatsmanBalls(striker.index);
        setShowBatsmanDropdown(true);
      }, 5000);
      setPendingOut(false);
      return;
    }

    const extraBalls = ['No-ball', 'Wide', 'No ball'];
    const playValue = typeof value === 'string' ? value.charAt(0) : value;

    if (isLabel) {
      if (value === 'Wide' || value === 'No-ball' || value === 'Leg By'|| value === 'OUT') {
        setShowRunInfo(true);
      } else {
        setShowRunInfo(false);
      }

      if (value === 'Six') {
        playAnimation('six');
        setPlayerScore(prev => prev + 6);
        setTopPlays(prev => [...prev, 6]);
        setCurrentOverBalls(prev => [...prev, 6]);
        if (striker) updateBatsmanScore(striker.index, 6);
        setValidBalls(prev => prev + 1);
        if (striker) updateBatsmanBalls(striker.index);
      } else if (value === 'Four') {
        playAnimation('four');
        setPlayerScore(prev => prev + 4);
        setTopPlays(prev => [...prev, 4]);
        setCurrentOverBalls(prev => [...prev, 4]);
        if (striker) updateBatsmanScore(striker.index, 4);
        setValidBalls(prev => prev + 1);
        if (striker) updateBatsmanBalls(striker.index);
      } else if (value === 'Wide') {
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

      if (!extraBalls.includes(value)) {
        setValidBalls(prev => prev + 1);
        if (striker && value !== 'Wide' && value !== 'No-ball') {
          updateBatsmanBalls(striker.index);
        }
      }
    } else {
      setShowRunInfo(false);
      setPlayerScore(prev => prev + value);
      setTopPlays(prev => [...prev, value]);
      setCurrentOverBalls(prev => [...prev, value]);
      setValidBalls(prev => prev + 1);
      if (striker) {
        updateBatsmanScore(striker.index, value);
        updateBatsmanBalls(striker.index);
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
  if (gameFinished) return;

  if (outCount >= 10 || (validBalls === 6 && overNumber > maxOvers -1)) {
    if (!isChasing) {
      setTargetScore(playerScore + 1);
      setIsChasing(true);
      resetInnings();
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
    }
    return;
  }

  if (isChasing && playerScore >= targetScore && targetScore > 0) {
    displayModal('Match Result', `${teamB.name} wins by ${10 - outCount} wickets!`);
    setGameFinished(true);
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
    setGameFinished(false);
    setPendingWide(false);
    setPendingNoBall(false);
    setPendingOut(false);
    setPendingLegBy(false);
    setActiveLabel(null);
    setActiveNumber(null);
    setShowRunInfo(false);
  };

  const resetGame = () => {
    resetInnings();
    setIsChasing(false);
    setTargetScore(0);
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
    } else if (!nonStriker && striker.index !== player.index) {
      setNonStriker(player);
      setSelectedBatsmenIndices(prev => [...prev, player.index]);
      setBatsmenScores(prev => ({ ...prev, [player.index]: 0 }));
      setBatsmenBalls(prev => ({ ...prev, [player.index]: 0 }));
    }
  };

  const handleBowlerSelect = (player) => {
    setSelectedBowler(player);
    setShowBowlerDropdown(false);
  };

  const handleBatsmanSelect = (player) => {
    setStriker(player);
    setSelectedBatsmenIndices(prev => [...prev, player.index]);
    setShowBatsmanDropdown(false);
    setBatsmenScores(prev => ({ ...prev, [player.index]: 0 }));
    setBatsmenBalls(prev => ({ ...prev, [player.index]: 0 }));
    setOutCount(prev => prev + 1);
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
    setNonStriker(null);
  };

  const cancelBatsmanDropdown = () => {
    setShowBatsmanDropdown(false);
    setPendingOut(false);
    setTopPlays(prev => prev.slice(0, -1));
    setCurrentOverBalls(prev => prev.slice(0, -1));
    setValidBalls(prev => Math.max(0, prev - 1));
  };

  const handleModalOkClick = () => {
  setShowModal(false);

  if (gameFinished && modalContent.title === 'Match Result') {
    let winnerTeamName = '';
    let winningDifference = '';
    
    if (playerScore < targetScore - 1) {
      winnerTeamName = teamA.name;
      winningDifference = `${targetScore - 1 - playerScore} runs`;
    } else if (playerScore === targetScore - 1) {
      winnerTeamName = 'Tie';
      winningDifference = 'Tie';
    } else {
      winnerTeamName = teamB.name;
      winningDifference = `${10 - outCount} wickets`;
    }

    if (currentFixture?.id) {
      markFixtureAsCompleted(currentFixture.id);
    }

    const originPage = location.state?.origin;
    if (originPage) {
      navigate(originPage, { 
        state: { 
          activeTab: 'Match Results', 
          winner: winnerTeamName,
          winningDifference: winningDifference,
          completedFixtureId: currentFixture?.id,
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
            className="absolute left-4 top-24 md:left-10 md:top-32 z-10 w-10 h-10 flex items-center justify-center"
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

        {(currentView !== 'toss' || striker || nonStriker || bowlerVisible || showThirdButtonOnly) && (
          <button
            onClick={goBack}
            className="absolute left-4 top-24 md:left-10 md:top-32 z-10 w-10 h-10 flex items-center justify-center"
          >
            <img src={backButton} alt="Back" className="w-6 h-6 transform rotate-180 mb-5" onError={(e) => (e.target.src = '')} />
          </button>
        )}

        {!showThirdButtonOnly && (
          <div className=""></div>
        )}

        {currentView === 'toss' && !showThirdButtonOnly && (
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
                        <div className=" inline-block">
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
                    <div className="w-20 h-20 md:w-15 md:h-15 lg:w-15 lg:h-15 rounded-full border-[5px] border-[#F0167C] overflow-hidden flex items-center justify-center aspect-square">
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
            <h2 className="gap-5 text-4xl md:text-3xl lg:text-5xl text-white font-bold text-center">Score Board</h2>
            <div className="mt-4 flex md:flex-row w-full md:w-1/2 justify-around gap-20 h-fit pt-2">
              <div className="flex items-center justify-center mb-4 md:mb-0">
                <img
                  src={isChasing ? teamB.flagUrl : teamA.flagUrl} 
                  className="w-16 h-16 md:w-30 md:h-30 aspect-square"
                  alt="Flag"
                  onError={(e) => (e.target.src = '')}
                />
                <div className="ml-4 md:ml-10">
                  <h3 className="text-sm md:text-2xl md:text-3xl lg:text-4xl text-white font-bold text-center">
                    {playerScore} - {outCount}
                    <h2 className="text-base md:text-lg lg:text-xl">{overNumber > maxOvers ? maxOvers : overNumber - 1}.{validBalls}</h2>
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-center mb-4 md:mb-0">
                <div className="mr-4 md:mr-10">
                  <h3 className="text-lg md:text-2xl md:text-3xl lg:text-4xl text-white font-bold text-center text-yellow-300 underline">
                    {isChasing ? `Target: ${targetScore}` : 'Not yet'}
                  </h3>
                </div>
                <img
                  src={isChasing ? teamA.flagUrl : teamB.flagUrl} 
                  className="w-16 h-16 md:w-30 md:h-30 aspect-square"
                  alt="Flag"
                  onError={(e) => (e.target.src = '')}
                />
              </div>
            </div>

            <div className="w-full flex flex-col md:justify-between md:flex-row md:w-[50%] justify-around mt-2 md:pr-15">
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
                <div className="sm:hidden text-white text-center md:ml-10">
                  <h3 className="text-lg md:text-xl font-bold">Bowler</h3>
                  {selectedBowler && (
                    <div className="flex flex-col items-center">
                      <div className="font-bold text-sm md:text-base">{selectedBowler.name}</div>
                      <div className="text-xs md:text-sm">{selectedBowler.role}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col justify-center items-center w-full md:w-[20%] mb-4 md:mb-0">
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowPastOvers(!showPastOvers)}
                    className="w-24 md:w-32 h-10 md:h-12 bg-[#4C0025] text-white font-bold text-sm md:text-lg rounded-lg border-2 border-white"
                  >
                    {showPastOvers ? 'Hide Overs' : 'Show Overs'}
                  </button>
                </div>
        {showPastOvers && (
  <div className="mt-2 md:mt-4 text-white w-full">
    <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-4 text-center">Overs History</h3>
    <div className="bg-[#4C0025] p-3 rounded-lg w-full overflow-auto max-w-full" style={{ minHeight: '100px' }}>
      <div className="flex items-center gap-3 min-w-[768px] overflow-x-auto">
        {[...pastOvers, currentOverBalls.length > 0 ? currentOverBalls : null]
          .filter(Boolean)
          .map((over, index) => (
            <div key={`over-${index}`} className="flex items-center gap-1">
              {over.map((ball, ballIndex) => {
                let displayBall = ball;
                if (typeof ball === 'string' && ball.includes('+')) {
                  const [type, runs] = ball.split('+');
                  if (type.toLowerCase() === 'wd') displayBall = `Wd+${runs}`;
                  else if (type.toLowerCase() === 'nb') displayBall = `Nb+${runs}`;
                  else if (type.toLowerCase() === 'w') displayBall = `W+${runs}`;
                  else displayBall = `${type}+${runs}`;
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
              {/* Add | only if not the last over */}
              {index !== pastOvers.length + (currentOverBalls.length > 0 ? 0 : -1) && (
                <span className="text-white font-bold text-lg px-1">|</span>
              )}
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

            <div className="mt-4 flex flex-wrap justify-center gap-2 md:gap-4">
              {[0, 1, 2, 4, 6].map((num) => {
                const isActive = activeNumber === num;
                return (
                  <button
                    key={num}
                    onClick={() => handleScoreButtonClick(num)}
                    className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
                      ${isActive ? 'bg-green-500' : 'bg-[#4C0025] hover:bg-green-300'}
                      text-white font-bold text-lg md:text-xl rounded-full border-2 border-white
                      flex items-center justify-center transition-colors duration-300`}
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
                    className={`w-20 h-10 md:w-24 md:h-12
                      ${isActive ? 'bg-red-600' : 'bg-[#4C0025] hover:bg-red-400'}
                      text-white font-bold text-sm md:text-lg rounded-lg border-2 border-white
                      flex items-center justify-center transition-colors duration-300`}
                  >
                    {label}
                  </button>
                );
              })}
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
                    {bowlingTeamPlayers.filter(player => player.index !== selectedBowler?.index).map((player) => ( // Filter out current bowler
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
                setTargetScore(playerScore + 1); // Target is one run more than the score
                setplayedOvers(overNumber);
                setplayedWickets(outCount);
                resetInnings();
                handleButtonClick('toss');
              }}
              className="w-40 h-14 text-white text-lg font-bold bg-[url('../assets/button.png')] bg-cover bg-center shadow-lg"
            >
              Start Chase
            </button>
          </div>
        )}
      </section>
    </ErrorBoundary>
  );
}

export default StartMatchPlayers;