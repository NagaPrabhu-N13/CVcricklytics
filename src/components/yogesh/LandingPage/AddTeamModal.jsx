import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '../../../firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useClub } from './ClubContext'; // Import the context hook

const AddTeamModal = ({ onClose, onTeamAdded }) => {
  const { clubName } = useClub(); // Get clubName from context
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [matchesPlayed, setMatchesPlayed] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [points, setPoints] = useState(0);
  const [lastMatchResult, setLastMatchResult] = useState('');
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [tournamentsError, setTournamentsError] = useState(null);

  // Fetch current user ID
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setTournaments([]);
        setTournamentsError('You must be logged in to add a team.');
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch tournaments for the current user
  useEffect(() => {
    if (!currentUserId) {
      setTournamentsLoading(false);
      setTournaments([]);
      return;
    }

    setTournamentsLoading(true);
    setTournamentsError(null);

    const q = query(
      collection(db, 'tournaments'),
      where('userId', '==', currentUserId)
    );

    const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const fetchedTournaments = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setTournaments(fetchedTournaments);
        // Set the first tournament as default if none selected
        if (fetchedTournaments.length > 0 && !selectedTournamentId) {
          setSelectedTournamentId(fetchedTournaments[0].id);
        }
      } else {
        setTournaments([]);
        setSelectedTournamentId('');
        setTournamentsError('No tournaments found. Please create a tournament first.');
      }
      setTournamentsLoading(false);
    }, (err) => {
      console.error('Error fetching tournaments:', err);
      setTournamentsError('Failed to load tournaments: ' + err.message);
      setTournamentsLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [currentUserId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validation
    if (!teamName || !captainName || !selectedTournamentId) {
      setError('Team Name, Captain, and Tournament are required.');
      setLoading(false);
      return;
    }

    try {
      // Find the selected tournament to get its name
      const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);
      if (!selectedTournament) {
        setError('Selected tournament not found.');
        setLoading(false);
        return;
      }

      const newTeam = {
        teamName: teamName,
        captain: captainName,
        matches: parseInt(matchesPlayed),
        wins: parseInt(wins),
        losses: parseInt(losses),
        points: parseInt(points),
        lastMatch: lastMatchResult,
        tournamentId: selectedTournamentId,
        tournamentName: selectedTournament.name, // Add tournamentName to the team data
        createdBy: currentUserId,
        userId: currentUserId,
        createdAt: new Date(),
        clubName: clubName || '', // Store clubName from context, default to empty string if undefined
      };

      await addDoc(collection(db, 'clubTeams'), newTeam);
      setSuccess(true);
      // Clear form
      setTeamName('');
      setCaptainName('');
      setMatchesPlayed(0);
      setWins(0);
      setLosses(0);
      setPoints(0);
      setLastMatchResult('');
      setSelectedTournamentId(tournaments.length > 0 ? tournaments[0].id : '');

      onTeamAdded();
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error('Error adding team:', err);
      setError('Failed to add team: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || tournamentsLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      >
        <div className="text-white text-lg">Loading...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Add New Team</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-300">Team Name</label>
            <input
              type="text"
              id="teamName"
              className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="captainName" className="block text-sm font-medium text-gray-300">Captain Name</label>
            <input
              type="text"
              id="captainName"
              className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="clubName" className="block text-sm font-medium text-gray-300">Club Name (from context)</label>
            <input
              type="text"
              id="clubName"
              value={clubName || 'No club selected'}
              className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white opacity-50"
              disabled
            />
          </div>
          <div>
            <label htmlFor="tournament" className="block text-sm font-medium text-gray-300">Tournament</label>
            <select
              id="tournament"
              className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              required
              disabled={tournaments.length === 0}
            >
              {tournaments.length === 0 ? (
                <option value="">No tournaments available</option>
              ) : (
                tournaments.map(tournament => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))
              )}
            </select>
            {tournamentsError && <p className="text-red-500 text-xs mt-1">{tournamentsError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="matchesPlayed" className="block text-sm font-medium text-gray-300">Matches Played</label>
              <input
                type="number"
                id="matchesPlayed"
                className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={matchesPlayed}
                onChange={(e) => setMatchesPlayed(e.target.value)}
                min="0"
              />
            </div>
            <div>
              <label htmlFor="wins" className="block text-sm font-medium text-gray-300">Wins</label>
              <input
                type="number"
                id="wins"
                className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                min="0"
              />
            </div>
            <div>
              <label htmlFor="losses" className="block text-sm font-medium text-gray-300">Losses</label>
              <input
                type="number"
                id="losses"
                className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={losses}
                onChange={(e) => setLosses(e.target.value)}
                min="0"
              />
            </div>
            <div>
              <label htmlFor="points" className="block text-sm font-medium text-gray-300">Points</label>
              <input
                type="number"
                id="points"
                className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                min="0"
              />
            </div>
          </div>
          <div>
            <label htmlFor="lastMatchResult" className="block text-sm font-medium text-gray-300">Last Match Result</label>
            <input
              type="text"
              id="lastMatchResult"
              className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              value={lastMatchResult}
              onChange={(e) => setLastMatchResult(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {success && <p className="text-green-500 text-sm mt-2">Team added successfully!</p>}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || tournaments.length === 0}
            >
              {loading ? 'Adding Team...' : 'Add Team'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddTeamModal;