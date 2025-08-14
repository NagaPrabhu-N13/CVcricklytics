import React, { useEffect, useState } from 'react';
import Frame1321317519 from '../components/pawan/Frame';
import PlayerCard from '../components/pawan/PlayerCard';
import Leaderboard from '../components/pawan/Leaderboard';
import { collection, query, onSnapshot } from "firebase/firestore";
import { db, auth } from '../firebase';
import { FaTrashAlt } from 'react-icons/fa';

function PlayerPages() {
    const [players, setPlayers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    const [battingStyleFilter, setBattingStyleFilter] = useState('');
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
            console.warn("Player deletion not fully implemented. Requiresupdating clubTeams players array.");
            setPlayers(players.filter(player => player.id !== playerId));
        } catch (err) {
            console.error("Error deleting player:", err);
            alert("Failed to delete player");
        }
    };

    useEffect(() => {
        // Fetch all clubTeams data
        const clubTeamsQuery = query(collection(db, 'clubTeams'));

        const unsubscribeTeams = onSnapshot(clubTeamsQuery, (teamSnapshot) => {
            const playersMap = new Map(); // Map to store players by playerId

            // Process clubTeams players
            teamSnapshot.docs.forEach((doc) => {
                const teamData = doc.data();
                const teamPlayers = teamData.players || [];
                teamPlayers.forEach((player) => {
                    playersMap.set(player.playerId?.toString(), {
                        id: player.playerId?.toString() || `${doc.id}-${player.name}`,
                        name: player.name || 'Unknown',
                        battingStyle: player.battingStyle || 'Unknown',
                        team: teamData.teamName || teamData.lastMatch || 'Unknown',
                        role: player.role || 'player',
                        photoUrl: player.image || '',
                        runs: player.careerStats?.batting?.runs || 0,
                        wickets: player.careerStats?.bowling?.wickets || 0,
                        matches: player.careerStats?.batting?.matches || 0,
                        notOuts: player.careerStats?.batting?.notOuts || 0,
                        overs: player.careerStats?.bowling?.overs || 0,
                        highest: player.careerStats?.batting?.highest || 0,
                        userId: player.userId,
                        playerId: player.playerId?.toString(),
                        audioUrl: player.audioUrl || '', // Use audioUrl from clubTeams players array
                    });
                });
            });

            const playersList = Array.from(playersMap.values());
            setPlayers(playersList);
            console.log("Players Fetched:", playersList);
        }, (error) => {
            console.error("Error fetching clubTeams data:", error);
            setPlayers([]);
        });

        return () => unsubscribeTeams();
    }, []);

    const filteredPlayers = players.filter((player) => {
        const matchesSearch = player.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTeam = teamFilter ? player.team === teamFilter : true;
        const matchesBattingStyle = battingStyleFilter ? player.battingStyle === battingStyleFilter : true;
        return matchesSearch && matchesTeam && matchesBattingStyle;
    });

    const teams = [...new Set(players.map((player) => player.team))];
    const battingStyles = [...new Set(players.map((player) => player.battingStyle))];

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
                    <label htmlFor="battingStyle" className="block text-sm font-medium text-gray-200 mb-1">
                        Filter by Batting Style
                    </label>
                    <select
                        id="battingStyle"
                        value={battingStyleFilter}
                        onChange={(e) => setBattingStyleFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-500 focus:ring-blue-500"
                    >
                        <option value="">All Styles</option>
                        {battingStyles.map((style) => (
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
                            <PlayerCard player={player} onPlay={handlePlayAudio} onDelete={handleDeletePlayer} />
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

export default PlayerPages;