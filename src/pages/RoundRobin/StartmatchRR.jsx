import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import logo from '../../assets/pawan/PlayerProfile/picture-312.png';
import bgImg from '../../assets/sophita/HomePage/advertisement5.jpeg';
import nav from '../../assets/kumar/right-chevron.png';
import { IoChevronBack } from "react-icons/io5";
import PitchAnalyzer from '../../components/sophita/HomePage/PitchAnalyzer';

const PlayerSelector = ({
  teamA,
  teamB,
  overs,
  origin,
  tournamentId,
  schedule,
  semiFinals,
  finals,
  selectedTeams,
  groupPhase,
  matchId,
  tournamentName,
  tournamentImageUrl,
  information,
  onBack, // Add new prop for handling back
}) => {
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

    console.group('Navigating to StartMatchPlayersRR');
    console.log('Selected Players:', selectedPlayers);
    console.log('Team A:', teamA);
    console.log('Team B:', teamB);
    console.log('Overs:', overs);
    console.log('Origin:', origin);
    console.log('Tournament ID:', tournamentId);
    console.log('Schedule:', schedule);
    console.log('Semi-Finals:', semiFinals);
    console.log('Finals:', finals);
    console.log('Selected Teams:', selectedTeams);
    console.log('Group Phase:', groupPhase);
    console.log('Match ID:', matchId);
    console.log('Tournament Image URL:', tournamentImageUrl);
    console.groupEnd();

    navigate('/StartMatchPlayersRR', {
      state: {
        overs,
        teamA,
        teamB,
        selectedPlayers,
        origin,
        tournamentId,
        schedule,
        semiFinals,
        finals,
        selectedTeams,
        phase: groupPhase,
        matchId,
        tournamentName,
        tournamentImageUrl,
        information,
      },
    });
  };

  const handleBack = () => {
    onBack(); // Call the onBack callback to toggle showPlayerSelector to false
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
          <div className="flex items-center mb-6">
            <IoChevronBack
              className="w-8 h-8 text-black-500 cursor-pointer mt-[5px] ml-[5px]"
              onClick={handleBack}
            />
            <h1 className="text-4xl font-bold text-black">Select Players</h1>
          </div>
          
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
              </div>  <div className="relative">
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
                            isSelected ? 'bg-blue-100 font-medium' : 'hover:bg-blue-50'
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
              </div>  <div className="relative">
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
                            isSelected ? 'bg-indigo-100 font-medium' : 'hover:bg-indigo-50'
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

const Startmatch = ({
  initialTeamA,
  initialTeamB,
  tournamentId,
  schedule,
  semiFinals,
  finals,
  selectedTeams,
  origin,
  onTeamsSelectedForLiveScore,
  setActiveTab,
  tournamentName,
  information,
  User
}) => {
  console.group('Startmatch Props');
  console.log('Initial Team A:', initialTeamA);
  console.log('Initial Team B:', initialTeamB);
  console.log('Tournament ID:', tournamentId);
  console.log('Schedule:', schedule);
  console.log('Semi-Finals:', semiFinals);
  console.log('Finals:', finals);
  console.log('Selected Teams:', selectedTeams);
  console.log('Origin:', origin);
  console.log('onTeamsSelectedForLiveScore:', typeof onTeamsSelectedForLiveScore);
  console.log('setActiveTab:', typeof setActiveTab);
  console.log('TournamentName:', tournamentName);
  console.log('information:', information);
  console.log(User);
  console.groupEnd();

  const [allTeams, setAllTeams] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [tournamentWinner, setTournamentWinner] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teamFetchError, setTeamFetchError] = useState(null);
  const [selectedTeamA, setSelectedTeamA] = useState(initialTeamA || '');
  const [selectedTeamB, setSelectedTeamB] = useState(initialTeamB || '');
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState('Batting');
  const [overs, setOvers] = useState('');
  const [scorer, setScorer] = useState('');
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [groupPhase, setGroupPhase] = useState('');
  const [loadingTournament, setLoadingTournament] = useState(false);
  const [tournamentError, setTournamentError] = useState(null);
  const [tournamentDocId, setTournamentDocId] = useState('');
  const [showFlowchartModal, setShowFlowchartModal] = useState(false);
  const [flowchartData, setFlowchartData] = useState([]);
  const [flowchartLoading, setFlowchartLoading] = useState(false);
  const [flowchartError, setFlowchartError] = useState(null);
  const [tournamentImageUrl, setTournamentImageUrl] = useState('');
  const [isPitchAnalyzerOpen, setIsPitchAnalyzerOpen] = useState(false);
  const [isPitchAnalyzed, setIsPitchAnalyzed] = useState(false);  const scorers = ['John Doe', 'Jane Smith', 'Mike Johnson'];
  const navigate = useNavigate();

  // Check if it's a different user
  const isDifferentUser = User === 'Different User';

  // Fetch teams from Firebase
  useEffect(() => {
    const fetchAllTeams = async () => {
      try {
        setLoadingTeams(true);
        const clubTeamsCollectionRef = collection(db, 'clubTeams');
        const teamSnapshot = await getDocs(clubTeamsCollectionRef);
        
        const fetchedTeams = teamSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.teamName || 'Unknown Team',  // Use teamName field as the display name
            flagUrl: data.flagUrl || '',  // Optional flag URL
            players: data.players || []  // Fetch the players array directly
          };
        });
        
        setAllTeams(fetchedTeams);
        console.group('Fetched Teams from clubTeams');
        console.log('All Teams:', fetchedTeams);
        console.groupEnd();
      } catch (err) {
        console.error('Error fetching teams from clubTeams:', err);
        setTeamFetchError('Failed to load teams from clubTeams. Please check console.');
      } finally {
        setLoadingTeams(false);
      }
    };
    fetchAllTeams();
  }, []);

  const fetchPlayersForTeam = async (teamName) => {
  try {
    const clubTeamsRef = collection(db, 'clubTeams');
    const q = query(clubTeamsRef, where('teamName', '==', teamName));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error(`No matching team found for ${teamName}`);
      return [];
    }
    
    // Assuming one document per teamName; get the first one
    const teamDoc = querySnapshot.docs[0];
    const players = teamDoc.data().players || [];
    
    console.log(`Players for ${teamName}:`, players);
    return players;
  } catch (err) {
    console.error('Error fetching players:', err);
    return [];
  }
};

