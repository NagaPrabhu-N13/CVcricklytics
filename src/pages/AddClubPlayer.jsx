import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDocs, collection, query, where, updateDoc, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useClub } from '../components/yogesh/LandingPage/ClubContext'; // Import the context hook

const storage = getStorage();

const uploadFile = async (file, filePath) => {
  if (!file) return null;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

const generateUniquePlayerId = async () => {
  const playersCollectionRef = collection(db, 'clubPlayers');
  const playerDetailsCollectionRef = collection(db, 'PlayerDetails');
  const [clubPlayersSnapshot, playerDetailsSnapshot] = await Promise.all([
    getDocs(playersCollectionRef),
    getDocs(playerDetailsCollectionRef),
  ]);
  const existingIds = [
    ...clubPlayersSnapshot.docs.map(doc => doc.data().playerId).filter(id => id),
    ...playerDetailsSnapshot.docs.map(doc => doc.data().playerId).filter(id => id),
  ];

  let newId;
  do {
    newId = Math.floor(100000 + Math.random() * 900000);
  } while (existingIds.includes(newId));

  return newId;
};

const checkTeamNameUnique = async (teamName, excludeTeamId = null) => {
  try {
    const teamsCollectionRef = collection(db, 'clubTeams');
    const teamSnapshot = await getDocs(teamsCollectionRef);
    let existingTeam = null;

    teamSnapshot.forEach(doc => {
      if (doc.data().teamName.toLowerCase() === teamName.toLowerCase() && doc.id !== excludeTeamId) {
        existingTeam = { id: doc.id, ...doc.data() };
      }
    });

    return existingTeam;
  } catch (err) {
    console.error("Error checking team name:", err);
    throw new Error("Failed to check team name existence.");
  }
};

const AddClubPlayerModal = ({ onClose, team, onPlayerAdded }) => {
  const { clubName } = useClub(); // Get clubName from context
  const [formData, setFormData] = useState({
    playerId: '',
    name: '',
    image: '',
    teamName: team?.teamName || '',
    role: 'player',
    age: '',
    battingStyle: '',
    bowlingStyle: '',
    matches: '',
    runs: '',
    highestScore: '',
    average: '',
    strikeRate: '',
    centuries: '',
    fifties: '',
    wickets: '',
    bestBowling: '',
    bio: '',
    recentMatches: '',
    user: 'no',
    audioUrl: '',
    careerStatsBattingMatches: '',
    careerStatsBattingInnings: '',
    careerStatsBattingNotOuts: '',
    careerStatsBattingRuns: '',
    careerStatsBattingHighest: '',
    careerStatsBattingAverage: '',
    careerStatsBattingStrikeRate: '',
    careerStatsBattingCenturies: '',
    careerStatsBattingFifties: '',
    careerStatsBattingFours: '',
    careerStatsBattingSixes: '',
    careerStatsBowlingInnings: '',
    careerStatsBowlingWickets: '',
    careerStatsBowlingBest: '',
    careerStatsBowlingAverage: '',
    careerStatsBowlingEconomy: '',
    careerStatsBowlingStrikeRate: '',
    careerStatsFieldingCatches: '',
    careerStatsFieldingStumpings: '',
    careerStatsFieldingRunOuts: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [playerIds, setPlayerIds] = useState([]);
  const [filteredPlayerIds, setFilteredPlayerIds] = useState([]);
  const [playerIdSearch, setPlayerIdSearch] = useState('');
  const [isNewPlayer, setIsNewPlayer] = useState(false);
  const [originalUserId, setOriginalUserId] = useState(null);
  const [playerSource, setPlayerSource] = useState(null); // To track if from 'clubPlayers' or 'PlayerDetails'

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

  const fetchPlayerIds = async () => {
    try {
      const clubPlayersRef = collection(db, 'clubPlayers');
      const playerDetailsRef = collection(db, 'PlayerDetails');
      const [clubPlayersSnapshot, playerDetailsSnapshot] = await Promise.all([
        getDocs(clubPlayersRef),
        getDocs(playerDetailsRef),
      ]);

      const clubPlayerIds = clubPlayersSnapshot.docs.map(doc => ({
        playerId: doc.data().playerId,
        source: 'clubPlayers',
        ...doc.data(),
      }));
      const playerDetailsIds = playerDetailsSnapshot.docs.map(doc => ({
        playerId: doc.data().playerId,
        source: 'PlayerDetails',
        ...doc.data(),
      }));

      const allPlayerIds = [...clubPlayerIds, ...playerDetailsIds]
        .filter((player, index, self) => 
          index === self.findIndex(p => p.playerId === player.playerId)
        )
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      setPlayerIds(allPlayerIds);
      setFilteredPlayerIds(allPlayerIds);
    } catch (err) {
      console.error("Error fetching player IDs:", err);
      setError("Failed to load player IDs.");
    }
  };

  useEffect(() => {
    fetchPlayerIds();
  }, []);

  useEffect(() => {
    if (playerIdSearch.trim() === '') {
      setFilteredPlayerIds(playerIds);
    } else {
      const fetchFilteredPlayerIds = async () => {
        try {
          const clubPlayersRef = collection(db, 'clubPlayers');
          const playerDetailsRef = collection(db, 'PlayerDetails');
          const [clubPlayersSnapshot, playerDetailsSnapshot] = await Promise.all([
            getDocs(clubPlayersRef),
            getDocs(playerDetailsRef),
          ]);

          // const clubPlayerIds = clubPlayersSnapshot.docs
          //   .map(doc => ({ playerId: doc.data().playerId, source: 'clubPlayers', ...doc.data() }))
          //   .filter(player => player.playerId.toString().includes(playerIdSearch));
          const playerDetailsIds = playerDetailsSnapshot.docs
            .map(doc => ({ playerId: doc.data().playerId, source: 'PlayerDetails', ...doc.data() }))
            .filter(player => player.playerId && player.playerId.toString().includes(playerIdSearch))


          const allFilteredPlayerIds = [...playerDetailsIds]
            .filter((player, index, self) => 
              index === self.findIndex(p => p.playerId === player.playerId)
            );

          setFilteredPlayerIds(allFilteredPlayerIds);
        } catch (err) {
          console.error("Error filtering player IDs:", err);
          setError("Failed to filter player IDs.");
        }
      };

      fetchFilteredPlayerIds();
    }
  }, [playerIdSearch, playerIds]);

  useEffect(() => {
    if (team?.teamName && !formData.playerId) {
      setFormData(prev => ({ ...prev, teamName: team.teamName }));
    }
  }, [team]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    } else {
      setImageFile(null);
    }
  };

  const handlePlayerIdChange = async (e) => {
    const selectedPlayerId = e.target.value;
    setFormData(prev => ({ ...prev, playerId: selectedPlayerId }));
    setIsNewPlayer(false);

    if (selectedPlayerId) {
      try {
        let playerData = null;
        let originalUserId = null;
        let source = null;
        
        const clubPlayerQuery = query(
          collection(db, 'clubPlayers'),
          where('playerId', '==', parseInt(selectedPlayerId))
        );
        const clubPlayerSnapshot = await getDocs(clubPlayerQuery);
        if (!clubPlayerSnapshot.empty) {
          playerData = clubPlayerSnapshot.docs[0].data();
          originalUserId = playerData.userId;
          source = 'clubPlayers';
        } else {
          const playerDetailsQuery = query(
            collection(db, 'PlayerDetails'),
            where('playerId', '==', parseInt(selectedPlayerId))
          );
          const playerDetailsSnapshot = await getDocs(playerDetailsQuery);
          if (!playerDetailsSnapshot.empty) {
            playerData = playerDetailsSnapshot.docs[0].data();
            originalUserId = playerData.userId;
            source = 'PlayerDetails';
          }
        }
        if (playerData) {
          setOriginalUserId(originalUserId);
          setPlayerSource(source);
          setFormData({
            ...formData,
            playerId: playerData.playerId.toString(),
            name: playerData.name || '',
            image: playerData.image || '',
            teamName: team?.teamName || playerData.teamName || '',
            role: playerData.role || 'player',
            age: playerData.age?.toString() || '',
            battingStyle: playerData.battingStyle || '',
            bowlingStyle: playerData.bowlingStyle || '',
            matches: playerData.matches?.toString() || '',
            runs: playerData.runs?.toString() || '',
            highestScore: playerData.highestScore?.toString() || '',
            average: playerData.average?.toString() || '',
            strikeRate: playerData.strikeRate?.toString() || '',
            centuries: playerData.centuries?.toString() || '',
            fifties: playerData.fifties?.toString() || '',
            wickets: playerData.wickets?.toString() || '',
            bestBowling: playerData.bestBowling || '',
            bio: playerData.bio || '',
            recentMatches: Array.isArray(playerData.recentMatches)
              ? playerData.recentMatches.map(match => `${match.opponent}, ${match.runs}, ${match.wickets}, ${match.result}`).join('\n')
              : '',
            user: playerData.user || 'no',
            audioUrl: playerData.audioUrl || '',
            careerStatsBattingMatches: playerData.careerStats?.batting?.matches?.toString() || '',
            careerStatsBattingInnings: playerData.careerStats?.batting?.innings?.toString() || '',
            careerStatsBattingNotOuts: playerData.careerStats?.batting?.notOuts?.toString() || '',
            careerStatsBattingRuns: playerData.careerStats?.batting?.runs?.toString() || '',
            careerStatsBattingHighest: playerData.careerStats?.batting?.highest?.toString() || '',
            careerStatsBattingAverage: playerData.careerStats?.batting?.average?.toString() || '',
            careerStatsBattingStrikeRate: playerData.careerStats?.batting?.strikeRate?.toString() || '',
            careerStatsBattingCenturies: playerData.careerStats?.batting?.centuries?.toString() || '',
            careerStatsBattingFifties: playerData.careerStats?.batting?.fifties?.toString() || '',
            careerStatsBattingFours: playerData.careerStats?.batting?.fours?.toString() || '',
            careerStatsBattingSixes: playerData.careerStats?.batting?.sixes?.toString() || '',
            careerStatsBowlingInnings: playerData.careerStats?.bowling?.innings?.toString() || '',
            careerStatsBowlingWickets: playerData.careerStats?.bowling?.wickets?.toString() || '',
            careerStatsBowlingBest: playerData.careerStats?.bowling?.best || '',
            careerStatsBowlingAverage: playerData.careerStats?.bowling?.average?.toString() || '',
            careerStatsBowlingEconomy: playerData.careerStats?.bowling?.economy?.toString() || '',
            careerStatsBowlingStrikeRate: playerData.careerStats?.bowling?.strikeRate?.toString() || '',
            careerStatsFieldingCatches: playerData.careerStats?.fielding?.catches?.toString() || '',
            careerStatsFieldingStumpings: playerData.careerStats?.fielding?.stumpings?.toString() || '',
            careerStatsFieldingRunOuts: playerData.careerStats?.fielding?.runOuts?.toString() || '',
          });
        } else {
          setError("Player data not found.");
        }
      } catch (err) {
        console.error("Error fetching player data:", err);
        setError("Failed to fetch player data.");
      }
    } else {
      setFormData(prev => ({ ...prev, teamName: team?.teamName || '' }));
      setPlayerSource(null);
    }
  };

  const handleNewPlayerId = async () => {
    const newId = await generateUniquePlayerId();
    const newPlayer = {
      playerId: newId,
      source: 'new',
      name: 'New Player',
    };
    setFormData({
      playerId: newId.toString(),
      name: '',
      image: '',
      teamName: team?.teamName || '',
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
      bestBowling: '',
      bio: '',
      recentMatches: '',
      user: 'no',
      audioUrl: '',
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
    });
    setImageFile(null);
    setIsNewPlayer(true);
    setPlayerIds(prev => [newPlayer, ...prev]);
    setFilteredPlayerIds(prev => [newPlayer, ...prev]);
    setOriginalUserId(currentUserId);
    setPlayerSource('new');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!currentUserId) {
      setError("You must be logged in to add a player.");
      setLoading(false);
      return;
    }

    const playerName = formData.name.trim();
    if (!playerName) {
      setError("Player name cannot be empty.");
      setLoading(false);
      return;
    }

    if (!formData.teamName) {
      setError("Team name is required.");
      setLoading(false);
      return;
    }

    let uploadedImageUrl = formData.image;
    try {
      if (imageFile) {
        const filePath = `player_photos/${playerName.toLowerCase().replace(/\s+/g, '_')}_${imageFile.name}`;
        uploadedImageUrl = await uploadFile(imageFile, filePath);
        if (!uploadedImageUrl) {
          throw new Error("Failed to upload player image.");
        }
      }

      const recentMatchesParsed = formData.recentMatches
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

      const userIdToUse = originalUserId || currentUserId;
      const playerData = {
        playerId: parseInt(formData.playerId),
        name: playerName,
        image: uploadedImageUrl || '',
        teamName: formData.teamName,
        clubName: clubName || '', // Store clubName
        role: formData.role,
        age: parseInt(formData.age) || 0,
        battingStyle: formData.battingStyle || '',
        bowlingStyle: formData.bowlingStyle || '',
        matches: parseInt(formData.matches) || 0,
        runs: parseInt(formData.runs) || 0,
        highestScore: parseInt(formData.highestScore) || 0,
        average: parseFloat(formData.average) || 0,
        strikeRate: parseFloat(formData.strikeRate) || 0,
        centuries: parseInt(formData.centuries) || 0,
        fifties: parseInt(formData.fifties) || 0,
        wickets: parseInt(formData.wickets) || 0,
        bestBowling: formData.bestBowling || '0',
        bio: formData.bio || '',
        recentMatches: recentMatchesParsed,
        userId: userIdToUse,
        user: formData.user,
        audioUrl: formData.audioUrl || '',
        careerStats: {
          batting: {
            matches: parseInt(formData.careerStatsBattingMatches) || 0,
            innings: parseInt(formData.careerStatsBattingInnings) || 0,
            notOuts: parseInt(formData.careerStatsBattingNotOuts) || 0,
            runs: parseInt(formData.careerStatsBattingRuns) || 0,
            highest: parseInt(formData.careerStatsBattingHighest) || 0,
            average: parseFloat(formData.careerStatsBattingAverage) || 0,
            strikeRate: parseFloat(formData.careerStatsBattingStrikeRate) || 0,
            centuries: parseInt(formData.careerStatsBattingCenturies) || 0,
            fifties: parseInt(formData.careerStatsBattingFifties) || 0,
            fours: parseInt(formData.careerStatsBattingFours) || 0,
            sixes: parseInt(formData.careerStatsBattingSixes) || 0,
          },
          bowling: {
            innings: parseInt(formData.careerStatsBowlingInnings) || 0,
            wickets: parseInt(formData.careerStatsBowlingWickets) || 0,
            best: formData.careerStatsBowlingBest || '0',
            average: parseFloat(formData.careerStatsBowlingAverage) || 0,
            economy: parseFloat(formData.careerStatsBowlingEconomy) || 0,
            strikeRate: parseFloat(formData.careerStatsBowlingStrikeRate) || 0,
          },
          fielding: {
            catches: parseInt(formData.careerStatsFieldingCatches) || 0,
            stumpings: parseInt(formData.careerStatsFieldingStumpings) || 0,
            runOuts: parseInt(formData.careerStatsFieldingRunOuts) || 0,
          }
        }
      };

      const playerId = formData.playerId.toString(); // Ensure string for doc ID

      // Save/update to clubPlayers
      await setDoc(doc(db, "clubPlayers", playerId), playerData);

      // Also save/update to PlayerDetails with teamName and clubName
      await setDoc(doc(db, "PlayerDetails", playerId), {
        ...playerData, // Include all data
        teamName: formData.teamName,
        clubName: clubName || '',
        updatedAt: new Date() // Update timestamp
      });

      const teamQuery = query(
        collection(db, 'clubTeams'),
        where('teamName', '==', formData.teamName)
      );
      const teamSnapshot = await getDocs(teamQuery);

      if (!teamSnapshot.empty) {
        const teamDoc = teamSnapshot.docs[0];
        await updateDoc(doc(db, 'clubTeams', teamDoc.id), {
          players: arrayUnion(playerData)
        });
      } else {
        await setDoc(doc(collection(db, 'clubTeams')), {
          teamName: formData.teamName,
          createdBy: currentUserId,
          createdAt: new Date(),
          players: [playerData],
          captain: '',
          matches: 0,
          wins: 0,
          losses: 0,
          points: 0,
          lastMatch: ''
        });
      }

      setSuccess(true);

      const newId = await generateUniquePlayerId();
      const newPlayer = {
        playerId: newId,
        source: 'new',
        name: 'New Player',
      };
      setFormData({
        playerId: newId.toString(),
        name: '',
        image: '',
        teamName: team?.teamName || '',
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
        user: 'no',
        audioUrl: '',
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
      });
      setImageFile(null);
      setIsNewPlayer(true);
      setPlayerIds(prev => [newPlayer, ...prev]);
      setFilteredPlayerIds(prev => [newPlayer, ...prev]);
      setOriginalUserId(currentUserId);
      if (onPlayerAdded) {
        onPlayerAdded();
      }

      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error("Error adding player:", err);
      setError("Failed to add player: " + err.message);
      setLoading(false);
    }
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-gray-300">Player ID</label>
                <div className="flex items-center gap-2">
                  <select
                    name="playerId"
                    value={formData.playerId}
                    onChange={handlePlayerIdChange}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Player ID</option>
                    {filteredPlayerIds.map(player => (
                      <option key={`${player.playerId}-${player.source}`} value={player.playerId}>
                        {player.playerId} ({player.source})
                      </option>
                    ))}
                  </select>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNewPlayerId}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    New
                  </motion.button>
                </div>
                <input
                  type="text"
                  placeholder="Search Player ID..."
                  value={playerIdSearch}
                  onChange={(e) => setPlayerIdSearch(e.target.value)}
                  className="w-full p-2 mt-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="mt-2 flex items-center gap-4">
                  <label className="text-gray-300">User</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="user"
                        value="yes"
                        checked={formData.user === 'yes'}
                        onChange={handleChange}
                        className="mr-2 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-gray-300">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="user"
                        value="no"
                        checked={formData.user === 'no'}
                        onChange={handleChange}
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
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Team Name</label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  readOnly
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white opacity-70 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Club Name</label>
                <input
                  type="text"
                  value={clubName || 'No Club Selected'}
                  readOnly
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white opacity-70 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Player Image (Upload)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {imageFile && <p className="text-sm mt-1 text-gray-400">Selected: {imageFile.name}</p>}
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Or Paste Player Image URL (Optional fallback)</label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/player.png"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Role (e.g., Top Order Batsman)</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Batting Style (e.g., Right Handed Bat)</label>
                <input
                  type="text"
                  name="battingStyle"
                  value={formData.battingStyle}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Bowling Style (e.g., Right Arm Off Spin)</label>
                <input
                  type="text"
                  name="bowlingStyle"
                  value={formData.bowlingStyle}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-gray-300">Recent Matches (one per line, format: "Opponent, Runs, Wickets, Result")</label>
              <textarea
                name="recentMatches"
                value={formData.recentMatches}
                onChange={handleChange}
                rows="4"
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Jaipur Strikers, 98, 1, Won by 28 runs\nLUT Biggieagles XI, 64, 0, Lost by 5 wickets`}
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-300">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
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
                  value={formData.careerStatsBattingMatches}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Innings</label>
                <input
                  type="number"
                  name="careerStatsBattingInnings"
                  value={formData.careerStatsBattingInnings}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Not Outs</label>
                <input
                  type="number"
                  name="careerStatsBattingNotOuts"
                  value={formData.careerStatsBattingNotOuts}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Runs</label>
                <input
                  type="number"
                  name="careerStatsBattingRuns"
                  value={formData.careerStatsBattingRuns}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Highest Score</label>
                <input
                  type="number"
                  name="careerStatsBattingHighest"
                  value={formData.careerStatsBattingHighest}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Average</label>
                <input
                  type="number"
                  step="0.01"
                  name="careerStatsBattingAverage"
                  value={formData.careerStatsBattingAverage}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Strike Rate</label>
                <input
                  type="number"
                  step="0.01"
                  name="careerStatsBattingStrikeRate"
                  value={formData.careerStatsBattingStrikeRate}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Centuries</label>
                <input
                  type="number"
                  name="careerStatsBattingCenturies"
                  value={formData.careerStatsBattingCenturies}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Fifties</label>
                <input
                  type="number"
                  name="careerStatsBattingFifties"
                  value={formData.careerStatsBattingFifties}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Fours</label>
                <input
                  type="number"
                  name="careerStatsBattingFours"
                  value={formData.careerStatsBattingFours}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Sixes</label>
                <input
                  type="number"
                  name="careerStatsBattingSixes"
                  value={formData.careerStatsBattingSixes}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                  value={formData.careerStatsBowlingInnings}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Wickets</label>
                <input
                  type="number"
                  name="careerStatsBowlingWickets"
                  value={formData.careerStatsBowlingWickets}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Best Bowling</label>
                <input
                  type="text"
                  name="careerStatsBowlingBest"
                  value={formData.careerStatsBowlingBest}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Average</label>
                <input
                  type="number"
                  step="0.01"
                  name="careerStatsBowlingAverage"
                  value={formData.careerStatsBowlingAverage}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Economy</label>
                <input
                  type="number"
                  step="0.01"
                  name="careerStatsBowlingEconomy"
                  value={formData.careerStatsBowlingEconomy}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Strike Rate</label>
                <input
                  type="number"
                  step="0.01"
                  name="careerStatsBowlingStrikeRate"
                  value={formData.careerStatsBowlingStrikeRate}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                  value={formData.careerStatsFieldingCatches}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Stumpings</label>
                <input
                  type="number"
                  name="careerStatsFieldingStumpings"
                  value={formData.careerStatsFieldingStumpings}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Run Outs</label>
                <input
                  type="number"
                  name="careerStatsFieldingRunOuts"
                  value={formData.careerStatsFieldingRunOuts}
                  onChange={handleChange}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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
  );
};

export default AddClubPlayerModal;
