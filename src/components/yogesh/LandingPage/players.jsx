import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useClub } from './ClubContext';
import AddPlayerModal from '../../../pages/AddClubPlayer';
import RoleSelectionModal from '../LandingPage/RoleSelectionModal';

const PlayersList = () => {
  const { clubName } = useClub();

  // Role selection and Auth states
  const [showRoleModal, setShowRoleModal] = useState(() => {
    const storedRole = sessionStorage.getItem('userRole');
    return !storedRole;
  });
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('userRole') || null;
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // State for teams dropdown
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teamsError, setTeamsError] = useState(null);

  // State for player filtering and management
  const [playingPlayerId, setPlayingPlayerId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [error, setError] = useState(null);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const audioRef = useRef(null);

  // Function to handle role selection
  const handleSelectRole = (role) => {
    setUserRole(role);
    sessionStorage.setItem('userRole', role);
    setShowRoleModal(false);
  };

  // Effect to listen for auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setTeams([]);
        setPlayers([]);
        setTeamsError('Please log in to view teams.');
        setError('Please log in to view players.');
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Effect to fetch teams from Firestore
  useEffect(() => {
    if (!clubName) {
      setLoadingTeams(false);
      setTeams([]);
      setTeamFilter('');
      return;
    }

    setLoadingTeams(true);
    setTeamsError(null);

    const q = query(
      collection(db, 'clubTeams'),
      where('clubName', '==', clubName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTeams = snapshot.docs.map(doc => ({
        id: doc.id,
        teamName: doc.data().teamName
      }));
      setTeams(fetchedTeams);
      if (fetchedTeams.length > 0 && !teamFilter) {
        setTeamFilter(fetchedTeams[0].teamName);
      }
      setLoadingTeams(false);
    }, (error) => {
      console.error("Error fetching teams: ", error);
      setTeamsError("Failed to load teams: " + error.message);
      setLoadingTeams(false);
    });

    return () => unsubscribe();
  }, [clubName]);

  // Effect to fetch players from Firestore
  useEffect(() => {
    if (!clubName || !teamFilter) {
      setLoadingPlayers(false);
      setPlayers([]);
      return;
    }

    setLoadingPlayers(true);
    setError(null);

    const q = query(
      collection(db, 'PlayerDetails'),
      where('clubName', '==', clubName),
      where('teamName', '==', teamFilter)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({
        id: doc.id,
        level: doc.data().level || 'player',
        playerId: doc.data().playerId || null,
        ...doc.data()
      }));
      setPlayers(playersData);
      setLoadingPlayers(false);
    }, (err) => {
      console.error("Error fetching players: ", err);
      setError("Failed to load players: " + err.message);
      setLoadingPlayers(false);
    });

    return () => unsubscribe();
  }, [clubName, teamFilter]);

  // Effect to manage audio playback when playingPlayerId changes
  useEffect(() => {
    if (!audioRef.current) return;

    if (playingPlayerId) {
      const playerToPlay = players.find(p => p.id === playingPlayerId);

      if (playerToPlay && playerToPlay.audioUrl) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = playerToPlay.audioUrl;
        audioRef.current.load();

        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.warn("Autoplay prevented:", e);
          });
        }
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      }
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      }
    };
  }, [playingPlayerId, players]);

  // Filter players based on search term
  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.playerId && player.playerId.toString().includes(searchTerm))
  );

  const handlePlayerClick = (player) => {
    if (playingPlayerId === player.id) {
      audioRef.current.pause();
      setPlayingPlayerId(null);
    } else {
      setPlayingPlayerId(player.id);
    }
  };

  const handlePlayerAdded = () => {
    setIsAddPlayerModalOpen(false);
  };

  // Conditional rendering for authentication loading
  if (authLoading) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">
        Loading authentication...
      </div>
    );
  }

  // Conditional rendering for unauthenticated admin access
  if (!currentUserId && userRole === 'admin') {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">
        Please log in to manage players as an admin.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen p-4 md:p-6">
      <audio ref={audioRef} />

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
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6 text-center md:text-left">Players List</h1>

          {/* Filters */}
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search by name or player ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded-lg p-2 w-full bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="border rounded-lg p-2 w-full bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!teams.length}
              >
                <option value="">Select a Team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.teamName}>{team.teamName}</option>
                ))}
              </select>
            </div>
            {/* {userRole === 'admin' && currentUserId && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddPlayerModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add New Player
              </motion.button>
            )} */}
          </div>

          {/* Loading/Error/No players message */}
          {loadingTeams || loadingPlayers ? (
            <div className="text-center text-gray-400 text-xl py-8">Loading...</div>
          ) : teamsError || error ? (
            <div className="text-center text-red-500 text-xl py-8">{teamsError || error}</div>
          ) : teams.length === 0 ? (
            <p className="text-white text-center col-span-full">No teams found. Please create a team first.</p>
          ) : !teamFilter ? (
            <p className="text-white text-center col-span-full">Please select a team to view players.</p>
          ) : filteredPlayers.length === 0 ? (
            <p className="text-white text-center col-span-full">No players found for this team.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`bg-gray-800 rounded-lg shadow-lg overflow-hidden border p-4 relative
                    ${playingPlayerId === player.id ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-700 hover:border-blue-500 transition'}`}
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4"
                    onClick={() => handlePlayerClick(player)}
                  >
                    <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-gray-600 flex-shrink-0">
                      <img
                        src={player.image || 'https://via.placeholder.com/150'}
                        alt={player.name || 'N/A'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <h2 className="text-xl font-bold text-white">{player.name || 'N/A'}</h2>
                      <p className="text-gray-400 text-sm">Player ID: <span className="font-medium text-blue-300">{player.playerId || 'N/A'}</span></p>
                      <p className="text-gray-400 text-sm">Role: <span className="font-medium text-gray-300">{player.role || 'N/A'}</span></p>
                      <p className="text-gray-400 text-sm">Runs: <span className="font-medium text-purple-300">{player.careerStats?.batting?.runs || player.runs || 'N/A'}</span></p>
                      <p className="text-gray-400 text-sm">Wickets: <span className="font-medium text-green-300">{player.careerStats?.bowling?.wickets || player.wickets || 'N/A'}</span></p>
                    </div>
                  </div>

                  {playingPlayerId === player.id && (
                    <div className="absolute top-2 right-2 text-blue-400 animate-pulse">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.616 3.076a1 1 0 011.09.217L18.414 7H20a1 1 0 011 1v4a1 1 0 01-1 1h-1.586l-2.707 2.707A1 1 0 0114 16V4a1 1 0 01.616-.924z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Player Modal  */}
      {/* {isAddPlayerModalOpen && userRole === 'admin' && currentUserId && (
        <AddPlayerModal
          onClose={() => setIsAddPlayerModalOpen(false)}
          onPlayerAdded={handlePlayerAdded}
          clubName={clubName}
        />
      )} */}
    </div>
  );
};

export default PlayersList;
