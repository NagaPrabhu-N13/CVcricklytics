import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../../firebase'; // Adjust path as needed
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useClub } from './ClubContext'; // Import the context hook

const AddMatchModal = ({ onClose, onMatchAdded, tournamentId, tournamentName, currentUserId }) => {
  const { clubName } = useClub(); // Get clubName from context
  const [matchData, setMatchData] = useState({
    tournamentId: tournamentId || '', // Pre-fill with prop or empty
    tournamentName: tournamentName || '', // Pre-fill with prop or empty
    location: '',
    date: '',
    overs: '',
    status: 'UPCOMING', // Default status
    stage: '',
    team1: '',
    score1: '',
    team2: '',
    score2: '',
    result: '',
  });
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  // Fetch tournaments for the current user
  useEffect(() => {
    if (!currentUserId) {
      setTournaments([]);
      setLoadingTournaments(false);
      setError("You must be logged in to fetch tournaments.");
      return;
    }

    const fetchTournaments = async () => {
      try {
        const q = query(
          collection(db, "tournaments"),
          where("userId", "==", currentUserId)
        );
        const querySnapshot = await getDocs(q);
        const tournamentList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setTournaments(tournamentList);
        if (tournamentList.length === 0) {
          setError("No tournaments found. Please create a tournament first.");
        }
      } catch (err) {
        console.error("Error fetching tournaments:", err);
        setError("Failed to load tournaments: " + err.message);
      } finally {
        setLoadingTournaments(false);
      }
    };

    fetchTournaments();
  }, [currentUserId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'tournamentName') {
      // Update both tournamentName and tournamentId based on selection
      const selectedTournament = tournaments.find(t => t.name === value);
      setMatchData((prevData) => ({
        ...prevData,
        tournamentName: value,
        tournamentId: selectedTournament ? selectedTournament.id : '',
      }));
    } else {
      setMatchData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (!matchData.tournamentId || !matchData.tournamentName || !matchData.team1 || !matchData.team2 || !matchData.date) {
      setError("Please fill in all required fields (Tournament, Teams, Date).");
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "tournamentMatches"), {
        ...matchData,
        createdAt: serverTimestamp(),
        userId: currentUserId,
        createdBy: currentUserId, // Store the ID of the admin who added the match
        clubName: clubName || '', // Store clubName from context, default to empty string if undefined
      });
      onMatchAdded(); // Close modal and potentially refresh data
    } catch (err) {
      console.error("Error adding match:", err);
      setError("Failed to add match: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={modalVariants}
    >
      <motion.div
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700 overflow-y-auto max-h-[90vh]"
        initial={{ y: "-100vh" }}
        animate={{ y: "0" }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center">Add New Match</h2>
        {loadingTournaments && <p className="text-gray-400 text-center mb-4">Loading tournaments...</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tournamentName" className="block text-gray-300 text-sm font-bold mb-2">Tournament:</label>
            <select
              id="tournamentName"
              name="tournamentName"
              value={matchData.tournamentName}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
              disabled={loadingTournaments || tournaments.length === 0}
              required
            >
              <option value="">Select a Tournament</option>
              {tournaments.map(tournament => (
                <option key={tournament.id} value={tournament.name}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="clubName" className="block text-gray-300 text-sm font-bold mb-2">Club Name (from context):</label>
            <input
              type="text"
              id="clubName"
              value={clubName || 'No club selected'}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight bg-gray-700 border-gray-600 opacity-50"
              disabled
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-gray-300 text-sm font-bold mb-2">Location:</label>
            <input
              type="text"
              id="location"
              name="location"
              value={matchData.location}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
              placeholder="e.g., Ranveer Singh Cricket Stadium, Jaipur"
              required
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-gray-300 text-sm font-bold mb-2">Date (DD-MMM-YY):</label>
            <input
              type="text"
              id="date"
              name="date"
              value={matchData.date}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
              placeholder="e.g., 13-Feb-22"
              required
            />
          </div>
          <div>
            <label htmlFor="overs" className="block text-gray-300 text-sm font-bold mb-2">Overs:</label>
            <input
              type="text"
              id="overs"
              name="overs"
              value={matchData.overs}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
              placeholder="e.g., 20 Ov."
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-gray-300 text-sm font-bold mb-2">Status:</label>
            <select
              id="status"
              name="status"
              value={matchData.status}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
            >
              <option value="LIVE">LIVE</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="PAST">PAST</option>
            </select>
          </div>
          <div>
            <label htmlFor="stage" className="block text-gray-300 text-sm font-bold mb-2">Stage:</label>
            <input
              type="text"
              id="stage"
              name="stage"
              value={matchData.stage}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
              placeholder="e.g., FINAL, SEMI FINAL"
            />
          </div>
          <div>
            <label htmlFor="team1" className="block text-gray-300 text-sm font-bold mb-2">Team 1 Name:</label>
            <input
              type="text"
              id="team1"
              name="team1"
              value={matchData.team1}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
              placeholder="e.g., Alejha Warriors XI"
              required
            />
          </div>
          <div>
            <label htmlFor="score1" className="block text-gray-300 text-sm font-bold mb-2">Team 1 Score:</label>
            <input
              type="text"
              id="score1"
              name="score1"
              value={matchData.score1}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
              placeholder="e.g., 144/9 (20.0)"
            />
          </div>
          <div>
            <label htmlFor="team2" className="block text-gray-300 text-sm font-bold mb-2">Team 2 Name:</label>
            <input
              type="text"
              id="team2"
              name="team2"
              value={matchData.team2}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
              placeholder="e.g., LUT Biggieagles XI"
              required
            />
          </div>
          <div>
            <label htmlFor="score2" className="block text-gray-300 text-sm font-bold mb-2">Team 2 Score:</label>
            <input
              type="text"
              id="score2"
              name="score2"
              value={matchData.score2}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
              placeholder="e.g., 169/8 (20.0)"
            />
          </div>
          <div>
            <label htmlFor="result" className="block text-gray-300 text-sm font-bold mb-2">Result:</label>
            <textarea
              id="result"
              name="result"
              value={matchData.result}
              onChange={handleChange}
              rows="2"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
              placeholder="e.g., LUT Biggieagles XI won by 25 runs"
            ></textarea>
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              disabled={loading || loadingTournaments || tournaments.length === 0}
            >
              {loading ? 'Adding...' : 'Add Match'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddMatchModal;