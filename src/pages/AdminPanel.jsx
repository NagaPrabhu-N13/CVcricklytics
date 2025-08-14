import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // adjust if needed
import { doc, setDoc, updateDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage imports

function AdminPanel() {
  // --- EXISTING STATE (DO NOT TOUCH) ---
  const [activeTab, setActiveTab] = useState('Leaderboard player'); // toggle between player/highlights
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    battingAvg: '',
    bowlingAvg: '',
    battingStyle: '',
    team: '',
    photoUrl: '', // This remains for the 'players' collection
    recentMatches: ''
  });
  const [highlightData, setHighlightData] = useState({
    title: '',
    image: '',
    videoUrl: ''
  });

  const [aiData, setAiData] = useState({
    prompt: '',
    context: ''
  });
  const [highlights, setHighlights] = useState([]); // This state seems unused, but keeping it as is.
  // --- END EXISTING STATE ---


  // --- NEW STATE FOR TEAM MANAGEMENT WITH FILE UPLOADS ---
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    flagUrl: ''
  });
  const [flagFile, setFlagFile] = useState(null); // New state for the flag file

  const [playerInTeamFormData, setPlayerInTeamFormData] = useState({
    selectedTeamName: '',
    playerName: '',
    playerPhotoUrl: '', // This will be the URL after upload for 'teams' players
    role: '',
  });
  const [playerPhotoFile, setPlayerPhotoFile] = useState(null); // New state for the player photo file

  const [existingTeamsForDropdown, setExistingTeamsForDropdown] = useState([]);
  // --- END NEW STATE ---

  // --- NEW STATE FOR CLUB PLAYERS TAB ---
  const [clubPlayerFormData, setClubPlayerFormData] = useState({
    name: '',
    image: '', // This will be a file or URL
    team: '',
    role: '',
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
    recentMatches: [], // Store as an array of objects
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
  const [clubPlayerImageFile, setClubPlayerImageFile] = useState(null); // State for the club player image file
  // --- END NEW STATE FOR CLUB PLAYERS TAB ---


  // Initialize Firebase Storage
  const storage = getStorage();

  // --- EFFECT TO FETCH TEAMS FOR DROPDOWN ---
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsCollectionRef = collection(db, 'teams');
        const teamSnapshot = await getDocs(teamsCollectionRef);
        const teams = teamSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.id
        }));
        setExistingTeamsForDropdown(teams);
      } catch (err) {
        console.error("Error fetching team names for dropdown:", err);
      }
    };
    if (activeTab === 'team' || activeTab === 'addPlayerToTeam' || activeTab === 'clubPlayer') {
      fetchTeams();
    }
  }, [activeTab]);
  // --- END EFFECT ---


  // --- FILE UPLOAD UTILITY FUNCTION ---
  const uploadFile = async (file, path) => {
    if (!file) return null;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };
  // --- END FILE UPLOAD UTILITY ---


  // --- EXISTING HANDLERS (DO NOT TOUCH) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHighlightChange = (e) => {
    const { name, value } = e.target;
    setHighlightData(prev => ({ ...prev, [name]: value }));
  };

  const handleAiChange = (e) => {
    const { name, value } = e.target;
    setAiData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const playerData = {
        ...formData,
        battingAvg: parseFloat(formData.battingAvg),
        bowlingAvg: formData.bowlingAvg ? parseFloat(formData.bowlingAvg) : null,
        recentMatches: formData.recentMatches.split(',').map(Number)
      };
      const playerId = playerData.name.toLowerCase().replace(/\s+/g, "_");

      await setDoc(doc(db, "players", playerId), playerData);
      alert("Player added successfully!");
      setFormData({
        name: '',
        role: '',
        battingAvg: '',
        bowlingAvg: '',
        battingStyle: '',
        team: '',
        photoUrl: '',
        recentMatches: ''
      });
    } catch (err) {
      console.error("Error adding player:", err);
      alert("Failed to add player");
    }
  };

  const handleHighlightSubmit = async (e) => {
    e.preventDefault();
    try {
      const highlightsData = { ...highlightData };
      const highlightId = highlightsData.title.toLowerCase().replace(/\s+/g, "_");
      await setDoc(doc(db, "highlights", highlightId), highlightsData);
      alert("Highlights added successfully!");
      setHighlightData({
        title: '',
        image: '',
        videoUrl: ''
      });
    } catch (err) {
      console.error("Error adding highlights:", err);
      alert("Failed to add highlights");
    }
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    try {
      const aiId = aiData.prompt.toLowerCase().replace(/\s+/g, "_");
      await setDoc(doc(db, "ai_assistance", aiId), aiData);
      alert("AI data saved successfully!");
      setAiData({
        prompt: '',
        context: ''
      });
    } catch (err) {
      console.error("Error saving AI data:", err);
      alert("Failed to save AI data");
    }
  };
  // --- END EXISTING HANDLERS ---


  // --- NEW HANDLERS FOR TEAM MANAGEMENT WITH FILE UPLOADS ---
  const handleTeamChange = (e) => {
    const { name, value } = e.target;
    setTeamFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFlagFileChange = (e) => {
    if (e.target.files[0]) {
      setFlagFile(e.target.files[0]);
    } else {
      setFlagFile(null);
    }
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    const teamName = teamFormData.name.trim();
    if (!teamName) {
      alert("Team name cannot be empty.");
      return;
    }

    let uploadedFlagUrl = teamFormData.flagUrl; // Start with manually entered URL if any
    try {
      if (flagFile) {
        // Upload flag image to Firebase Storage
        const filePath = `team_flags/${teamName.toLowerCase().replace(/\s+/g, '_')}_${flagFile.name}`;
        uploadedFlagUrl = await uploadFile(flagFile, filePath);
        if (!uploadedFlagUrl) {
          throw new Error("Failed to upload flag image.");
        }
      }

      const teamRef = doc(db, 'teams', teamName);
      await setDoc(teamRef, {
        name: teamName,
        flagUrl: uploadedFlagUrl, // Save the uploaded URL or manual URL
        players: []
      }, { merge: true });
      alert(`Team "${teamName}" added/updated successfully!`);
      setTeamFormData({ name: '', flagUrl: '' });
      setFlagFile(null); // Clear the file input
      // Refresh the dropdown list
      const teamsCollectionRef = collection(db, 'teams');
      const teamSnapshot = await getDocs(teamsCollectionRef);
      const updatedTeams = teamSnapshot.docs.map(doc => ({
        id: doc.id, name: doc.data().name || doc.id
      }));
      setExistingTeamsForDropdown(updatedTeams);
    } catch (err) {
      console.error('Error adding team:', err);
      alert('Failed to add team');
    }
  };

  const handlePlayerInTeamChange = (e) => {
    const { name, value } = e.target;
    setPlayerInTeamFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlayerPhotoFileChange = (e) => {
    if (e.target.files[0]) {
      setPlayerPhotoFile(e.target.files[0]);
    } else {
      setPlayerPhotoFile(null);
    }
  };

  const handleAddPlayerToTeamSubmit = async (e) => {
    e.preventDefault();
    const { selectedTeamName, playerName, role } = playerInTeamFormData; // Removed playerPhotoUrl here as it comes from upload

    if (!selectedTeamName) {
      alert("Please select a team.");
      return;
    }
    if (!playerName) {
      alert("Player name is required.");
      return;
    }
    if (!playerPhotoFile) { // Check if a file is actually selected for upload
        alert("Player photo is required.");
        return;
    }

    let uploadedPlayerPhotoUrl = '';
    try {
      // Upload player photo to Firebase Storage
      const filePath = `player_photos/${selectedTeamName.toLowerCase().replace(/\s+/g, '_')}/${playerName.toLowerCase().replace(/\s+/g, '_')}_${playerPhotoFile.name}`;
      uploadedPlayerPhotoUrl = await uploadFile(playerPhotoFile, filePath);
      if (!uploadedPlayerPhotoUrl) {
        throw new Error("Failed to upload player photo.");
      }

      const playerToAdd = {
        name: playerName,
        photoUrl: uploadedPlayerPhotoUrl, // Save the uploaded URL
        role: role,
      };

      const teamDocRef = doc(db, 'teams', selectedTeamName);
      await updateDoc(teamDocRef, {
        players: arrayUnion(playerToAdd)
      });

      alert(`Player "${playerName}" added to "${selectedTeamName}" successfully!`);
      setPlayerInTeamFormData(prev => ({
        ...{
          selectedTeamName: prev.selectedTeamName,
          playerName: '',
          playerPhotoUrl: '', // Reset for next entry, though value isn't directly used anymore
          role: '',
        }
      }));
      setPlayerPhotoFile(null); // Clear the file input
    } catch (err) {
      console.error("Error adding player to team:", err);
      alert("Failed to add player to team");
    }
  };
  // --- END NEW HANDLERS ---

  // --- NEW HANDLERS FOR CLUB PLAYERS TAB ---
  const handleClubPlayerChange = (e) => {
    const { name, value } = e.target;
    setClubPlayerFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClubPlayerImageFileChange = (e) => {
    if (e.target.files[0]) {
      setClubPlayerImageFile(e.target.files[0]);
    } else {
      setClubPlayerImageFile(null);
    }
  };

// ... (rest of your code)

const handleClubPlayerSubmit = async (e) => {
    e.preventDefault();
    const playerName = clubPlayerFormData.name.trim();
    if (!playerName) {
        alert("Player name cannot be empty.");
        return;
    }

    let uploadedImageUrl = clubPlayerFormData.image;
    try {
        if (clubPlayerImageFile) {
            const filePath = `club_player_photos/${playerName.toLowerCase().replace(/\s+/g, '_')}_${clubPlayerImageFile.name}`;
            uploadedImageUrl = await uploadFile(clubPlayerImageFile, filePath);
            if (!uploadedImageUrl) {
                throw new Error("Failed to upload club player image.");
            }
        }

        // Parse recent matches and career stats
        const recentMatchesParsed = clubPlayerFormData.recentMatches
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => {
                const parts = line.split(',').map(p => p.trim());
                // FIX START: Changed parts.length === 3 to parts.length === 4
                if (parts.length === 4) {
                    return {
                        opponent: parts[0],
                        runs: parseInt(parts[1]),
                        wickets: parseInt(parts[2]),
                        result: parts[3] // Correctly assign the fourth part as 'result'
                    };
                }
                // FIX END
                console.warn(`Skipping malformed recent match line: ${line}`); // Add a warning for malformed lines
                return null; // Handle invalid lines
            })
            .filter(item => item !== null);

        const clubPlayerData = {
            name: playerName,
            image: uploadedImageUrl,
            team: clubPlayerFormData.team,
            role: clubPlayerFormData.role,
            age: parseInt(clubPlayerFormData.age),
            battingStyle: clubPlayerFormData.battingStyle,
            bowlingStyle: clubPlayerFormData.bowlingStyle,
            matches: parseInt(clubPlayerFormData.matches),
            runs: parseInt(clubPlayerFormData.runs),
            highestScore: parseInt(clubPlayerFormData.highestScore),
            average: parseFloat(clubPlayerFormData.average),
            strikeRate: parseFloat(clubPlayerFormData.strikeRate),
            centuries: parseInt(clubPlayerFormData.centuries),
            fifties: parseInt(clubPlayerFormData.fifties),
            wickets: parseInt(clubPlayerFormData.wickets),
            bestBowling: clubPlayerFormData.bestBowling,
            bio: clubPlayerFormData.bio,
            recentMatches: recentMatchesParsed, // This will now correctly populate
            careerStats: {
                batting: {
                    matches: parseInt(clubPlayerFormData.careerStatsBattingMatches),
                    innings: parseInt(clubPlayerFormData.careerStatsBattingInnings),
                    notOuts: parseInt(clubPlayerFormData.careerStatsBattingNotOuts),
                    runs: parseInt(clubPlayerFormData.careerStatsBattingRuns),
                    highest: parseInt(clubPlayerFormData.careerStatsBattingHighest),
                    average: parseFloat(clubPlayerFormData.careerStatsBattingAverage),
                    strikeRate: parseFloat(clubPlayerFormData.careerStatsBattingStrikeRate),
                    centuries: parseInt(clubPlayerFormData.careerStatsBattingCenturies),
                    fifties: parseInt(clubPlayerFormData.careerStatsBattingFifties),
                    fours: parseInt(clubPlayerFormData.careerStatsBattingFours),
                    sixes: parseInt(clubPlayerFormData.careerStatsBattingSixes),
                },
                bowling: {
                    innings: parseInt(clubPlayerFormData.careerStatsBowlingInnings),
                    wickets: parseInt(clubPlayerFormData.careerStatsBowlingWickets),
                    best: clubPlayerFormData.careerStatsBowlingBest,
                    average: parseFloat(clubPlayerFormData.careerStatsBowlingAverage),
                    economy: parseFloat(clubPlayerFormData.careerStatsBowlingEconomy),
                    strikeRate: parseFloat(clubPlayerFormData.careerStatsBowlingStrikeRate),
                },
                fielding: {
                    catches: parseInt(clubPlayerFormData.careerStatsFieldingCatches),
                    stumpings: parseInt(clubPlayerFormData.careerStatsFieldingStumpings),
                    runOuts: parseInt(clubPlayerFormData.careerStatsFieldingRunOuts),
                }
            }
        };

        const clubPlayerId = playerName.toLowerCase().replace(/\s+/g, "_");
        await setDoc(doc(db, "clubPlayers", clubPlayerId), clubPlayerData);
        alert("Club Player added successfully!");
        setClubPlayerFormData({
            // ... (your reset data, ensure recentMatches is reset to an empty string for the textarea)
            name: '',
            image: '',
            team: '',
            role: '',
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
            recentMatches: '', // Reset to empty string for the textarea input
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
        setClubPlayerImageFile(null);
    } catch (err) {
        console.error("Error adding club player:", err);
        alert("Failed to add club player");
    }
};

// ... (rest of your AdminPanel component)
  // --- END NEW HANDLERS FOR CLUB PLAYERS TAB ---


  return (
    <div className="min-h-screen bg-gray-900 text-white p-10">
      <h2 className="text-3xl font-bold mb-6">Admin Panel</h2>

      {/* Toggle Tabs */}
      <div className="flex gap-4 mb-8">
        {['Leaderboard player', 'team', 'addPlayerToTeam', 'clubPlayer', 'highlight', 'ai'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded capitalize ${
              activeTab === tab ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            {tab === 'ai' ? 'AI Assistance' : tab === 'clubPlayer' ? 'Club Players' : tab}
          </button>
        ))}
      </div>

      {/* --- EXISTING 'ADD PLAYER' FORM (DO NOT TOUCH) --- */}
      {activeTab === 'Leaderboard player' && (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <h3 className="text-xl font-bold mb-4">Add Individual Player (to 'players' collection)</h3>
          {[
            { label: "Name", key: "name" },
            { label: "Role (Batsman/Bowler/All-Rounder)", key: "role" },
            { label: "Batting Average", key: "battingAvg", type: "number" },
            { label: "Bowling Average", key: "bowlingAvg", type: "number" },
            { label: "Batting Style (Right/Left-handed)", key: "battingStyle" },
            { label: "Team", key: "team" },
            { label: "Photo URL", key: "photoUrl" },
            { label: "Recent Matches (comma-separated)", key: "recentMatches" },
          ].map(({ label, key, type = "text" }) => (
            <div key={key}>
              <label className="block mb-1">{label}</label>
              <input
                type={type}
                name={key}
                value={formData[key]}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                required={key !== "bowlingAvg" && key !== "photoUrl"}
              />
            </div>
          ))}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
          >
            Add Player
          </button>
        </form>
      )}
      {/* --- END EXISTING 'ADD PLAYER' FORM --- */}


      {/* --- NEW 'ADD/UPDATE TEAM' TAB WITH FILE UPLOAD --- */}
      {activeTab === 'team' && (
        <form onSubmit={handleTeamSubmit} className="space-y-4 max-w-xl">
          <h3 className="text-xl font-bold mb-4">Add/Update Team (in 'teams' collection)</h3>
          <div>
            <label className="block mb-1">Team Name (e.g., "Pakistan", "England")</label>
            <input
              type="text"
              name="name"
              value={teamFormData.name}
              onChange={handleTeamChange}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Team Flag Image (Upload)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFlagFileChange}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
            {flagFile && <p className="text-sm mt-1 text-gray-400">Selected: {flagFile.name}</p>}
          </div>
          {/* Optional: Add a field for manually pasting URL if needed, but upload is primary */}
          <div>
            <label className="block mb-1">Or Paste Team Flag URL (Optional fallback)</label>
            <input
              type="text"
              name="flagUrl"
              value={teamFormData.flagUrl}
              onChange={handleTeamChange}
              placeholder="https://example.com/flag.png"
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
          >
            Add/Update Team
          </button>
        </form>
      )}
      {/* --- END NEW 'ADD/UPDATE TEAM' TAB --- */}


      {/* --- NEW 'ADD PLAYER TO TEAM' TAB WITH FILE UPLOAD --- */}
      {activeTab === 'addPlayerToTeam' && (
        <form onSubmit={handleAddPlayerToTeamSubmit} className="space-y-4 max-w-xl">
          <h3 className="text-xl font-bold mb-4">Add Player to Existing Team (in 'teams' collection)</h3>
          <div>
            <label className="block mb-1">Select Team</label>
            <select
              name="selectedTeamName"
              value={playerInTeamFormData.selectedTeamName}
              onChange={handlePlayerInTeamChange}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              required
            >
              <option value="">-- Select a Team --</option>
              {existingTeamsForDropdown.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Player Name</label>
            <input
              type="text"
              name="playerName"
              value={playerInTeamFormData.playerName}
              onChange={handlePlayerInTeamChange}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Player Photo (Upload)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePlayerPhotoFileChange}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              required // Making photo upload required
            />
            {playerPhotoFile && <p className="text-sm mt-1 text-gray-400">Selected: {playerPhotoFile.name}</p>}
          </div>
          <div>
            <label className="block mb-1">Role (Batsman/Bowler/All-Rounder)</label>
            <input
              type="text"
              name="role"
              value={playerInTeamFormData.role}
              onChange={handlePlayerInTeamChange}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white"
          >
            Add Player to Team
          </button>
        </form>
      )}
      {/* --- END NEW 'ADD PLAYER TO TEAM' TAB --- */}

      {/* --- NEW 'CLUB PLAYERS' TAB --- */}
      {/* --- NEW 'CLUB PLAYERS' TAB --- */}
        {activeTab === 'clubPlayer' && (
          <form onSubmit={handleClubPlayerSubmit} className="space-y-4 max-w-xl">
            <h3 className="text-xl font-bold mb-4">Add Club Player</h3>
            <div>
              <label className="block mb-1">Name</label>
              <input type="text" name="name" value={clubPlayerFormData.name} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" required />
            </div>
            <div>
                <label className="block mb-1">Team Name</label>
                <input
                    type="text"
                    name="team"
                    value={clubPlayerFormData.team}
                    onChange={handleClubPlayerChange}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                    required
                />
            </div>
            <div>
              <label className="block mb-1">Player Image (Upload)</label>
              <input type="file" accept="image/*" onChange={handleClubPlayerImageFileChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
              {clubPlayerImageFile && <p className="text-sm mt-1 text-gray-400">Selected: {clubPlayerImageFile.name}</p>}
            </div>
            <div>
              <label className="block mb-1">Or Paste Player Image URL (Optional fallback)</label>
              <input type="text" name="image" value={clubPlayerFormData.image} onChange={handleClubPlayerChange} placeholder="https://example.com/player.png" className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>

            <div>
              <label className="block mb-1">Role (e.g., Top Order Batsman)</label>
              <input type="text" name="role" value={clubPlayerFormData.role} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" required />
            </div>
            <div>
              <label className="block mb-1">Age</label>
              <input type="number" name="age" value={clubPlayerFormData.age} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" required />
            </div>
            <div>
              <label className="block mb-1">Batting Style (e.g., Right Handed Bat)</label>
              <input type="text" name="battingStyle" value={clubPlayerFormData.battingStyle} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" required />
            </div>
            <div>
              <label className="block mb-1">Bowling Style (e.g., Right Arm Off Spin)</label>
              <input type="text" name="bowlingStyle" value={clubPlayerFormData.bowlingStyle} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Matches Played</label>
              <input type="number" name="matches" value={clubPlayerFormData.matches} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" required />
            </div>
            <div>
              <label className="block mb-1">Total Runs</label>
              <input type="number" name="runs" value={clubPlayerFormData.runs} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" required />
            </div>
            <div>
              <label className="block mb-1">Highest Score</label>
              <input type="number" name="highestScore" value={clubPlayerFormData.highestScore} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" required />
            </div>
            <div>
              <label className="block mb-1">Batting Average</label>
              <input type="number" step="0.01" name="average" value={clubPlayerFormData.average} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" required />
            </div>
            <div>
              <label className="block mb-1">Strike Rate</label>
              <input type="number" step="0.01" name="strikeRate" value={clubPlayerFormData.strikeRate} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" required />
            </div>
            <div>
              <label className="block mb-1">Centuries</label>
              <input type="number" name="centuries" value={clubPlayerFormData.centuries} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" required />
            </div>
            <div>
              <label className="block mb-1">Fifties</label>
              <input type="number" name="fifties" value={clubPlayerFormData.fifties} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" required />
            </div>
            <div>
              <label className="block mb-1">Wickets</label>
              <input type="number" name="wickets" value={clubPlayerFormData.wickets} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Best Bowling (e.g., 3/22)</label>
              <input type="text" name="bestBowling" value={clubPlayerFormData.bestBowling} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Bio</label>
              <textarea name="bio" value={clubPlayerFormData.bio} onChange={handleClubPlayerChange} rows="4" className="w-full p-2 rounded bg-gray-800 border border-gray-700" required />
            </div>
            <div>
              <label className="block mb-1">Recent Matches (one per line, format: "Opponent, Runs, Wickets, Result")</label>
              <textarea name="recentMatches" value={clubPlayerFormData.recentMatches} onChange={handleClubPlayerChange} rows="6" className="w-full p-2 rounded bg-gray-800 border border-gray-700" placeholder={`Jaipur Strikers, 98, 1, Won by 28 runs\nLUT Biggieagles XI, 64, 0, Lost by 5 wickets`} />
            </div>

            <h4 className="text-lg font-bold mb-2">Career Stats - Batting</h4>
            <div>
              <label className="block mb-1">Matches</label>
              <input type="number" name="careerStatsBattingMatches" value={clubPlayerFormData.careerStatsBattingMatches} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Innings</label>
              <input type="number" name="careerStatsBattingInnings" value={clubPlayerFormData.careerStatsBattingInnings} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Not Outs</label>
              <input type="number" name="careerStatsBattingNotOuts" value={clubPlayerFormData.careerStatsBattingNotOuts} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Runs</label>
              <input type="number" name="careerStatsBattingRuns" value={clubPlayerFormData.careerStatsBattingRuns} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Highest Score</label>
              <input type="number" name="careerStatsBattingHighest" value={clubPlayerFormData.careerStatsBattingHighest} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Average</label>
              <input type="number" step="0.01" name="careerStatsBattingAverage" value={clubPlayerFormData.careerStatsBattingAverage} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Strike Rate</label>
              <input type="number" step="0.01" name="careerStatsBattingStrikeRate" value={clubPlayerFormData.careerStatsBattingStrikeRate} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Centuries</label>
              <input type="number" name="careerStatsBattingCenturies" value={clubPlayerFormData.careerStatsBattingCenturies} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Fifties</label>
              <input type="number" name="careerStatsBattingFifties" value={clubPlayerFormData.careerStatsBattingFifties} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Fours</label>
              <input type="number" name="careerStatsBattingFours" value={clubPlayerFormData.careerStatsBattingFours} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Sixes</label>
              <input type="number" name="careerStatsBattingSixes" value={clubPlayerFormData.careerStatsBattingSixes} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>

            <h4 className="text-lg font-bold mb-2">Career Stats - Bowling</h4>
            <div>
              <label className="block mb-1">Innings</label>
              <input type="number" name="careerStatsBowlingInnings" value={clubPlayerFormData.careerStatsBowlingInnings} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Wickets</label>
              <input type="number" name="careerStatsBowlingWickets" value={clubPlayerFormData.careerStatsBowlingWickets} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Best Bowling</label>
              <input type="text" name="careerStatsBowlingBest" value={clubPlayerFormData.careerStatsBowlingBest} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Average</label>
              <input type="number" step="0.01" name="careerStatsBowlingAverage" value={clubPlayerFormData.careerStatsBowlingAverage} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Economy</label>
              <input type="number" step="0.01" name="careerStatsBowlingEconomy" value={clubPlayerFormData.careerStatsBowlingEconomy} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Strike Rate</label>
              <input type="number" step="0.01" name="careerStatsBowlingStrikeRate" value={clubPlayerFormData.careerStatsBowlingStrikeRate} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>

            <h4 className="text-lg font-bold mb-2">Career Stats - Fielding</h4>
            <div>
              <label className="block mb-1">Catches</label>
              <input type="number" name="careerStatsFieldingCatches" value={clubPlayerFormData.careerStatsFieldingCatches} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Stumpings</label>
              <input type="number" name="careerStatsFieldingStumpings" value={clubPlayerFormData.careerStatsFieldingStumpings} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>
            <div>
              <label className="block mb-1">Run Outs</label>
              <input type="number" name="careerStatsFieldingRunOuts" value={clubPlayerFormData.careerStatsFieldingRunOuts} onChange={handleClubPlayerChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
            </div>

            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-white"
            >
              Add Club Player
            </button>
          </form>
        )}
        {/* --- END NEW 'CLUB PLAYERS' TAB --- */}
      {/* --- END NEW 'CLUB PLAYERS' TAB --- */}


      {/* --- EXISTING HIGHLIGHTS TAB (DO NOT TOUCH) --- */}
      {activeTab === 'highlight' && (
        <div className="space-y-6 max-w-xl">
          <form onSubmit={handleHighlightSubmit} className="space-y-4">
            {[
              { label: "Highlight Title", key: "title" },
              { label: "Thumbnail Image URL", key: "image" },
              { label: "Video URL (YouTube embed link)", key: "videoUrl" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block mb-1">{label}</label>
                <input
                  type="text"
                  name={key}
                  value={highlightData[key]}
                  onChange={handleHighlightChange}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
            >
              Add Highlight
            </button>
          </form>
        </div>
      )}
      {/* --- END EXISTING HIGHLIGHTS TAB --- */}

      {/* --- EXISTING AI ASSISTANCE TAB (DO NOT TOUCH) --- */}
      {activeTab === 'ai' && (
        <form onSubmit={handleAiSubmit} className="space-y-4 max-w-xl">
          {[
            { label: "Prompt (question/input)", key: "prompt" },
            { label: "Context or Description", key: "context" }
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block mb-1">{label}</label>
              <textarea
                name={key}
                value={aiData[key]}
                onChange={handleAiChange}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                rows={4}
                required
              />
            </div>
          ))}
          <button type="submit" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white">
            Save AI Prompt
          </button>
        </form>
      )}
      {/* --- END EXISTING AI ASSISTANCE TAB --- */}
    </div>
  );
}

export default AdminPanel;