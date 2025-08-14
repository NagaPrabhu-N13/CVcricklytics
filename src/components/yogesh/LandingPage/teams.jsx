import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleSelectionModal from '../LandingPage/RoleSelectionModal';
import AddTeamModal from '../LandingPage/AddTeamModal';
import TeamSquadModal from '../LandingPage/TeamSquadModal';
import AddClubPlayer from '../../../pages/AddClubPlayer';
import { db, auth, storage } from '../../../firebase';
import { collection, onSnapshot, query, doc, deleteDoc, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { FiPlusCircle, FiTrash2 } from 'react-icons/fi';
import { useClub } from './ClubContext';

const Teams = () => {
  const { clubName } = useClub();

  const [showRoleModal, setShowRoleModal] = useState(() => {
    const storedRole = sessionStorage.getItem('userRole');
    return !storedRole;
  });
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('userRole') || null;
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isClubCreator, setIsClubCreator] = useState(false);
  const [clubCreatorLoading, setClubCreatorLoading] = useState(true);

  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [selectedTeamForPlayer, setSelectedTeamForPlayer] = useState(null);
  const [showDeleteTeamConfirm, setShowDeleteTeamConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [showTeamSquadModal, setShowTeamSquadModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teamsError, setTeamsError] = useState(null);

  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(() =>
    sessionStorage.getItem('selectedTournamentId') || null
  );
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [tournamentsError, setTournamentsError] = useState(null);

  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [playersError, setPlayersError] = useState(null);

  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [matchesError, setMatchesError] = useState(null);

  const handleSelectRole = (role) => {
    setUserRole(role);
    sessionStorage.setItem('userRole', role);
    setShowRoleModal(false);
  };

  const handleViewSquad = (team) => {
    setSelectedTeam(team);
    setShowTeamSquadModal(true);
  };

  const handleOpenAddPlayer = (team) => {
    setSelectedTeamForPlayer(team);
    setIsAddPlayerModalOpen(true);
  };

  const handleImageUpload = async (file, playerName, teamId) => {
    if (!file) return null;
    try {
      const storageRef = ref(storage, `player_images/${teamId}/${playerName}_${Date.now()}`);
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async (event) => {
          try {
            const base64Image = event.target.result.split(',')[1];
            await uploadString(storageRef, base64Image, 'base64');
            const downloadURL = await getDownloadURL(storageRef);
            resolve(downloadURL);
          } catch (err) {
            console.error('Error uploading image: ', err);
            reject(err);
          }
        };
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.error('Error uploading image: ', err);
      return null;
    }
  };

  const handleTournamentChange = (event) => {
    const tournamentId = event.target.value;
    setSelectedTournamentId(tournamentId);
    sessionStorage.setItem('selectedTournamentId', tournamentId);
    const selected = tournaments.find((t) => t.id === tournamentId);
    setSelectedTournament(selected || null);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setTeams([]);
        setTournaments([]);
        setPlayers([]);
        setMatches([]);
        setTeamsError('Please log in to view teams.');
        setTournamentsError('Please log in to view trophies.');
        setPlayersError('Please log in to view players.');
        setMatchesError('Please log in to view matches.');
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUserId || !clubName) {
      setIsClubCreator(false);
      setClubCreatorLoading(false);
      return;
    }

    setClubCreatorLoading(true);

    const q = query(
      collection(db, 'clubs'),
      where('name', '==', clubName),
      where('userId', '==', currentUserId)
    );

    const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
      setIsClubCreator(!querySnapshot.empty);
      if (querySnapshot.empty && !sessionStorage.getItem('userRole')) {
        setUserRole('viewer');
        sessionStorage.setItem('userRole', 'viewer');
        setShowRoleModal(false);
      } else if (!querySnapshot.empty && !sessionStorage.getItem('userRole')) {
        setShowRoleModal(true);
      }
      setClubCreatorLoading(false);
    }, (err) => {
      console.error("Error checking club creator status:", err);
      setIsClubCreator(false);
      if (!sessionStorage.getItem('userRole')) {
        setUserRole('viewer');
        sessionStorage.setItem('userRole', 'viewer');
        setShowRoleModal(false);
      }
      setClubCreatorLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [currentUserId, clubName]);

  useEffect(() => {
    if (!clubName) {
      setTournaments([]);
      setLoadingTournaments(false);
      return;
    }

    setLoadingTournaments(true);
    setTournamentsError(null);

    const q = query(collection(db, 'tournaments'), where('clubName', '==', clubName));

    const unsubscribeSnapshot = onSnapshot(
      q,
      (querySnapshot) => {
        let fetchedTournaments = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          userId: doc.data().userId,
          location: doc.data().location,
        }));

        if (!isClubCreator && currentUserId) {
          fetchedTournaments = fetchedTournaments.filter(
            (tournament) => tournament.userId !== currentUserId
          );
        }

        setTournaments(fetchedTournaments);

        const storedTournamentId = sessionStorage.getItem('selectedTournamentId');
        const isValidTournament = fetchedTournaments.some((t) => t.id === storedTournamentId);

        if (storedTournamentId && isValidTournament) {
          setSelectedTournamentId(storedTournamentId);
          const selected = fetchedTournaments.find((t) => t.id === storedTournamentId);
          setSelectedTournament(selected || null);
        } else if (fetchedTournaments.length > 0) {
          setSelectedTournamentId(fetchedTournaments[0].id);
          setSelectedTournament(fetchedTournaments[0]);
          sessionStorage.setItem('selectedTournamentId', fetchedTournaments[0].id);
        } else {
          setSelectedTournamentId(null);
          setSelectedTournament(null);
          sessionStorage.removeItem('selectedTournamentId');
          setTournamentsError('No trophies available.');
        }

        setLoadingTournaments(false);
      },
      (err) => {
        console.error('Error fetching trophies for dropdown:', err);
        setTournamentsError('Failed to load trophies: ' + err.message);
        setLoadingTournaments(false);
      }
    );

    return () => unsubscribeSnapshot();
  }, [clubName, isClubCreator, currentUserId]);

  useEffect(() => {
    if (!clubName || !selectedTournamentId) {
      setLoadingTeams(false);
      setTeams([]);
      return;
    }

    setLoadingTeams(true);
    setTeamsError(null);

    const q = query(
      collection(db, 'clubTeams'),
      where('tournamentId', '==', selectedTournamentId),
      where('clubName', '==', clubName)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTeams = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTeams(fetchedTeams);
        setLoadingTeams(false);
      },
      (err) => {
        console.error('Error fetching teams: ', err);
        setTeamsError('Failed to load teams: ' + err.message);
        setLoadingTeams(false);
      }
    );

    return () => unsubscribe();
  }, [clubName, selectedTournamentId]);

  useEffect(() => {
    if (!clubName || !selectedTournament?.name) {
      setLoadingPlayers(false);
      setPlayers([]);
      return;
    }

    setLoadingPlayers(true);
    setPlayersError(null);

    const q = query(
      collection(db, 'clubPlayers'),
      where('tournamentName', '==', selectedTournament.name),
      where('clubName', '==', clubName)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedPlayers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlayers(fetchedPlayers);
        setLoadingPlayers(false);
      },
      (err) => {
        console.error('Error fetching players: ', err);
        setPlayersError('Failed to load players: ' + err.message);
        setLoadingPlayers(false);
      }
    );

    return () => unsubscribe();
  }, [clubName, selectedTournament]);

  useEffect(() => {
    if (!currentUserId || !selectedTournament?.name || !clubName) {
      setLoadingMatches(false);
      setMatches([]);
      return;
    }

    setLoadingMatches(true);
    setMatchesError(null);

    const q = query(
      collection(db, 'tournamentMatches'),
      where('tournamentName', '==', selectedTournament.name),
      where('clubName', '==', clubName)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedMatches = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMatches(fetchedMatches);
        setLoadingMatches(false);
      },
      (err) => {
        console.error('Error fetching matches: ', err);
        setMatchesError('Failed to load matches: ' + err.message);
        setLoadingMatches(false);
      }
    );

    return () => unsubscribe();
  }, [currentUserId, selectedTournament, clubName]);

  const getMatchStats = () => {
    const teamTotals = [];
    const victories = [];

    matches.forEach((match) => {
      if (match.score1 && match.team1) {
        const [runs, wickets] = match.score1.split('/').map((s) => parseInt(s)) || [0, 0];
        teamTotals.push({
          score: match.score1,
          runs,
          wickets,
          team: match.team1,
          opponent: match.team2,
        });
      }
      if (match.score2 && match.team2) {
        const [runs, wickets] = match.score2.split('/').map((s) => parseInt(s)) || [0, 0];
        teamTotals.push({
          score: match.score2,
          runs,
          wickets,
          team: match.team2,
          opponent: match.team1,
        });
      }
      if (match.result && match.team1 && match.team2) {
        const runsMatch = match.result.match(/(\d+)\s*runs/i);
        const wicketsMatch = match.result.match(/(\d+)\s*wickets/i);
        if (runsMatch || wicketsMatch) {
          const margin = runsMatch ? `${runsMatch[1]} runs` : `${wicketsMatch[1]} wickets`;
          const winner = match.result.includes(match.team1) ? match.team1 : match.team2;
          const loser = match.result.includes(match.team1) ? match.team2 : match.team1;
          victories.push({
            margin,
            teams: `${winner} vs ${loser}`,
          });
        }
      }
    });

    const highestTotals = teamTotals.sort((a, b) => b.runs - a.runs).slice(0, 3);
    const allOutTotals = teamTotals.filter((t) => t.wickets === 10).sort((a, b) => a.runs - b.runs);
    const nonAllOutTotals = teamTotals.filter((t) => t.wickets < 10).sort((a, b) => a.runs - b.runs);
    const lowestTotals = [...allOutTotals, ...nonAllOutTotals].slice(0, 3);

    const sortedVictories = victories.sort((a, b) => {
      const aIsRuns = a.margin.includes('runs');
      const bIsRuns = b.margin.includes('runs');
      if (aIsRuns && bIsRuns) {
        return parseInt(b.margin) - parseInt(a.margin);
      } else if (aIsRuns) {
        return -1;
      } else if (bIsRuns) {
        return 1;
      } else {
        return parseInt(b.margin) - parseInt(a.margin);
      }
    }).slice(0, 3);

    return { highestTotals, lowestTotals, victories: sortedVictories };
  };

  const { highestTotals, lowestTotals, victories } = getMatchStats();

  if (authLoading || loadingTournaments || loadingPlayers || loadingMatches || clubCreatorLoading) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">
        Loading...
      </div>
    );
  }

  if (!currentUserId && userRole === 'admin') {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">
        <p>Please log in to manage teams as an admin.</p>
      </div>
    );
  }

  if (!clubName) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">
        No club selected. Please select a club to view teams.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen p-6 text-gray-100">
      <AnimatePresence>
        {showRoleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RoleSelectionModal onSelectRole={handleSelectRole} />
          </motion.div>
        )}
      </AnimatePresence>

      {userRole && (
        <>
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-400">Teams</h1>
              <p className="text-gray-400 mt-2">
                {selectedTournament ? `${selectedTournament.name} • ${selectedTournament.location}` : 'Select a trophy'}
              </p>
              <select
                value={selectedTournamentId || ''}
                onChange={handleTournamentChange}
                className="mt-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-md p-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={tournaments.length === 0}
              >
                {tournaments.length === 0 ? (
                  <option value="">No trophies available</option>
                ) : (
                  <>
                    <option value="" disabled>
                      Select a Trophy
                    </option>
                    {tournaments.map((tournament) => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {tournamentsError && <p className="text-red-500 text-sm mt-2">{tournamentsError}</p>}
            </div>
            {userRole === 'admin' && isClubCreator && (
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAddPlayerModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <FiPlusCircle /> Add Player
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddTeamModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <FiPlusCircle /> Add Team
                </motion.button>
              </div>
            )}
          </div>

          {loadingTeams ? (
            <div className="text-center text-gray-400 text-xl py-8">Loading teams...</div>
          ) : teamsError ? (
            <div className="text-center text-red-500 text-xl py-8">{teamsError}</div>
          ) : teams.length === 0 ? (
            <div className="text-center text-gray-400 text-xl py-8">
              No teams found for this trophy. {userRole === 'admin' && isClubCreator && 'Add some teams!'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teams.map((team) => {
                const teamPlayers = players.filter((player) => player.teamName === team.teamName);
                return (
                  <div
                    key={team.id}
                    className="bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-700 relative"
                  >
                    {userRole === 'admin' && isClubCreator && (
                      <button
                        onClick={() => {
                          setTeamToDelete(team);
                          setShowDeleteTeamConfirm(true);
                        }}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-500"
                        title="Delete Team"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    )}
                    <div className="bg-purple-800 p-4 text-white">
                      <h2 className="text-xl font-bold truncate">{team.teamName}</h2>
                      <p className="text-sm opacity-90">Captain: {team.captain}</p>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                        <div className="bg-gray-700 p-2 rounded">
                          <p className="text-sm text-gray-300">Matches</p>
                          <p className="font-bold">{team.matches}</p>
                        </div>
                        <div className="bg-gray-700 p-2 rounded">
                          <p className="text-sm text-gray-300">Wins</p>
                          <p className="font-bold text-green-400">{team.wins}</p>
                        </div>
                        <div className="bg-gray-700 p-2 rounded">
                          <p className="text-sm text-gray-300">Points</p>
                          <p className="font-bold">{team.points}</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-400">Last Match</p>
                        <p
                          className={`text-sm ${
                            team.lastMatch && team.lastMatch.toLowerCase().startsWith('won')
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {team.lastMatch}
                        </p>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-400">Key Players</p>
                          {userRole === 'admin' && isClubCreator && (
                            <button
                              onClick={() => handleOpenAddPlayer(team)}
                              className="text-green-400 hover:text-green-500"
                              title="Add Player"
                            >
                              <FiPlusCircle size={20} />
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {teamPlayers.length > 0 ? (
                            teamPlayers.slice(0, 3).map((player, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-300">{player.name}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="bg-purple-900 text-purple-300 px-2 py-0.5 rounded text-xs">
                                    {player.careerStats?.batting?.runs || player.runs || 0}r
                                  </span>
                                  <span className="bg-green-900 text-green-300 px-2 py-0.5 rounded text-xs">
                                    {player.careerStats?.bowling?.wickets || player.wickets || 0}w
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">No players listed for this team.</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-4 p-4">
                      <button
                        onClick={() => handleViewSquad(team)}
                        className="w-full py-2 bg-purple-900 text-purple-300 rounded-md hover:bg-purple-700 transition font-medium"
                      >
                        View Full Squad
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-12 bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Team Standings</h2>
            {loadingTeams ? (
              <div className="text-center text-gray-400">Loading standings...</div>
            ) : teamsError ? (
              <div className="text-center text-red-500">{teamsError}</div>
            ) : teams.length === 0 ? (
              <div className="text-center text-gray-400">No team standings available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Played
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Won
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Lost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        NRR
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Form
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {teams
                      .sort((a, b) => b.points - a.points)
                      .map((team, index) => (
                        <tr key={team.id} className="hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-400">
                            {team.teamName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{team.matches}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{team.wins}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{team.losses}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-200">
                            {team.points}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {team.nrr || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-1">
                              {['W', 'L', 'W', 'W', 'L'].map((result, i) => (
                                <span
                                  key={i}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    result === 'W' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                                  }`}
                                >
                                  {result}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-gray-200 mb-4">Highest Team Totals</h3>
              {loadingMatches ? (
                <div className="text-center text-gray-400">Loading...</div>
              ) : matchesError ? (
                <div className="text-center text-red-500">{matchesError}</div>
              ) : highestTotals.length === 0 ? (
                <div className="text-center text-gray-400">No match data available.</div>
              ) : (
                <div className="space-y-3">
                  {highestTotals.map((total, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center pb-2 border-b border-gray-700"
                    >
                      <span className="font-medium text-gray-300">{total.score}</span>
                      <span className="text-sm text-gray-400">
                        {total.team} vs {total.opponent}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-gray-200 mb-4">Lowest Team Totals</h3>
              {loadingMatches ? (
                <div className="text-center text-gray-400">Loading...</div>
              ) : matchesError ? (
                <div className="text-center text-red-500">{matchesError}</div>
              ) : lowestTotals.length === 0 ? (
                <div className="text-center text-gray-400">No match data available.</div>
              ) : (
                <div className="space-y-3">
                  {lowestTotals.map((total, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center pb-2 border-b border-gray-700"
                    >
                      <span className="font-medium text-gray-300">{total.score}</span>
                      <span className="text-sm text-gray-400">
                        {total.team} vs {total.opponent}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-gray-200 mb-4">Biggest Victories</h3>
              {loadingMatches ? (
                <div className="text-center text-gray-400">Loading...</div>
              ) : matchesError ? (
                <div className="text-center text-red-500">{matchesError}</div>
              ) : victories.length === 0 ? (
                <div className="text-center text-gray-400">No victory data available.</div>
              ) : (
                <div className="space-y-3">
                  {victories.map((victory, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center pb-2 border-b border-gray-700"
                    >
                      <span className="font-medium text-gray-300">{victory.margin}</span>
                      <span className="text-sm text-gray-400">{victory.teams}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showAddTeamModal && userRole === 'admin' && isClubCreator && (
              <AddTeamModal
                onClose={() => setShowAddTeamModal(false)}
                onTeamAdded={() => setShowAddTeamModal(false)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isAddPlayerModalOpen && userRole === 'admin' && isClubCreator && (
              <AddClubPlayer
                onClose={() => setIsAddPlayerModalOpen(false)}
                team={selectedTeamForPlayer}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showTeamSquadModal && selectedTeam && (
              <TeamSquadModal
                team={selectedTeam}
                tournament={selectedTournament}
                onClose={() => {
                  setShowTeamSquadModal(false);
                  setSelectedTeam(null);
                }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showDeleteTeamConfirm && teamToDelete && userRole === 'admin' && isClubCreator && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              >
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                  <h3 className="text-lg font-bold text-gray-200 mb-4">Confirm Delete Team</h3>
                  <p className="text-gray-300 mb-4">
                    Are you sure you want to delete {teamToDelete.teamName}? This action cannot be undone.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={async () => {
                        try {
                          await deleteDoc(doc(db, 'clubTeams', teamToDelete.id));
                          setShowDeleteTeamConfirm(false);
                          setTeamToDelete(null);
                        } catch (err) {
                          console.error('Error deleting team: ', err);
                          setTeamsError('Failed to delete team: ' + err.message);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteTeamConfirm(false);
                        setTeamToDelete(null);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default Teams;