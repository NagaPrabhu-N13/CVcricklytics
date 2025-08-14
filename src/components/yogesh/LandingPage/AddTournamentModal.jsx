import React, { useState } from 'react';
import { db } from '../../../firebase'; // Adjust path based on your file structure
import { doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useClub } from './ClubContext'; // Import the context hook

const AddTournamentModal = ({ onClose, onTournamentAdded, currentUserId }) => {
  const { clubName } = useClub(); // Get clubName from context
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    season: '',
    teams: '',
    matches: '',
    startDate: '',
    endDate: '',
    currentStage: '',
    defendingChampion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
// AddTournamentModal.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setSuccess(false);

  if (!currentUserId) {
    setError("No authenticated user found. Please log in.");
    setLoading(false);
    return;
  }

  const tournamentName = formData.name.trim();
  if (!tournamentName) {
    setError("Tournament name cannot be empty.");
    setLoading(false);
    return;
  }

  try {
    const tournamentId = `${tournamentName.toLowerCase().replace(/\s+/g, '_')}_${formData.season.replace(/\s+/g, '_')}`;

    const dataToSave = {
      ...formData,
      teams: parseInt(formData.teams) || 0,
      matches: parseInt(formData.matches) || 0,
      createdAt: new Date(),
      userId: currentUserId,
      clubName: clubName || '',
    };

    // Save to Firestore
    await setDoc(doc(db, "tournaments", tournamentId), dataToSave);

    // Pass the new tournament data back to the parent
    onTournamentAdded({
      id: tournamentId,
      ...dataToSave,
    });

    setSuccess(true);

    setTimeout(() => {
      setFormData({
        name: '',
        location: '',
        season: '',
        teams: '',
        matches: '',
        startDate: '',
        endDate: '',
        currentStage: '',
        defendingChampion: '',
      });
      onClose();
    }, 1500);
  } catch (err) {
    console.error("Error adding tournament:", err);
    setError("Failed to add tournament: " + err.message);
  } finally {
    setLoading(false);
  }
};
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-gray-700 overflow-y-auto max-h-[90vh]"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Add New Tournament</h2>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4">Tournament added successfully!</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-gray-300">Tournament Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-300">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-300">Season (e.g., 2023-24)</label>
              <input
                type="text"
                name="season"
                value={formData.season}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-gray-300">Number of Teams</label>
                <input
                  type="number"
                  name="teams"
                  value={formData.teams}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Number of Matches</label>
                <input
                  type="number"
                  name="matches"
                  value={formData.matches}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-gray-300">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-gray-300">Current Stage (e.g., Group Stage, Knockout Round)</label>
              <input
                type="text"
                name="currentStage"
                value={formData.currentStage}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-300">Defending Champion</label>
              <input
                type="text"
                name="defendingChampion"
                value={formData.defendingChampion}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-300">Club Name (from context)</label>
              <input
                type="text"
                value={clubName || 'No club selected'}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white opacity-50"
                disabled
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Adding Tournament...' : 'Add Tournament'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddTournamentModal;