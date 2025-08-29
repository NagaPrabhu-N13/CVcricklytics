import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '../../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useClub } from './ClubContext';

const AddTeamModal = ({ onClose, onTeamAdded }) => {
  const { clubName } = useClub();          // club context
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [matchesPlayed, setMatchesPlayed] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [points, setPoints] = useState(0);
  const [lastMatchResult, setLastMatchResult] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  AUTH: get current user                                            */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setCurrentUserId(user ? user.uid : null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  /* ------------------------------------------------------------------ */
  /*  SUBMIT                                                             */
  /* ------------------------------------------------------------------ */
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!teamName.trim() || !captainName.trim()) {
      setError('Team name and captain are required.');
      setLoading(false);
      return;
    }
    if (!currentUserId) {
      setError('You must be logged in to add a team.');
      setLoading(false);
      return;
    }

    try {
      const newTeam = {
        teamName,
        captain: captainName,
        matches: Number(matchesPlayed),
        wins: Number(wins),
        losses: Number(losses),
        points: Number(points),
        lastMatch: lastMatchResult,
        createdBy: currentUserId,
        userId: currentUserId,
        createdAt: new Date(),
        clubName: clubName || '',
      };

      await addDoc(collection(db, 'clubTeams'), newTeam);

      setSuccess(true);
      onTeamAdded?.();

      /* reset form */
      setTeamName('');
      setCaptainName('');
      setMatchesPlayed(0);
      setWins(0);
      setLosses(0);
      setPoints(0);
      setLastMatchResult('');

      setTimeout(onClose, 1500);
    } catch (err) {
      console.error('Error adding team:', err);
      setError('Failed to add team: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                             */
  /* ------------------------------------------------------------------ */
  if (authLoading) {
    return (
      <motion.div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="text-white text-lg">Loading...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
          Add New Team
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team name */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Team Name</label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              required
            />
          </div>

          {/* Captain */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Captain Name</label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
              value={captainName}
              onChange={e => setCaptainName(e.target.value)}
              required
            />
          </div>

          {/* Club (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Club Name</label>
            <input
              type="text"
              value={clubName || 'No club selected'}
              className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white opacity-50"
              disabled
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Matches Played" value={matchesPlayed} onChange={setMatchesPlayed} />
            <NumberField label="Wins"            value={wins}           onChange={setWins} />
            <NumberField label="Losses"          value={losses}         onChange={setLosses} />
            <NumberField label="Points"          value={points}         onChange={setPoints} />
          </div>

          {/* Last match */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Last Match Result</label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
              value={lastMatchResult}
              onChange={e => setLastMatchResult(e.target.value)}
            />
          </div>

          {error   && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">Team added successfully!</p>}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Adding Team…' : 'Add Team'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

/* Reusable small number input */
const NumberField = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300">{label}</label>
    <input
      type="number"
      min="0"
      className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

export default AddTeamModal;
