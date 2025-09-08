import React, { useEffect, useState } from 'react';
import Frame1321317519 from '../components/pawan/Frame';
import PlayerCard from '../components/pawan/PlayerCard';
import Leaderboard from '../components/pawan/Leaderboard';
import { collection, query, onSnapshot } from "firebase/firestore";
import { db, auth } from '../firebase';
import { FaTrashAlt } from 'react-icons/fa';

function BowlingPlayerPages() {
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [bowlingStyleFilter, setBowlingStyleFilter] = useState('');
  const [audio, setAudio] = useState(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);

  const handlePlayAudio = (url) => {
    if (!url) {
      console.warn("No audio URL provided");
      return;
    }

    if (audio && currentAudioUrl === url) {
      if (!audio.paused) {
        audio.pause();
      } else {
        audio.play().catch((err) => console.warn("Playback failed:", err));
      }
    } else {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      const newAudio = new Audio(url);
      newAudio.play().catch((err) => console.warn("Playback failed:", err));
      setAudio(newAudio);
      setCurrentAudioUrl(url);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm("Are you sure you want to delete this player?")) return;

    try {
      console.warn("Player deletion not fully implemented. Requires updating clubTeams players array.");
      setPlayers(players.filter(player => player.id !== playerId));
    } catch (err) {
      console.error("Error deleting player:", err);
      alert("Failed to delete player");
    }
  };

  useEffect(() => {
    // Fetch all players from PlayerDetails collection
    const playersQuery = query(collection(db, 'PlayerDetails'));

    const unsubscribePlayers = onSnapshot(playersQuery, (playerSnapshot) => {
      const playersList = playerSnapshot.docs.map((doc) => {
        const playerData = doc.data();
        return {
            id: doc.id,
            name: playerData.name || 'Unknown',
            bowlingStyle: playerData.bowlingStyle || 'Unknown',
            team: playerData.teamName || 'Unknown',
            role: playerData.role || 'player',
            photoUrl: playerData.image || '',
            runs: playerData.careerStats?.batting?.runs || 0,
            average: playerData.careerStats?.batting?.average ?? 0,
            bowlingAverage: playerData.careerStats?.bowling?.average ?? 0,
            battingAvg: playerData.careerStats?.batting?.average ?? null,
            bowlingAvg: playerData.careerStats?.bowling?.average ?? null,
            wickets: playerData.careerStats?.bowling?.wickets || 0,
            matches: playerData.careerStats?.batting?.matches || 0,
            notOuts: playerData.careerStats?.batting?.notOuts || 0,
            overs: playerData.careerStats?.bowling?.overs || 0,
            highest: playerData.careerStats?.batting?.highest || 0,
            userId: playerData.userId,
            playerId: doc.id,
            audioUrl: playerData.audioUrl || '',
        };
      });

      // Sort players by bowling average in descending order
      const sortedPlayers = playersList.sort((a, b) => {
        const bowlingAvgA = Number(a.bowlingAvg) || 0;
        const bowlingAvgB = Number(b.bowlingAvg) || 0;
        return bowlingAvgB - bowlingAvgA;
      });

      setPlayers(sortedPlayers);
      console.log("Players Fetched and Sorted by Bowling Average:", sortedPlayers);
    }, (error) => {
      console.error("Error fetching PlayerDetails data:", error);
      setPlayers([]);
    });

    return () => unsubscribePlayers();
  }, []);

  // Apply filters and maintain sorting by bowling average
  const filteredPlayers = players
    .filter((player) => {
      const matchesSearch = player.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam = teamFilter ? player.team === teamFilter : true;
      const matchesBowlingStyle = bowlingStyleFilter ? player.bowlingStyle === bowlingStyleFilter : true;
      return matchesSearch && matchesTeam && matchesBowlingStyle;
    })
    .sort((a, b) => {
      const bowlingAvgA = Number(a.bowlingAvg) || 0;
      const bowlingAvgB = Number(b.bowlingAvg) || 0;
      return bowlingAvgB - bowlingAvgA;
    });

  const teams = [...new Set(players.map((player) => player.team))];
  const bowlingStyles = [...new Set(players.map((player) => player.bowlingStyle))];

  return (
    <div className="bg-gradient-to-r from-[#0a1f44] to-[#123456] scrollbar-hide min-h-screen">
      <div className="bg-gradient-to-r from-[#0a1f44] to-[#123456] h-10 w-full">
        <Frame1321317519 />
      </div>

      {/* Page Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mt-8 mb-6">
        Player Profiles
      </h1>

      {/* Search and Filter Section */}
      <div className="container mx-auto px-4 sm:px-6 py-4 flex flex-wrap gap-4 justify-center sm:justify-start items-end">
        <div className="w-full sm:w-1/4 min-w-[280px]">
          <label htmlFor="search" className="block text-sm font-medium text-gray-200 mb-1">
            Search by Name
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter player name..."
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-500 focus:ring-blue-500"
          />
        </div>

        <div className="w-full sm:w-1/4 min-w-[280px]">
          <label htmlFor="team" className="block text-sm font-medium text-gray-200 mb-1">
            Filter by Team
          </label>
          <select
            id="team"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-500 focus:ring-blue-500"
          >
            <option value="">All Teams</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-1/4 min-w-[280px]">
          <label htmlFor="bowlingStyle" className="block text-sm font-medium text-gray-200 mb-1">
            Filter by Bowling Style
          </label>
          <select
            id="bowlingStyle"
            value={bowlingStyleFilter}
            onChange={(e) => setBowlingStyleFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-500 focus:ring-blue-500"
          >
            <option value="">All Styles</option>
            {bowlingStyles.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 cursor-pointer select-none">
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player, index) => (
            <div key={player.id || index} className="flex justify-center relative">
              <PlayerCard player={player} onPlay={handlePlayAudio} onDelete={handleDeletePlayer} type="Bowling"/>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-300 col-span-full py-8">
            No players found matching your criteria.
          </p>
        )}
      </div>

      <div className="mt-10 sm:mt-16"></div>
      <Leaderboard players={filteredPlayers} />
    </div>
  );
}

export default BowlingPlayerPages;