useEffect(() => {
  if (selectedTeamA) {
    fetchPlayersForTeam(selectedTeamA).then(players => {
      // Update teamAObject or state with these players
      const teamAObject = { name: selectedTeamA, players };
      // Pass to PlayerSelector or update state
    });
  }
}, [selectedTeamA]);



  // Fetch tournament image
  useEffect(() => {
    const fetchTournamentDetails = async () => {
      if (!tournamentName) {
        setTournamentError('No tournament name provided.');
        setTournamentImageUrl('');
        return;
      }

      try {
        const tournamentsCollectionRef = collection(db, 'tournament');
        const querySnapshot = await getDocs(tournamentsCollectionRef);
        const matchingTournament = querySnapshot.docs.find(doc => 
          doc.data().name.toLowerCase() === tournamentName.toLowerCase()
        );

        if (matchingTournament) {
          const tournamentData = matchingTournament.data();
          setTournamentImageUrl(tournamentData.imageUrl || '');
        } else {
          setTournamentError('No matching tournament found.');
          setTournamentImageUrl('');
        }
      } catch (err) {
        console.error('Error fetching tournament details:', err);
        setTournamentError('Failed to load tournament details.');
        setTournamentImageUrl('');
      }
    };

    fetchTournamentDetails();
  }, [tournamentName]);

  // Fetch tournament data
  useEffect(() => {
    const fetchTournamentData = async () => {
      if (!tournamentId) {
        setTournamentError('No tournament ID provided.');
        return;
      }

      setLoadingTournament(true);
      try {
        const q = query(
          collection(db, 'roundrobin'),
          where('tournamentId', '==', tournamentId)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setTournamentError('Tournament not found.');
          setLoadingTournament(false);
          return;
        }

        const tournamentDoc = querySnapshot.docs[0];
        setTournamentDocId(tournamentDoc.id);
        const tournamentData = tournamentDoc.data();  const roundRobinMatches = Object.keys(tournamentData.roundRobin || {}).flatMap(groupKey => {
          const groupNumber = groupKey.split('_').pop();
          return (tournamentData.roundRobin[groupKey] || []).map(match => ({
            ...match,
            phase: `Group Stage ${groupNumber}`,
          }));
        });
        const semiFinalMatches = Object.values(tournamentData.semiFinals || {}).map(match => ({
          ...match,
          phase: 'Semi-Final',
        }));
        const finalMatches = Object.values(tournamentData.finals || {}).map(match => ({
          ...match,
          phase: 'Final',
        }));

        const groupStageComplete = roundRobinMatches.length > 0 && roundRobinMatches.every(match => match.winner !== null);
        const semiFinalsComplete = semiFinalMatches.length > 0 && semiFinalMatches.every(match => match.winner !== null);
        const finalsComplete = finalMatches.length > 0 && finalMatches.every(match => match.winner !== null);

        if (groupStageComplete && semiFinalMatches.every(match => match.team1 === 'TBD')) {
          const teams = tournamentData.teams || [];
          const sortedTeams = teams
            .filter(team => team.teamName !== 'BYE')
            .sort((a, b) => b.points - a.points)
            .slice(0, 4);

          if (sortedTeams.length >= 4) {
            const updatedSemiFinals = {
              match_1: { id: 'semi_1', phase: 'Semi-Final 1', team1: sortedTeams[0].teamName, team2: sortedTeams[3].teamName, winner: null },
              match_2: { id: 'semi_2', phase: 'Semi-Final 2', team1: sortedTeams[1].teamName, team2: sortedTeams[2].teamName, winner: null },
            };

            await updateDoc(doc(db, 'roundrobin', tournamentDoc.id), {
              semiFinals: updatedSemiFinals,
            });

            semiFinalMatches.splice(0, semiFinalMatches.length, ...Object.values(updatedSemiFinals));
          }
        }

        if (groupStageComplete && semiFinalsComplete && finalMatches.every(match => match.team1 === 'TBD')) {
          const semiFinalWinners = semiFinalMatches
            .map(match => match.winner)
            .filter(winner => winner !== null);

          if (semiFinalWinners.length === 2) {
            const updatedFinals = {
              match_1: { id: 'final_1', phase: 'Final', team1: semiFinalWinners[0], team2: semiFinalWinners[1], winner: null },
            };

            await updateDoc(doc(db, 'roundrobin', tournamentDoc.id), {
              finals: updatedFinals,
            });

            finalMatches.splice(0, finalMatches.length, ...Object.values(updatedFinals));
          }
        }

        if (groupStageComplete && semiFinalsComplete && finalsComplete) {
          const finalWinner = finalMatches[0]?.winner;
          if (finalWinner) {
            setTournamentWinner(finalWinner);
            await updateDoc(doc(db, 'roundrobin', tournamentDoc.id), {
              tournamentWinner: finalWinner,
            });
          }
        }

        let matchesToDisplay = [];
        let phase = 'Group Stage';

        if (!groupStageComplete) {
          matchesToDisplay = roundRobinMatches;
          phase = 'Group Stage';
        } else if (groupStageComplete && !semiFinalsComplete) {
          matchesToDisplay = semiFinalMatches;
          phase = 'Semi-Finals';
        } else if (groupStageComplete && semiFinalsComplete && !finalsComplete) {
          matchesToDisplay = finalMatches;
          phase = 'Finals';
        } else if (groupStageComplete && semiFinalsComplete && finalsComplete) {
          matchesToDisplay = finalMatches;
          phase = 'Finals (Complete)';
        }

        matchesToDisplay = matchesToDisplay.sort((a, b) => {
          if (a.winner !== null && b.winner === null) return -1;
          if (a.winner === null && b.winner !== null) return 1;
          return 0;
        });

        setAllMatches(matchesToDisplay);
        setCurrentPhase(phase);

        console.group('Fetched Tournament Data');
        console.log('Tournament Data:', tournamentData);
        console.log('Round Robin Matches:', roundRobinMatches);
        console.log('Semi-Final Matches:', semiFinalMatches);
        console.log('Final Matches:', finalMatches);
        console.log('Group Stage Complete:', groupStageComplete);
        console.log('Semi-Finals Complete:', semiFinalsComplete);
        console.log('Finals Complete:', finalsComplete);
        console.log('Matches to Display:', matchesToDisplay);
        console.log('Current Phase:', phase);
        console.log('Tournament Winner:', tournamentWinner);
        console.groupEnd();
      } catch (err) {
        console.error('Error fetching tournament:', err);
        setTournamentError('Failed to load tournament data.');
      } finally {
        setLoadingTournament(false);
      }
    };  if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId]);

  useEffect(() => {
    if (selectedMatchId) {
      const match = allMatches.find(m => m.id === selectedMatchId);
      if (match && match.winner === null) {
        setSelectedTeamA(match.team1);
        setSelectedTeamB(match.team2);
        setGroupPhase(match.phase);
        console.group('Match Selected');
        console.log('Selected Match ID:', selectedMatchId);
        console.log('Selected Match Details:', match);
        console.log('Selected Team A:', match.team1);
        console.log('Selected Team B:', match.team2);
        console.log('Group Phase:', match.phase);
        console.groupEnd();
      }
    }
  }, [selectedMatchId, allMatches]);

  useEffect(() => {
    if (selectedTeamA && selectedTeamB === selectedTeamA) {
      setSelectedTeamB('');
    }
  }, [selectedTeamA, selectedTeamB]);

 

  const fetchFlowchartData = async () => {
    if (!tournamentId) {
      setFlowchartError('No tournament ID provided.');
      return;
    }

    setFlowchartLoading(true);
    setFlowchartError(null);

    try {
      const q = query(
        collection(db, 'roundrobin'),
        where('tournamentId', '==', tournamentId)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setFlowchartError('Tournament not found.');
        setFlowchartLoading(false);
        return;
      }

      const tournamentData = querySnapshot.docs[0].data();
      const flowchart = [];

      if (tournamentData.roundRobin && Object.keys(tournamentData.roundRobin).length > 0) {
        flowchart.push({
          phase: 'Group Stage',
          teams: tournamentData.teams
            .filter(team => team.teamName !== 'BYE')
            .map(team => team.teamName),
        });
      }

      let semiFinalTeams = [];
      const semiFinalMatches = Object.values(tournamentData.semiFinals || {});
      if (semiFinalMatches.length > 0 && semiFinalMatches[0].team1 !== 'TBD') {
        semiFinalTeams = semiFinalMatches.flatMap(match => [match.team1, match.team2]);
      } else {
        if (tournamentData.teams.length >= 4) {
          semiFinalTeams = ['TBD', 'TBD', 'TBD', 'TBD'];
        } else if (tournamentData.teams.length === 3) {
          semiFinalTeams = ['TBD', 'TBD'];
        }
      }
      if (semiFinalTeams.length > 0) {
        flowchart.push({
          phase: 'Semi-Finals',
          teams: semiFinalTeams,
        });
      }

      let finalTeams = [];
      const finalMatches = Object.values(tournamentData.finals || {});
      if (finalMatches.length > 0 && finalMatches[0].team1 !== 'TBD') {
        finalTeams = finalMatches.flatMap(match => [match.team1, match.team2]);
      } else {
        if (tournamentData.teams.length >= 2) {
          finalTeams = ['TBD', 'TBD'];
        }
      }
      if (finalTeams.length > 0) {
        flowchart.push({
          phase: 'Finals',
          teams: finalTeams,
        });
      }

      setFlowchartData(flowchart);
    } catch (err) {
      console.error('Error fetching flowchart data:', err);
      setFlowchartError('Failed to load flowchart. Please try again.');
    } finally {
      setFlowchartLoading(false);
    }
  };

  const handleOpenFlowchartModal = () => {
    setShowFlowchartModal(true);
    fetchFlowchartData();
  };

  const handleNext = () => {
  if (!isPitchAnalyzed) {
    alert('Please analyze the pitch conditions before proceeding.');
    return;
  }

  if (!selectedMatchId) {
    alert('Please select a match.');
    return;
  }

    const selectedMatch = allMatches.find(match => match.id === selectedMatchId);
    if (selectedMatch && selectedMatch.winner !== null) {
      alert('This match has already been played.');
      return;
    }  if (!selectedTeamA || !selectedTeamB || !overs) {
      alert('Please select a match and enter overs.');
      return;
    }

    const teamAData = allTeams.find(team => team.name === selectedTeamA);
    const teamBData = allTeams.find(team => team.name === selectedTeamB);

    if (!teamAData) {
      alert(`Team "${selectedTeamA}" not found.`);
      return;
    }
    if (!teamBData) {
      alert(`Team "${selectedTeamB}" not found.`);
      return;
    }
    if (!teamAData.players || teamAData.players.length === 0) {
      alert(`Team "${selectedTeamA}" has no players. Add players via admin panel.`);
      return;
    }
    if (!teamBData.players || teamBData.players.length === 0) {
      alert(`Team "${selectedTeamB}" has no players. Add players via admin panel.`);
      return;
    }

    setShowPlayerSelector(true);
  };

  const handleBackFromPlayerSelector = () => {
    setShowPlayerSelector(false);
  };

  const hasValue = value => value !== '' && value !== null && value !== undefined;

  if (loadingTeams || loadingTournament) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (teamFetchError || tournamentError) {
    return (
      <div className="min-h-screen bg-gray-900 text-red-500 flex items-center justify-center">
        <p className="text-xl">Error: {teamFetchError || tournamentError}</p>
      </div>
    );
  }

  if (allTeams.length < 2) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-xl text-center">
          Not enough teams registered. Please add at least two teams via admin panel.
        </p>
      </div>
    );
  }

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
        origin={origin}
        tournamentId={tournamentId}
        schedule={schedule}
        semiFinals={semiFinals}
        finals={finals}
        selectedTeams={selectedTeams}
        groupPhase={groupPhase}
        matchId={selectedMatchId}
        tournamentName={tournamentName}
        tournamentImageUrl={tournamentImageUrl}
        onBack={handleBackFromPlayerSelector} // Pass the back handler
        information = {information}
      />
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
        className="w-full"
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

          {tournamentWinner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl font-semibold text-white">
                Tournament Winner: {tournamentWinner} 🏆
              </h2>
            </motion.div>
          )}

          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button
              onClick={handleOpenFlowchartModal}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              View Flowchart
            </button>
          </motion.div>  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
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
                {tournamentName && tournamentImageUrl && (
                  <div className="flex items-center mb-4">
                    <img
                      src={tournamentImageUrl}
                      alt={`${tournamentName} Image`}
                      className="w-16 h-16 object-cover rounded-full mr-2"
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                    <span className="text-xl font-medium text-blue-800">{tournamentName}</span>
                  </div>
                )}
                <h2 className="text-xl font-semibold mb-4 text-blue-800">Select Match</h2>
                <div className="mb-4">
                  <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Current Phase: {currentPhase}
                  </span>
                </div>
                <div className="space-y-4 w-full flex-1">
                  <div className="w-full">
                    <label className="block text-gray-700 mb-2 font-medium">Select Match</label>
                    <select
                      className={`w-full p-3 border-2 border-blue-200 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${
                        hasValue(selectedMatchId) ? 'bg-gray-200 text-gray-700' : 'bg-white'
                      }`}
                      value={selectedMatchId}
                      onChange={(e) => {
                        const match = allMatches.find(m => m.id === e.target.value);
                        if (match && match.winner === null) {
                          setSelectedMatchId(e.target.value);
                        }
                      }}
                    >
                      <option value="">Select a Match</option>
                      {allMatches.map(match => (
                        <option
                          key={match.id}
                          value={match.id}
                          disabled={match.winner !== null}
                          className={match.winner !== null ? 'played-match' : ''}
                        >
                          {`${match.team1} vs ${match.team2}${match.winner ? ` (Winner: ${match.winner})` : ''}`}
                        </option>
                      ))}
                    </select>
                    {allMatches.length === 0 && currentPhase !== 'Finals (Complete)' && (
                      <p className="text-red-500 mt-2 text-sm">
                        No matches available. Please complete the previous phase.
                      </p>
                    )}
                    {currentPhase === 'Finals (Complete)' && (
                      <p className="text-green-500 mt-2 text-sm">
                        Tournament completed! No more matches to play.
                      </p>
                    )}
                  </div>
                  <div className="w-full">
                    <label className="block text-gray-700 mb-2 font-medium">Team A</label>
                    <input
                      type="text"
                      className="w-full p-3 border-2 border-blue-200 rounded-lg text-gray-800 bg-gray-200"
                      value={selectedTeamA}
                      readOnly
                    />
                  </div>
                  <div className="w-full">
                    <label className="block text-gray-700 mb-2 font-medium">Team B</label>
                    <input
                      type="text"
                      className="w-full p-3 border-2 border-blue-200 rounded-lg text-gray-800 bg-gray-200"
                      value={selectedTeamB}
                      readOnly
                    />
                  </div>
                </div>
              </motion.div>  <motion.div
                className="min-h-[200px] bg-gradient-to-br from-blue-50 to-indigo-50 bg-opacity-90 rounded-xl shadow-xl p-6 w-full border border-blue-100 flex flex-col justify-center"
                whileHover={{ scale: 1.01 }}
              >
                <h2 className="text-xl font-semibold mb-4 text-blue-800">Choose your Overs</h2>
                <div className="w-full">
                  <input
                    type="number"
                    placeholder="Enter overs (e.g. 20)"
                    className={`w-full p-3 border-2 border-blue-200 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${
                      hasValue(overs) ? 'bg-gray-200 text-gray-700' : 'bg-white'
                    }`}
                    value={overs}
                    onChange={(e) => setOvers(e.target.value)}
                    min="1"
                    max="50"
                    disabled={isDifferentUser} // Disable for different user
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
                      className={`w-full p-3 border-2 border-blue-200 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 mb-4 ${
                        hasValue(tossWinner) ? 'bg-gray-200 text-gray-700' : 'bg-white'
                      }`}
                      value={tossWinner}
                      onChange={(e) => setTossWinner(e.target.value)}
                      disabled={isDifferentUser} // Disable for different user
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
                          disabled={isDifferentUser} // Disable for different user
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
                          disabled={isDifferentUser} // Disable for different user
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
                  <input
                    type="text"
                    placeholder="Enter scorer name"
                    className={`w-full p-3 border-2 border-blue-200 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${hasValue(scorer) ? 'bg-gray-200 text-gray-700' : 'bg-white'}`}
                    value={scorer}
                    onChange={(e) => setScorer(e.target.value)}
                  />
                </div>

              </motion.div>
            </motion.div>
          </div>  <div className="mt-8 flex flex-col items-center">
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
                     className={`px-6 py-3 mt-8 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 w-full max-w-md ${
                                  !isPitchAnalyzed || isDifferentUser ? 'bg-gray-400 text-gray-700 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                }`}
                      whileHover={isPitchAnalyzed ? { scale: 1.02 } : {}}
                      whileTap={isPitchAnalyzed ? { scale: 0.98 } : {}}
                      onClick={handleNext}
                      disabled={!isPitchAnalyzed || isDifferentUser}
                    >
                      Next
                    </motion.button>
                  </motion.div>
          {showFlowchartModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#1A2B4C] rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl md:text-2xl font-semibold mb-4 text-center text-white">
                  Tournament Flowchart
                </h2>
                {flowchartLoading && <p className="text-sm md:text-base text-white">Loading flowchart...</p>}
                {flowchartError && <p className="text-red-500 text-sm md:text-base">{flowchartError}</p>}
                {!flowchartLoading && !flowchartError && flowchartData.length > 0 && (
                  <div className="space-y-6">
                    {flowchartData.map((phase, index) => (
                      <div key={index} className="flex flex-row items-start">
                        <div className="w-1/4 text-left pr-4">
                          <h3 className="text-lg md:text-xl font-bold mb-2 text-white">{phase.phase}</h3>
                        </div>
                        <div className="w-3/4">
                          <div className="flex flex-row flex-wrap gap-2">
                            {phase.teams.map((team, teamIndex) => (
                              <div
                                key={teamIndex}
                                className="bg-blue-900 p-3 rounded-lg text-center text-sm md:text-base text-white min-w-[100px]"
                              >
                                {team}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {tournamentWinner && (
                  <div className="mt-6 text-center">
                    <h3 className="text-lg md:text-xl font-bold text-white">
                      Winner: {tournamentWinner} 🏆
                    </h3>
                  </div>
                )}
                <button
                  onClick={() => setShowFlowchartModal(false)}
                  className="mt-6 w-full bg-gray-500 px-4 py-2 rounded hover:bg-gray-600 text-sm md:text-base text-white"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <style >{`
        .played-match {
          color: #9ca3af;
          background-color: #f3f4f6;
        }
      `}</style>
    </div>
  );
};

export default Startmatch;
