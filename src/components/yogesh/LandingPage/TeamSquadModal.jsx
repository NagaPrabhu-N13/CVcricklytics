import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../../../firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useClub } from './ClubContext';

const TeamSquadModal = ({ team, tournament, onClose }) => {
  const { clubName } = useClub();
  const [players, setPlayers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setError('Please log in to view the squad.');
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUserId || !clubName) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchPlayers = async () => {
      try {
        // Fetch players from PlayerDetails with matching teamName and clubName
        const playersQuery = query(
          collection(db, 'PlayerDetails'),
          where('teamName', '==', team.teamName),
          where('clubName', '==', clubName)
        );
        const unsubscribe = onSnapshot(playersQuery, (playersSnapshot) => {
          const fetchedPlayers = playersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPlayers(fetchedPlayers);
          if (fetchedPlayers.length === 0) {
            setError('No players found for this team.');
          } else {
            setError(null);
          }
          setLoading(false);
        }, (err) => {
          console.error('Error fetching players:', err);
          setError('Failed to load squad: ' + err.message);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error('Error fetching squad data:', err);
        setError('Failed to load squad: ' + err.message);
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [currentUserId, team, clubName]);

  if (!team) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
            <h2 className="text-2xl font-bold text-purple-400">Squad: {team.teamName}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-3xl font-light"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading squad...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : players.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No players found for this team.</div>
          ) : (
            <ul className="space-y-4">
              {players.map((player) => (
                <li
                  key={player.id}
                  className="flex items-center space-x-4 bg-gray-700 p-3 rounded-md"
                >
                  <img
                    src={player.image || 'https://ui-avatars.com/api/?name=Player&size=60'}
                    alt={player.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{player.name}</h3>
                    <p className="text-gray-300 text-sm">Role: {player.role || 'N/A'}</p>
                    {player.careerStats?.batting?.runs > 0 && (
                      <p className="text-purple-300 text-xs">
                        Runs: {player.careerStats.batting.runs}
                      </p>
                    )}
                    {player.careerStats?.bowling?.wickets > 0 && (
                      <p className="text-green-300 text-xs">
                        Wickets: {player.careerStats.bowling.wickets}
                      </p>
                    )}
                    {(!player.careerStats?.batting?.runs &&
                      !player.careerStats?.bowling?.wickets) && (
                      <p className="text-gray-400 text-xs">No stats available</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TeamSquadModal;
