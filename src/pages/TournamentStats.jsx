import React, { useEffect, useState } from 'react';
import Frame1321317519 from '../components/pawan/Frame';
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from '../firebase';

function TournamentStats() {
  const [allPlayers, setAllPlayers] = useState([]);
  const [activeTab, setActiveTab] = useState('batting');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');

  // Fetch tournament names
  useEffect(() => {
    const tournamentsQuery = query(collection(db, 'tournament'));
    const unsubscribe = onSnapshot(tournamentsQuery, (snapshot) => {
      const tournamentList = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || 'Unknown Tournament',
        tournamentId: doc.data().tournamentId || doc.id
      }));
      setTournaments(tournamentList);
      if (tournamentList.length > 0 && !selectedTournamentId) {
        setSelectedTournamentId(tournamentList[0].tournamentId);
      }
    }, (err) => {
      setError("Failed to load tournaments");
    });
    return () => unsubscribe();
  }, []);

  // Fetch and aggregate stats for selected tournament
  useEffect(() => {
    if (!selectedTournamentId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    const matchesQuery = query(collection(db, 'tournamentStats', selectedTournamentId, 'matches'));
    const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
      const playerMap = new Map();

      snapshot.docs.forEach((matchDoc) => {
        const players = matchDoc.data().players || [];
        players.forEach(playerData => {
          const key = playerData.playerName; // Use playerName as unique key (assume names are unique)
          if (!playerMap.has(key)) {
            playerMap.set(key, {
              id: key,
              name: playerData.playerName || 'Unknown',
              team: playerData.teamName || 'Unknown',
              photoUrl: playerData.image || '',
              runs: 0,
              ballsFaced: 0,
              outs: 0,
              highest: 0,
              centuries: 0,
              halfCenturies: 0,
              wickets: 0,
              runsConceded: 0,
              ballsBowled: 0,
              bestWickets: 0,
              bestRunsConceded: Infinity,
              fiveWickets: 0,
              catches: 0,
              stumpings: 0,
              runOuts: 0,
              matches: 0
            });
          }
          const agg = playerMap.get(key);
          // Batting aggregate
          const matchRuns = Number(playerData.runs || 0);
          agg.runs += matchRuns;
          agg.ballsFaced += Number(playerData.ballsFaced || 0);
          agg.outs += Number(playerData.dismissals || 0);
          agg.highest = Math.max(agg.highest, matchRuns);
          if (matchRuns >= 100) agg.centuries += 1;
          if (matchRuns >= 50 && matchRuns < 100) agg.halfCenturies += 1;
          // Bowling aggregate
          const matchWickets = Number(playerData.wickets || 0);
          const matchRunsConceded = Number(playerData.runsConceded || 0);
          agg.wickets += matchWickets;
          agg.runsConceded += matchRunsConceded;
          agg.ballsBowled += Number(playerData.ballsBowled || 0);
          if (matchWickets >= 5) agg.fiveWickets += 1;
          if (matchWickets > agg.bestWickets || (matchWickets === agg.bestWickets && matchRunsConceded < agg.bestRunsConceded)) {
            agg.bestWickets = matchWickets;
            agg.bestRunsConceded = matchRunsConceded;
          }
          // Fielding aggregate
          agg.catches += Number(playerData.catches || 0);
          agg.stumpings += Number(playerData.stumpings || 0);
          agg.runOuts += Number(playerData.runOuts || 0);
          agg.matches += 1; // Each occurrence counts as a match
        });
      });

      // Calculate derived stats
      const playersArr = Array.from(playerMap.values()).map(p => ({
        ...p,
        average: p.outs ? p.runs / p.outs : 0,
        strikeRate: p.ballsFaced ? (p.runs / p.ballsFaced) * 100 : 0,
        bowlingAverage: p.wickets ? p.runsConceded / p.wickets : 0,
        economy: p.ballsBowled ? (p.runsConceded / p.ballsBowled) * 6 : 0, // Assuming 6 balls per over
        bestBowling: p.bestWickets > 0 ? `${p.bestWickets}/${p.bestRunsConceded}` : '0/0'
      }));

      setAllPlayers(playersArr);
      setIsLoading(false);
    }, (err) => {
      setError("Failed to load tournament statistics");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [selectedTournamentId]);

  // Sort players based on active tab
  const getSortedPlayers = () => {
    if (activeTab === 'batting') {
      return [...allPlayers].sort((a, b) => b.runs - a.runs);
    } else if (activeTab === 'bowling') {
      return [...allPlayers].sort((a, b) => b.wickets - a.wickets);
    } else if (activeTab === 'fielding') {
      return [...allPlayers].sort((a, b) => b.catches - a.catches);
    }
    return [];
  };

  const sortedPlayers = getSortedPlayers();
  const topBatsmen = [...allPlayers].sort((a, b) => b.runs - a.runs).slice(0, 3);
  const topBowlers = [...allPlayers].sort((a, b) => b.wickets - a.wickets).slice(0, 3);
  const topFielders = [...allPlayers].sort((a, b) => b.catches - a.catches).slice(0, 3);

  const selectedTournament = tournaments.find(t => t.tournamentId === selectedTournamentId);

  const StatCard = ({ player, statType, rank }) => {
    const formatNumber = (num, decimals = 2) => {
      if (num === null || num === undefined) return '0.00';
      return typeof num === 'number' ? num.toFixed(decimals) : num.toString();
    };
    const getRankColor = (rank) => {
      switch (rank) {
        case 1: return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
        case 2: return 'bg-gradient-to-r from-gray-400 to-gray-500';
        case 3: return 'bg-gradient-to-r from-amber-600 to-amber-700';
        default: return 'bg-blue-600';
      }
    };
    return (
      <div className="relative bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300 shadow-lg hover:shadow-xl">
        <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${getRankColor(rank)}`}>
          {rank}
        </div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center">
            <div className="relative">
              <img
                src={player.photoUrl || '/default-player.png'}
                alt={player.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shadow-md"
                onError={(e) => {
                  e.target.src = '/default-player.png';
                }}
              />
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-full border-2 border-gray-800" />
            </div>
            <div className="ml-4">
              <h3 className="text-white font-bold text-lg">{player.name}</h3>
              <p className="text-blue-300 text-sm">{player.team}</p>
            </div>
          </div>
        </div>
        {statType === 'batting' && (
          <div className="grid grid-cols-2 gap-3 text-white">
            <div className="bg-gradient-to-br from-blue-900/70 to-blue-800/50 p-3 rounded-lg border border-blue-700/30">
              <p className="text-xs text-blue-300 uppercase tracking-wider">Runs</p>
              <p className="text-xl font-bold text-yellow-400">{player.runs}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/70 to-blue-800/50 p-3 rounded-lg border border-blue-700/30">
              <p className="text-xs text-blue-300 uppercase tracking-wider">Average</p>
              <p className="text-xl font-bold">{formatNumber(player.average)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/70 to-blue-800/50 p-3 rounded-lg border border-blue-700/30">
              <p className="text-xs text-blue-300 uppercase tracking-wider">Strike Rate</p>
              <p className="text-xl font-bold">{formatNumber(player.strikeRate)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/70 to-blue-800/50 p-3 rounded-lg border border-blue-700/30">
              <p className="text-xs text-blue-300 uppercase tracking-wider">Highest</p>
              <p className="text-xl font-bold">{player.highest}</p>
            </div>
          </div>
        )}
        {statType === 'bowling' && (
          <div className="grid grid-cols-2 gap-3 text-white">
            <div className="bg-gradient-to-br from-blue-900/70 to-blue-800/50 p-3 rounded-lg border border-blue-700/30">
              <p className="text-xs text-blue-300 uppercase tracking-wider">Wickets</p>
              <p className="text-xl font-bold text-yellow-400">{player.wickets}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/70 to-blue-800/50 p-3 rounded-lg border border-blue-700/30">
              <p className="text-xs text-blue-300 uppercase tracking-wider">Economy</p>
              <p className="text-xl font-bold">{formatNumber(player.economy)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/70 to-blue-800/50 p-3 rounded-lg border border-blue-700/30">
              <p className="text-xs text-blue-300 uppercase tracking-wider">Average</p>
              <p className="text-xl font-bold">{formatNumber(player.bowlingAverage)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/70 to-blue-800/50 p-3 rounded-lg border border-blue-700/30">
              <p className="text-xs text-blue-300 uppercase tracking-wider">Best</p>
              <p className="text-xl font-bold">{player.bestBowling}</p>
            </div>
          </div>
        )}
        {statType === 'fielding' && (
          <div className="grid grid-cols-2 gap-3 text-white">
            <div className="bg-gradient-to-br from-blue-900/70 to-blue-800/50 p-3 rounded-lg border border-blue-700/30">
              <p className="text-xs text-blue-300 uppercase tracking-wider">Catches</p>
              <p className="text-xl font-bold text-yellow-400">{player.catches}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/70 to-blue-800/50 p-3 rounded-lg border border-blue-700/30">
              <p className="text-xs text-blue-300 uppercase tracking-wider">Stumpings</p>
              <p className="text-xl font-bold">{player.stumpings}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/70 to-blue-800/50 p-3 rounded-lg border border-blue-700/30">
              <p className="text-xs text-blue-300 uppercase tracking-wider">Run Outs</p>
              <p className="text-xl font-bold">{player.runOuts}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/70 to-blue-800/50 p-3 rounded-lg border border-blue-700/30">
              <p className="text-xs text-blue-300 uppercase tracking-wider">Dismissals</p>
              <p className="text-xl font-bold">{(player.catches || 0) + (player.stumpings || 0) + (player.runOuts || 0)}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-gradient-to-br from-[#0a1f44] via-[#0f2c5d] to-[#123456] min-h-screen flex items-center justify-center">
        <div className="text-center text-white p-6 bg-blue-900/30 backdrop-blur-md rounded-xl border border-white/10 max-w-md">
          <div className="mb-4 text-6xl">😕</div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Statistics</h2>
          <p className="mb-6 text-blue-200">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-md font-medium transition-all duration-300 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#0a1f44] via-[#0f2c5d] to-[#123456] min-h-screen pb-16">
      <div className="bg-gradient-to-r from-[#0a1f44] to-[#123456] h-10 w-full">
        <Frame1321317519 />
      </div>
      <div className="container mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="flex justify-center mb-6">
          <select
            value={selectedTournamentId}
            onChange={e => setSelectedTournamentId(e.target.value)}
            className="bg-blue-900/30 backdrop-blur-md p-3 rounded-xl border border-white/10 text-white font-medium text-center min-w-[200px] cursor-pointer"
          >
            {tournaments.map(tournament => (
              <option key={tournament.id} value={tournament.tournamentId}>
                {tournament.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">{selectedTournament?.name || 'Tournament'} <span className="text-yellow-400">Statistics</span></h1>
          <p className="text-blue-200 max-w-2xl mx-auto">
            Discover the top performers across batting, bowling, and fielding in the tournament
          </p>
        </div>
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-blue-900/30 backdrop-blur-md p-1 rounded-xl border border-white/10">
            {['batting', 'bowling', 'fielding'].map(tab => (
              <button
                key={tab}
                className={`py-3 px-8 rounded-lg transition-all duration-300 font-medium ${activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'text-blue-200 hover:text-white hover:bg-white/5'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-blue-300">Loading tournament statistics...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {sortedPlayers.length > 0 ? sortedPlayers.map((player, index) => (
                <StatCard
                  key={player.id}
                  player={player}
                  statType={activeTab}
                  rank={index + 1}
                />
              )) : (
                <div className="col-span-3 text-center py-12 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-blue-200 text-lg">No statistics available</p>
                </div>
              )}
            </div>
            {/* Summary Section */}
            <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Tournament Highlights</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
                <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-4 border border-yellow-500/20">
                    <span className="text-2xl">🏏</span>
                  </div>
                  <p className="text-3xl font-bold text-yellow-400 mb-1">
                    {topBatsmen[0]?.runs || 0}
                  </p>
                  <p className="text-blue-300 mb-2">Highest Runs</p>
                  <p className="text-sm text-white">{topBatsmen[0]?.name || 'N/A'}</p>
                </div>
                <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-4 border border-yellow-500/20">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <p className="text-3xl font-bold text-yellow-400 mb-1">
                    {topBowlers[0]?.wickets || 0}
                  </p>
                  <p className="text-blue-300 mb-2">Most Wickets</p>
                  <p className="text-sm text-white">{topBowlers[0]?.name || 'N/A'}</p>
                </div>
                <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-4 border border-yellow-500/20">
                    <span className="text-2xl">👐</span>
                  </div>
                  <p className="text-3xl font-bold text-yellow-400 mb-1">
                    {allPlayers.reduce((total, player) => total + (player.catches || 0), 0)}
                  </p>
                  <p className="text-blue-300 mb-2">Total Catches</p>
                  <p className="text-sm text-white">All Players</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TournamentStats;
