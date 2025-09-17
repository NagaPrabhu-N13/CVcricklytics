import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, setDoc, getDocs, collection, query, where, updateDoc, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

const storage = getStorage();

const uploadFile = async (file, filePath) => {
  if (!file) return null;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

const generateUniquePlayerId = async () => {
  const playersCollectionRef = collection(db, 'PlayerDetails');
  const snapshot = await getDocs(playersCollectionRef);
  const existingIds = snapshot.docs.map(doc => doc.data().playerId).filter(id => id);

  let newId;
  do {
    newId = Math.floor(100000 + Math.random() * 900000);
  } while (existingIds.includes(newId));

  return newId;
};

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-500 text-center p-4">
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const AddPlayer = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = location.state?.userProfile || null;
  
  const [playerFormData, setPlayerFormData] = useState({
    playerId: '',
    name: '',
    image: '',
    teamName: '',
    role: '',
    age: '',
    battingStyle: '',
    bowlingStyle: '',
    matches: '0',
    runs: '0',
    highestScore: '0',
    average: '0',
    strikeRate: '0',
    centuries: '0',
    fifties: '0',
    wickets: '0',
    bestBowling: '0',
    bio: '',
    recentMatches: '',
    careerStatsBattingMatches: '0',
    careerStatsBattingInnings: '0',
    careerStatsBattingNotOuts: '0',
    careerStatsBattingRuns: '0',
    careerStatsBattingHighest: '0',
    careerStatsBattingAverage: '0',
    careerStatsBattingStrikeRate: '0',
    careerStatsBattingCenturies: '0',
    careerStatsBattingFifties: '0',
    careerStatsBattingFours: '0',
    careerStatsBattingSixes: '0',
    careerStatsBowlingInnings: '0',
    careerStatsBowlingWickets: '0',
    careerStatsBowlingBest: '0',
    careerStatsBowlingAverage: '0',
    careerStatsBowlingEconomy: '0',
    careerStatsBowlingStrikeRate: '0',
    careerStatsFieldingCatches: '0',
    careerStatsFieldingStumpings: '0',
    careerStatsFieldingRunOuts: '0',
    user: 'yes',
    audioUrl: '',
  });

  const [playerImageFile, setPlayerImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Handle authentication state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setError("You must be logged in to add a player.");
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Generate playerId when the modal mounts
// In AddPlayer.jsx, update the useEffect to handle the passed playerId
useEffect(() => {
  const setPlayerId = async () => {
    // Check if we received a playerId from navigation state
    if (location.state?.playerId) {
      setPlayerFormData(prev => ({ ...prev, playerId: location.state.playerId }));
    } 
    // If user already has a player ID, use that
    else if (userProfile?.playerId) {
      setPlayerFormData(prev => ({ ...prev, playerId: userProfile.playerId }));
    } else {
      // Otherwise generate a new one
      const newId = await generateUniquePlayerId();
      setPlayerFormData(prev => ({ ...prev, playerId: newId.toString() }));
    }
  };
  setPlayerId();
}, [userProfile, location.state]);
  const handlePlayerChange = (e) => {
    const { name, value } = e.target;
    setPlayerFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlayerImageFileChange = (e) => {
    if (e.target.files[0]) {
      setPlayerImageFile(e.target.files[0]);
    } else {
      setPlayerImageFile(null);
    }
  };

  const handlePlayerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!currentUserId) {
      setError("You must be logged in to add a player.");
      setLoading(false);
      return;
    }

    const playerName = playerFormData.name.trim();
    if (!playerName) {
      setError("Player name cannot be empty.");
      setLoading(false);
      return;
    }

    if (!playerFormData.teamName) {
      setError("Team name is required.");
      setLoading(false);
      return;
    }

    let uploadedImageUrl = playerFormData.image;
    try {
      if (playerImageFile) {
        const filePath = `player_photos/${playerName.toLowerCase().replace(/\s+/g, '_')}_${playerImageFile.name}`;
        uploadedImageUrl = await uploadFile(playerImageFile, filePath);
        if (!uploadedImageUrl) {
          throw new Error("Failed to upload player image.");
        }
      }

      const recentMatchesParsed = playerFormData.recentMatches
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length === 4) {
            return {
              opponent: parts[0],
              runs: parseInt(parts[1]) || 0,
              wickets: parseInt(parts[2]) || 0,
              result: parts[3]
            };
          }
          console.warn(`Skipping malformed recent match line: ${line}`);
          return null;
        })
        .filter(item => item !== null);

      const playerData = {
        playerId: parseInt(playerFormData.playerId),
        name: playerName,
        image: uploadedImageUrl,
        teamName: playerFormData.teamName,
        role: playerFormData.role,
        age: parseInt(playerFormData.age) || 0,
        battingStyle: playerFormData.battingStyle,
        bowlingStyle: playerFormData.bowlingStyle,
        matches: parseInt(playerFormData.matches) || 0,
        runs: parseInt(playerFormData.runs) || 0,
        highestScore: parseInt(playerFormData.highestScore) || 0,
        average: parseFloat(playerFormData.average) || 0,
        strikeRate: parseFloat(playerFormData.strikeRate) || 0,
        centuries: parseInt(playerFormData.centuries) || 0,
        fifties: parseInt(playerFormData.fifties) || 0,
        wickets: parseInt(playerFormData.wickets) || 0,
        bestBowling: playerFormData.bestBowling || '',
        bio: playerFormData.bio || '',
        recentMatches: recentMatchesParsed,
        userId: currentUserId,
        user: playerFormData.user,
        audioUrl: playerFormData.audioUrl || '',
        careerStats: {
          batting: {
            matches: parseInt(playerFormData.careerStatsBattingMatches) || 0,
            innings: parseInt(playerFormData.careerStatsBattingInnings) || 0,
            notOuts: parseInt(playerFormData.careerStatsBattingNotOuts) || 0,
            runs: parseInt(playerFormData.careerStatsBattingRuns) || 0,
            highest: parseInt(playerFormData.careerStatsBattingHighest) || 0,
            average: parseFloat(playerFormData.careerStatsBattingAverage) || 0,
            strikeRate: parseFloat(playerFormData.careerStatsBattingStrikeRate) || 0,
            centuries: parseInt(playerFormData.careerStatsBattingCenturies) || 0,
            fifties: parseInt(playerFormData.careerStatsBattingFifties) || 0,
            fours: parseInt(playerFormData.careerStatsBattingFours) || 0,
            sixes: parseInt(playerFormData.careerStatsBattingSixes) || 0,
          },
          bowling: {
            innings: parseInt(playerFormData.careerStatsBowlingInnings) || 0,
            wickets: parseInt(playerFormData.careerStatsBowlingWickets) || 0,
            best: playerFormData.careerStatsBowlingBest || '',
            average: parseFloat(playerFormData.careerStatsBowlingAverage) || 0,
            economy: parseFloat(playerFormData.careerStatsBowlingEconomy) || 0,
            strikeRate: parseFloat(playerFormData.careerStatsBowlingStrikeRate) || 0,
          },
          fielding: {
            catches: parseInt(playerFormData.careerStatsFieldingCatches) || 0,
            stumpings: parseInt(playerFormData.careerStatsFieldingStumpings) || 0,
            runOuts: parseInt(playerFormData.careerStatsFieldingRunOuts) || 0,
          }
        }
      };

      const playerId = playerFormData.playerId;
      
      // Save player to PlayerDetails collection
      await setDoc(doc(db, "PlayerDetails", playerId), playerData);

      // Add player to clubTeams collection
      const teamQuery = query(
        collection(db, 'clubTeams'),
        where('teamName', '==', playerFormData.teamName),
        where('createdBy', '==', currentUserId)
      );
      const teamSnapshot = await getDocs(teamQuery);

      if (!teamSnapshot.empty) {
        // Team exists, append player to players array
        const teamDoc = teamSnapshot.docs[0];
        await updateDoc(doc(db, 'clubTeams', teamDoc.id), {
          players: arrayUnion(playerData)
        });
      } else {
        // Team doesn't exist, create new team with player
        await setDoc(doc(collection(db, 'clubTeams')), {
          teamName: playerFormData.teamName,
          createdBy: currentUserId,
          createdAt: new Date(),
          players: [playerData],
          captain: '',
          matches: 0,
          wins: 0,
          losses: 0,
          points: 0,
          lastMatch: '',
        });
      }

      // If user didn't have a player ID, update their profile
      if (!userProfile?.playerId) {
        await updateDoc(doc(db, "users", currentUserId), {
          playerId: playerFormData.playerId
        });
      }

      setSuccess(true);

      const newId = await generateUniquePlayerId();
      setPlayerFormData({
        playerId: newId.toString(),
        name: '',
        image: '',
        teamName: '',
        role: 'player',
        age: '',
        battingStyle: '',
        bowlingStyle: '',
        matches: '0',
        runs: '0',
        highestScore: '0',
        average: '0',
        strikeRate: '0',
        centuries: '0',
        fifties: '0',
        wickets: '0',
        bestBowling: '0',
        bio: '',
        recentMatches: '',
        careerStatsBattingMatches: '0',
        careerStatsBattingInnings: '0',
        careerStatsBattingNotOuts: '0',
        careerStatsBattingRuns: '0',
        careerStatsBattingHighest: '0',
        careerStatsBattingAverage: '0',
        careerStatsBattingStrikeRate: '0',
        careerStatsBattingCenturies: '0',
        careerStatsBattingFifties: '0',
        careerStatsBattingFours: '0',
        careerStatsBattingSixes: '0',
        careerStatsBowlingInnings: '0',
        careerStatsBowlingWickets: '0',
        careerStatsBowlingBest: '0',
        careerStatsBowlingAverage: '0',
        careerStatsBowlingEconomy: '0',
        careerStatsBowlingStrikeRate: '0',
        careerStatsFieldingCatches: '0',
        careerStatsFieldingStumpings: '0',
        careerStatsFieldingRunOuts: '0',
        user: 'yes',
        audioUrl: '',
      });
      setPlayerImageFile(null);

      // Navigate to previous route after success
      setTimeout(() => {
        if (typeof onClose === 'function') {
          onClose();
        } else {
          console.warn('onClose is not a function, skipping modal close');
        }
        navigate(-1);
      }, 1500);
    } catch (err) {
      console.error("Error adding player:", err);
      setError("Failed to add player: " + err.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (typeof onClose === 'function') {
      onClose();
    } else {
      console.warn('onClose is not a function, skipping modal close');
    }
    navigate(-1);
  };

  if (authLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-gray-700"
        >
          <p className="text-white text-center">Loading authentication...</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <ErrorBoundary>
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
            className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-gray-700 overflow-y-auto max-h-[90vh]"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Add New Player</h2>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-4">Player added successfully!</p>}

            <form onSubmit={handlePlayerSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-gray-300">Player ID</label>
                  <input
                    type="text"
                    name="playerId"
                    value={playerFormData.playerId}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 opacity-75"
                  />
                  <div className="mt-2 flex items-center gap-4">
                    <label className="text-gray-300">User</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="user"
                          value="yes"
                          checked={playerFormData.user === 'yes'}
                          onChange={handlePlayerChange}
                          className="mr-2 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-gray-300">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="user"
                          value="no"
                          checked={playerFormData.user === 'no'}
                          onChange={handlePlayerChange}
                          className="mr-2 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-gray-300">No</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={playerFormData.name}
                    onChange={handlePlayerChange}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Team Name</label>
                  <input
                    type="text"
                    name="teamName"
                    value={playerFormData.teamName}
                    onChange={handlePlayerChange}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Player Image (Upload)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePlayerImageFileChange}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {playerImageFile && <p className="text-sm mt-1 text-gray-400">Selected: {playerImageFile.name}</p>}
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Or Paste Player Image URL (Optional fallback)</label>
                  <input
                    type="text"
                    name="image"
                    value={playerFormData.image}
                    onChange={handlePlayerChange}
                    placeholder="https://example.com/player.png"
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Role (e.g., Top Order Batsman)</label>
                  <input
                    type="text"
                    name="role"
                    value={playerFormData.role}
                    onChange={handlePlayerChange}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={playerFormData.age}
                    onChange={handlePlayerChange}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Batting Style (e.g., Right Handed Bat)</label>
                  <input
                    type="text"
                    name="battingStyle"
                    value={playerFormData.battingStyle}
                    onChange={handlePlayerChange}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Bowling Style (e.g., Right Arm Off Spin)</label>
                  <input
                    type="text"
                    name="bowlingStyle"
                    value={playerFormData.bowlingStyle}
                    onChange={handlePlayerChange}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-gray-300">Recent Matches (one per line, format: "Opponent, Runs, Wickets, Result")</label>
                <textarea
                  name="recentMatches"
                  value={playerFormData.recentMatches}
                  onChange={handlePlayerChange}
                  rows="4"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Jaipur Strikers, 98, 1, Won by 28 runs\nLUT Biggieagles XI, 64, 0, Lost by 5 wickets`}
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Bio</label>
                <textarea
                  name="bio"
                  value={playerFormData.bio}
                  onChange={handlePlayerChange}
                  rows="3"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <h3 className="text-lg font-bold text-white mt-6 border-t border-gray-700 pt-4">Career Stats - Batting</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-gray-300">Matches</label>
                  <input
                    type="number"
                    name="careerStatsBattingMatches"
                    value={playerFormData.careerStatsBattingMatches}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Innings</label>
                  <input
                    type="number"
                    name="careerStatsBattingInnings"
                    value={playerFormData.careerStatsBattingInnings}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Not Outs</label>
                  <input
                    type="number"
                    name="careerStatsBattingNotOuts"
                    value={playerFormData.careerStatsBattingNotOuts}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Runs</label>
                  <input
                    type="number"
                    name="careerStatsBattingRuns"
                    value={playerFormData.careerStatsBattingRuns}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Highest Score</label>
                  <input
                    type="number"
                    name="careerStatsBattingHighest"
                    value={playerFormData.careerStatsBattingHighest}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Average</label>
                  <input
                    type="number"
                    step="0.01"
                    name="careerStatsBattingAverage"
                    value={playerFormData.careerStatsBattingAverage}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Strike Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    name="careerStatsBattingStrikeRate"
                    value={playerFormData.careerStatsBattingStrikeRate}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Centuries</label>
                  <input
                    type="number"
                    name="careerStatsBattingCenturies"
                    value={playerFormData.careerStatsBattingCenturies}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Fifties</label>
                  <input
                    type="number"
                    name="careerStatsBattingFifties"
                    value={playerFormData.careerStatsBattingFifties}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Fours</label>
                  <input
                    type="number"
                    name="careerStatsBattingFours"
                    value={playerFormData.careerStatsBattingFours}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Sixes</label>
                  <input
                    type="number"
                    name="careerStatsBattingSixes"
                    value={playerFormData.careerStatsBattingSixes}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mt-6 border-t border-gray-700 pt-4">Career Stats - Bowling</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-gray-300">Innings</label>
                  <input
                    type="number"
                    name="careerStatsBowlingInnings"
                    value={playerFormData.careerStatsBowlingInnings}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Wickets</label>
                  <input
                    type="number"
                    name="careerStatsBowlingWickets"
                    value={playerFormData.careerStatsBowlingWickets}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Best Bowling</label>
                  <input
                    type="text"
                    name="careerStatsBowlingBest"
                    value={playerFormData.careerStatsBowlingBest}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Average</label>
                  <input
                    type="number"
                    step="0.01"
                    name="careerStatsBowlingAverage"
                    value={playerFormData.careerStatsBowlingAverage}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Economy</label>
                  <input
                    type="number"
                    step="0.01"
                    name="careerStatsBowlingEconomy"
                    value={playerFormData.careerStatsBowlingEconomy}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Strike Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    name="careerStatsBowlingStrikeRate"
                    value={playerFormData.careerStatsBowlingStrikeRate}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mt-6 border-t border-gray-700 pt-4">Career Stats - Fielding</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-gray-300">Catches</label>
                  <input
                    type="number"
                    name="careerStatsFieldingCatches"
                    value={playerFormData.careerStatsFieldingCatches}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Stumpings</label>
                  <input
                    type="number"
                    name="careerStatsFieldingStumpings"
                    value={playerFormData.careerStatsFieldingStumpings}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Run Outs</label>
                  <input
                    type="number"
                    name="careerStatsFieldingRunOuts"
                    value={playerFormData.careerStatsFieldingRunOuts}
                    readOnly
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none opacity-75"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  disabled={loading || !currentUserId}
                >
                  {loading ? 'Adding Player...' : 'Add Player'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </ErrorBoundary>
  );
};

export default AddPlayer;