import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase'; // Adjust path to your Firebase config
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import logo from '../../assets/pawan/PlayerProfile/picture-312.png';
import bgImg from '../../assets/sophita/HomePage/advertisement5.jpeg';
import PitchAnalyzer from '../../components/sophita/HomePage/PitchAnalyzer';

const PlayerSelector = ({ teamA, teamB, overs, origin, matchId, currentPhase, tournamentId }) => {
  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState({ left: [], right: [] });
  const navigate = useNavigate();

  const playersTeamAData = teamA?.players || [];
  const playersTeamBData = teamB?.players || [];

  const filteredLeftPlayers = playersTeamAData.filter(player =>
    player.name.toLowerCase().includes(leftSearch.toLowerCase())
  );
  const filteredRightPlayers = playersTeamBData.filter(player =>
    player.name.toLowerCase().includes(rightSearch.toLowerCase())
  );

  const togglePlayerSelection = (side, player) => {
    setSelectedPlayers(prev => {
      const newSelection = { ...prev };
      if (newSelection[side].includes(player)) {
        newSelection[side] = newSelection[side].filter(p => p !== player);
      } else {
        if (newSelection[side].length < 11) {
          newSelection[side] = [...newSelection[side], player];
        }
      }
      return newSelection;
    });
  };

  const handleActualStartMatch = () => {
    if (selectedPlayers.left.length !== 11 || selectedPlayers.right.length !== 11) {
      alert("Please select exactly 11 players for each team before starting the match.");
      return;
    }

    console.log('Origin being passed to StartMatchPlayers:', origin);
    navigate('/StartMatchPlayersKO', {
      state: {
        overs: overs,
        teamA: teamA,
        teamB: teamB,
        selectedPlayers: selectedPlayers,
        origin: origin,
        matchId: matchId,
        currentPhase: currentPhase,
        tournamentId: tournamentId
      }
    });
  };

  return (
    <div
      className="w-full relative py-8"
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        height: '100vh',
      }}
    >
      <div className="w-full px-4 md:px-8 pb-8 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-5xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 bg-opacity-90 rounded-xl shadow-xl border border-blue-100"
        >
          <h1 className="text-4xl font-bold mb-6 text-black">Select Players</h1>

          <div className="flex flex-col md:flex-row gap-8">
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl font-semibold text-blue-800">{teamA?.name || 'Team A'}</span>
                {teamA?.flagUrl && (
                    <img src={teamA.flagUrl} alt={`${teamA.name} Flag`} className="w-8 h-6 object-cover rounded-sm" />
                )}
                <span className="ml-auto text-lg font-bold text-blue-700">
                  Selected: {selectedPlayers.left.length}/11
                </span>
              </div>

              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Players..."
                    className="w-full p-3 pl-10 border-2 border-blue-200 rounded-lg mb-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-black"
                    value={leftSearch}
                    onChange={(e) => setLeftSearch(e.target.value)}
                  />
                  <svg
                    className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                <div className="border-2 border-blue-100 rounded-lg max-h-60 overflow-y-auto bg-white">
                  {filteredLeftPlayers.length === 0 ? (
                      <p className="p-3 text-gray-500">No players found or team has no players.</p>
                  ) : (
                    filteredLeftPlayers.map((player, index) => {
                      const isSelected = selectedPlayers.left.includes(player);
                      const isSelectionDisabled = selectedPlayers.left.length >= 11 && !isSelected;

                      return (
                        <motion.div
                          key={player.name}
                          className={`p-3 border-b border-blue-50 last:border-b-0 transition-colors duration-200 flex items-center ${
                            isSelected
                              ? 'bg-blue-100 font-medium'
                              : 'hover:bg-blue-50'
                          } ${isSelectionDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          onClick={isSelectionDisabled ? null : () => togglePlayerSelection('left', player)}
                          whileHover={isSelectionDisabled ? {} : { scale: 1.01 }}
                        >
                          {player.photoUrl && (
                              <img src={player.photoUrl} alt={player.name} className="w-8 h-8 rounded-full object-cover mr-3 border border-gray-300" />
                          )}
                          <span className="text-blue-800">{player.name}</span>
                          {player.role && <span className="ml-2 text-sm text-gray-500">({player.role})</span>}
                          {isSelected && (
                            <span className="float-right text-blue-600 ml-auto">✓</span>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div className="flex-1" whileHover={{ scale: 1.02 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl font-semibold text-indigo-800">{teamB?.name || 'Team B'}</span>
                {teamB?.flagUrl && (
                    <img src={teamB.flagUrl} alt={`${teamB.name} Flag`} className="w-8 h-6 object-cover rounded-sm" />
                )}
                <span className="ml-auto text-lg font-bold text-indigo-700">
                  Selected: {selectedPlayers.right.length}/11
                </span>
              </div>

              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Players..."
                    className="w-full p-3 pl-10 border-2 border-indigo-200 rounded-lg mb-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-black"
                    value={rightSearch}
                    onChange={(e) => setRightSearch(e.target.value)}
                  />
                  <svg
                    className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                <div className="border-2 border-indigo-100 rounded-lg max-h-60 overflow-y-auto bg-white">
                  {filteredRightPlayers.length === 0 ? (
                      <p className="p-3 text-gray-500">No players found or team has no players.</p>
                  ) : (
                    filteredRightPlayers.map((player, index) => {
                      const isSelected = selectedPlayers.right.includes(player);
                      const isSelectionDisabled = selectedPlayers.right.length >= 11 && !isSelected;

                      return (
                        <motion.div
                          key={player.name}
                          className={`p-3 border-b border-indigo-50 last:border-b-0 transition-colors duration-200 flex items-center ${
                            isSelected
                              ? 'bg-indigo-100 font-medium'
                              : 'hover:bg-indigo-50'
                          } ${isSelectionDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          onClick={isSelectionDisabled ? null : () => togglePlayerSelection('right', player)}
                          whileHover={isSelectionDisabled ? {} : { scale: 1.01 }}
                        >
                          {player.photoUrl && (
                              <img src={player.photoUrl} alt={player.name} className="w-8 h-8 rounded-full object-cover mr-3 border border-gray-300" />
                          )}
                          <span className="text-blue-800">{player.name}</span>
                          {player.role && <span className="ml-2 text-sm text-gray-500">({player.role})</span>}
                          {isSelected && (
                            <span className="float-right text-indigo-600 ml-auto">✓</span>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-8 pt-4 border-t border-blue-200">
            <motion.button
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleActualStartMatch}
            >
              Start Match
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Startmatch = ({ initialTeamA = '', initialTeamB = '' }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [allTeams, setAllTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teamFetchError, setTeamFetchError] = useState(null);
  const [selectedTeamA, setSelectedTeamA] = useState('');
  const [selectedTeamB, setSelectedTeamB] = useState('');
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState('Batting');
  const [overs, setOvers] = useState('');
  const [scorer, setScorer] = useState('');
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [matchError, setMatchError] = useState(null);
  const [isPitchAnalyzerOpen, setIsPitchAnalyzerOpen] = useState(false);
  const [isPitchAnalyzed, setIsPitchAnalyzed] = useState(false);

  const scorers = ['John Doe', 'Jane Smith', 'Mike Johnson'];

  // Access `origin` from `state`
  const origin = state?.origin;
  console.log('Origin in Startmatch:', origin); // Should now log '/TournamentBracket'

  // Fetch teams from Firebase
  useEffect(() => {
    const fetchAllTeams = async () => {
      try {
        setLoadingTeams(true);
        const teamsCollectionRef = collection(db, 'teams');
        const teamSnapshot = await getDocs(teamsCollectionRef);
        const fetchedTeams = teamSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          flagUrl: doc.data().flagUrl,
          players: doc.data().players || []
        }));
        setAllTeams(fetchedTeams);
      } catch (err) {
        console.error("Error fetching all teams:", err);
        setTeamFetchError("Failed to load teams from database. Please check console.");
      } finally {
        setLoadingTeams(false);
      }
    };
    fetchAllTeams();
  }, []);

  // Fetch match details from Firebase for playOff format
  useEffect(() => {
    if (state?.matchId && state?.currentPhase && state?.tournamentId) {
      const fetchMatchDetails = async () => {
        try {
          setLoadingMatch(true);
          const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', state.tournamentId);
          const tournamentDoc = await getDoc(tournamentDocRef);
          if (tournamentDoc.exists()) {
            const data = tournamentDoc.data();
            const currentRound = data.rounds.find((r) => r.stage === state.currentPhase);
            if (currentRound) {
              const match = currentRound.matches.find((m) => m.id === state.matchId);
              if (match) {
                setSelectedTeamA(match.team1?.name || '');
                setSelectedTeamB(match.team2?.name || '');
              } else {
                setMatchError(`Match with ID ${state.matchId} not found in ${state.currentPhase}.`);
              }
            } else {
              setMatchError(`Round ${state.currentPhase} not found in tournament.`);
            }
          } else {
            setMatchError('Tournament not found.');
          }
        } catch (err) {
          console.error('Error fetching match details:', err);
          setMatchError('Failed to load match details. Please check console.');
        } finally {
          setLoadingMatch(false);
        }
      };
      fetchMatchDetails();
    }
  }, [state]);

  useEffect(() => {
    if (initialTeamA && allTeams.length > 0) {
      setSelectedTeamA(initialTeamA);
    }
  }, [initialTeamA, allTeams]);

  useEffect(() => {
    if (initialTeamB && allTeams.length > 0) {
      setSelectedTeamB(initialTeamB);
    }
  }, [initialTeamB, allTeams]);

  useEffect(() => {
    if (selectedTeamA && selectedTeamB === selectedTeamA) {
      setSelectedTeamB('');
    }
  }, [selectedTeamA, selectedTeamB]);

  const handleNext = () => {
    if (!isPitchAnalyzed) {
      alert('Please analyze the pitch conditions before proceeding.');
      return;
    }
    
    if (!selectedTeamA || !selectedTeamB || !overs) {
      alert('Please select both teams and enter overs.');
      return;
    }
    if (selectedTeamA === selectedTeamB) {
      alert('Teams A and B cannot be the same. Please select different teams.');
      return;
    }

    const teamAData = allTeams.find(team => team.name === selectedTeamA);
    const teamBData = allTeams.find(team => team.name === selectedTeamB);

    if (!teamAData) {
      alert(`Team "${selectedTeamA}" not found in database.`);
      return;
    }
    if (!teamBData) {
      alert(`Team "${selectedTeamB}" not found in database.`);
      return;
    }
    if (!teamAData.players || teamAData.players.length === 0) {
      alert(`Team "${selectedTeamA}" has no players registered. Please add players via Admin Panel.`);
      return;
    }
    if (!teamBData.players || teamBData.players.length === 0) {
      alert(`Team "${selectedTeamB}" has no players registered. Please add players via Admin Panel.`);
      return;
    }

    setShowPlayerSelector(true);
  };

  const openPitchAnalyzer = () => {
    setIsPitchAnalyzerOpen(true);
  };

  if (showPlayerSelector) {
    const teamAObject = allTeams.find(team => team.name === selectedTeamA);
    const teamBObject = allTeams.find(team => team.name === selectedTeamB);

    return (
      <PlayerSelector
        teamA={teamAObject}
        teamB={teamBObject}
        overs={overs}
        origin={origin} // Now passing the correct origin from state
        matchId={state?.matchId}
        currentPhase={state?.currentPhase}
        tournamentId={state?.tournamentId}
      />
    );
  }

  if (loadingTeams || loadingMatch) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (teamFetchError || matchError) {
    return (
      <div className="min-h-screen bg-gray-900 text-red-500 flex items-center justify-center">
        <p className="text-xl">Error: {teamFetchError || matchError}</p>
      </div>
    );
  }

  if (allTeams.length < 2) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-xl text-center">
          Not enough teams registered. Please add at least two teams and their players via the Admin Panel.
        </p>
      </div>
    );
  }

  return (
   <div
  className="w-full relative"
  style={{
    backgroundImage: `url(${bgImg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',  // Changed from height to minHeight
    overflow: 'auto',    // Added to enable scrolling
  }}
>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full"
      >
        <div className="w-full px-4 md:px-8 pb-8 py-1 mx-auto max-w-7xl">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-center text-white mb-4 drop-shadow-lg"
          >
            Start a Match
          </motion.h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            <motion.div
              className="flex flex-col space-y-6 w-full"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div
                className="min-h-[300px] bg-gradient-to-br from-blue-50 to-indigo-50 bg-opacity-90 rounded-xl shadow-xl p-6 w-full border border-blue-100 flex flex-col"
                whileHover={{ scale: 1.01 }}
              >
                <h2 className="text-xl font-semibold mb-4 text-blue-800">Select Teams</h2>
                <div className="space-y-4 w-full flex-1">
                  <div className="w-full">
                    <label className="block text-gray-700 mb-2 font-medium">Team A</label>
                    <select
                      className={`w-full p-3 border-2 border-blue-200 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${selectedTeamA ? 'bg-gray-200 text-gray-700' : 'bg-white'}`}
                      value={selectedTeamA}
                      onChange={(e) => setSelectedTeamA(e.target.value)}
                      disabled={state?.matchId}
                    >
                      <option value="">Select Team</option>
                      {allTeams.map(team => (
                        <option key={`teamA-${team.id}`} value={team.name}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full">
                    <label className="block text-gray-700 mb-2 font-medium">Team B</label>
                    <select
                      className={`w-full p-3 border-2 border-blue-200 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${selectedTeamB ? 'bg-gray-200 text-gray-700' : 'bg-white'}`}
                      value={selectedTeamB}
                      onChange={(e) => setSelectedTeamB(e.target.value)}
                      disabled={state?.matchId}
                    >
                      <option value="">Select Team</option>
                      {allTeams.filter(t => t.name !== selectedTeamA).map(team => (
                        <option key={`teamB-${team.id}`} value={team.name}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="min-h-[200px] bg-gradient-to-br from-blue-50 to-indigo-50 bg-opacity-90 rounded-xl shadow-xl p-6 w-full border border-blue-100 flex flex-col justify-center"
                whileHover={{ scale: 1.01 }}
              >
                <h2 className="text-xl font-semibold mb-4 text-blue-800">Choose your Overs</h2>
                <div className="w-full">
                  <input
                    type="number"
                    placeholder="Enter overs (e.g. 20)"
                    className={`w-full p-3 border-2 border-blue-200 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${overs ? 'bg-gray-200 text-gray-700' : 'bg-white'}`}
                    value={overs}
                    onChange={(e) => setOvers(e.target.value)}
                    min="1"
                    max="50"
                  />
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex flex-col space-y-6 w-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div
                className="min-h-[300px] bg-gradient-to-br from-blue-50 to-indigo-50 bg-opacity-90 rounded-xl shadow-xl p-6 w-full border border-blue-100 flex flex-col"
                whileHover={{ scale: 1.01 }}
              >
                <h2 className="text-xl font-semibold mb-4 text-blue-800">Toss Details</h2>
                <div className="space-y-4 w-full flex-1">
                  <div className="w-full">
                    <label className="block text-gray-700 mb-2 font-medium">Record Toss & Decision</label>
                    <select
                      className={`w-full p-3 border-2 border-blue-200 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${tossWinner ? 'bg-gray-200 text-gray-700' : 'bg-white'}`}
                      value={tossWinner}
                      onChange={(e) => setTossWinner(e.target.value)}
                    >
                      <option value="">Select Team</option>
                      {selectedTeamA && <option value={selectedTeamA}>{selectedTeamA}</option>}
                      {selectedTeamB && <option value={selectedTeamB}>{selectedTeamB}</option>}
                    </select>
                  </div>
                  <div className="w-full">
                    <label className="block text-gray-700 mb-2 font-medium">Elected to:</label>
                    <div className="flex space-x-8 items-center">
                      <label className="inline-flex items-center space-x-2">
                        <input
                          type="radio"
                          name="tossDecision"
                          value="Batting"
                          checked={tossDecision === 'Batting'}
                          onChange={() => setTossDecision('Batting')}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-black font-medium">Batting</span>
                      </label>
                      <label className="inline-flex items-center space-x-2">
                        <input
                          type="radio"
                          name="tossDecision"
                          value="Bowling"
                          checked={tossDecision === 'Bowling'}
                          onChange={() => setTossDecision('Bowling')}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-black font-medium">Bowling</span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="min-h-[200px] bg-gradient-to-br from-blue-50 to-indigo-50 bg-opacity-90 rounded-xl shadow-xl p-6 w-full border border-blue-100 flex flex-col justify-center"
                whileHover={{ scale: 1.01 }}
              >
                <h2 className="text-xl font-semibold mb-4 text-blue-800">Assign Scorer</h2>
                <div className="w-full">
                  <select
                    className={`w-full p-3 border-2 border-blue-200 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${scorer ? 'bg-gray-200 text-gray-700' : 'bg-white'}`}
                    value={scorer}
                    onChange={(e) => setScorer(e.target.value)}
                  >
                    <option value="">Select Scorer</option>
                    {scorers.map(person => (
                      <option key={person} value={person}>{person}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <PitchAnalyzer 
              isOpen={isPitchAnalyzerOpen}
              onClose={() => setIsPitchAnalyzerOpen(false)}
              teamA={selectedTeamA}
              teamB={selectedTeamB}
              onAnalyzeComplete={() => setIsPitchAnalyzed(true)}
            />
          </div>

          <motion.div
            className="mt-8 text-center w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.button
              className={`px-6 py-3 mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 w-full max-w-md ${
                !isPitchAnalyzed ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              whileHover={isPitchAnalyzed ? { scale: 1.02 } : {}}
              whileTap={isPitchAnalyzed ? { scale: 0.98 } : {}}
              onClick={handleNext}
              disabled={!isPitchAnalyzed}
            >
              Next
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Startmatch;