import React, { useEffect, useState } from 'react';
import Frame1321317519 from '../components/pawan/Frame';
import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from '../firebase';

function TournamentStats() {
    const [topBatsmen, setTopBatsmen] = useState([]);
    const [topBowlers, setTopBowlers] = useState([]);
    const [topFielders, setTopFielders] = useState([]);
    const [activeTab, setActiveTab] = useState('batting');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Fetch top 3 batsmen by runs
            const batsmenQuery = query(
                collection(db, 'PlayerDetails'),
                orderBy('careerStats.batting.runs', 'desc'),
                limit(3)
            );
            
            const unsubscribeBatsmen = onSnapshot(batsmenQuery, 
                (snapshot) => {
                    const batsmenList = snapshot.docs.map(doc => {
                        const playerData = doc.data();
                        return {
                            id: doc.id,
                            name: playerData.name || 'Unknown',
                            team: playerData.teamName || 'Unknown',
                            photoUrl: playerData.image || '',
                            runs: playerData.careerStats?.batting?.runs || 0,
                            average: playerData.careerStats?.batting?.average || 0,
                            strikeRate: playerData.careerStats?.batting?.strikeRate || 0,
                            highest: playerData.careerStats?.batting?.highest || 0,
                            matches: playerData.careerStats?.batting?.matches || 0,
                            centuries: playerData.careerStats?.batting?.centuries || 0,
                            halfCenturies: playerData.careerStats?.batting?.halfCenturies || 0,
                        };
                    });
                    setTopBatsmen(batsmenList);
                },
                (error) => {
                    console.error("Error fetching batsmen:", error);
                    setError("Failed to load batting statistics");
                }
            );

            // Fetch top 3 bowlers by wickets
            const bowlersQuery = query(
                collection(db, 'PlayerDetails'),
                orderBy('careerStats.bowling.wickets', 'desc'),
                limit(3)
            );
            
            const unsubscribeBowlers = onSnapshot(bowlersQuery, 
                (snapshot) => {
                    const bowlersList = snapshot.docs.map(doc => {
                        const playerData = doc.data();
                        return {
                            id: doc.id,
                            name: playerData.name || 'Unknown',
                            team: playerData.teamName || 'Unknown',
                            photoUrl: playerData.image || '',
                            wickets: playerData.careerStats?.bowling?.wickets || 0,
                            economy: playerData.careerStats?.bowling?.economy || 0,
                            bowlingAverage: playerData.careerStats?.bowling?.average || 0,
                            bestBowling: playerData.careerStats?.bowling?.best || '0/0',
                            matches: playerData.careerStats?.bowling?.matches || 0,
                            fiveWickets: playerData.careerStats?.bowling?.fiveWickets || 0,
                        };
                    });
                    setTopBowlers(bowlersList);
                },
                (error) => {
                    console.error("Error fetching bowlers:", error);
                    setError("Failed to load bowling statistics");
                }
            );

            // Fetch top 3 fielders by catches
            const fieldersQuery = query(
                collection(db, 'PlayerDetails'),
                orderBy('careerStats.fielding.catches', 'desc'),
                limit(3)
            );
            
            const unsubscribeFielders = onSnapshot(fieldersQuery, 
                (snapshot) => {
                    const fieldersList = snapshot.docs.map(doc => {
                        const playerData = doc.data();
                        return {
                            id: doc.id,
                            name: playerData.name || 'Unknown',
                            team: playerData.teamName || 'Unknown',
                            photoUrl: playerData.image || '',
                            catches: playerData.careerStats?.fielding?.catches || 0,
                            stumpings: playerData.careerStats?.fielding?.stumpings || 0,
                            runOuts: playerData.careerStats?.fielding?.runOuts || 0,
                            matches: playerData.careerStats?.fielding?.matches || 0,
                        };
                    });
                    setTopFielders(fieldersList);
                    setIsLoading(false);
                },
                (error) => {
                    console.error("Error fetching fielders:", error);
                    setError("Failed to load fielding statistics");
                    setIsLoading(false);
                }
            );

            return () => {
                unsubscribeBatsmen();
                unsubscribeBowlers();
                unsubscribeFielders();
            };
        } catch (err) {
            console.error("Error setting up listeners:", err);
            setError("Failed to initialize statistics");
            setIsLoading(false);
        }
    }, []);

    const StatCard = ({ player, statType, rank }) => {
        // Safe number formatting function
        const formatNumber = (num, decimals = 2) => {
            if (num === null || num === undefined) return '0.00';
            return typeof num === 'number' ? num.toFixed(decimals) : num.toString();
        };

        // Medal colors for top 3 positions
        const getRankColor = (rank) => {
            switch(rank) {
                case 1: return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
                case 2: return 'bg-gradient-to-r from-gray-400 to-gray-500';
                case 3: return 'bg-gradient-to-r from-amber-600 to-amber-700';
                default: return 'bg-blue-600';
            }
        };

        return (
            <div className="relative bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300 shadow-lg hover:shadow-xl">
                {/* Rank badge with medal effect */}
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
                            {/* Team indicator dot */}
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-full border-2 border-gray-800"></div>
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

            {/* Header Section */}
            <div className="container mx-auto px-4 sm:px-6 pt-8 pb-6">
                <div className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
                        Tournament <span className="text-yellow-400">Statistics</span>
                    </h1>
                    <p className="text-blue-200 max-w-2xl mx-auto">
                        Discover the top performers across batting, bowling, and fielding in the tournament
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-10">
                    <div className="inline-flex bg-blue-900/30 backdrop-blur-md p-1 rounded-xl border border-white/10">
                        {['batting', 'bowling', 'fielding'].map((tab) => (
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

                {/* Stats Content */}
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
                            {activeTab === 'batting' && (
                                topBatsmen.length > 0 ? (
                                    topBatsmen.map((player, index) => (
                                        <StatCard 
                                            key={player.id} 
                                            player={player} 
                                            statType="batting" 
                                            rank={index + 1} 
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-3 text-center py-12 bg-white/5 rounded-xl border border-white/10">
                                        <p className="text-blue-200 text-lg">No batting statistics available</p>
                                    </div>
                                )
                            )}
                            
                            {activeTab === 'bowling' && (
                                topBowlers.length > 0 ? (
                                    topBowlers.map((player, index) => (
                                        <StatCard 
                                            key={player.id} 
                                            player={player} 
                                            statType="bowling" 
                                            rank={index + 1} 
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-3 text-center py-12 bg-white/5 rounded-xl border border-white/10">
                                        <p className="text-blue-200 text-lg">No bowling statistics available</p>
                                    </div>
                                )
                            )}
                            
                            {activeTab === 'fielding' && (
                                topFielders.length > 0 ? (
                                    topFielders.map((player, index) => (
                                        <StatCard 
                                            key={player.id} 
                                            player={player} 
                                            statType="fielding" 
                                            rank={index + 1} 
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-3 text-center py-12 bg-white/5 rounded-xl border border-white/10">
                                        <p className="text-blue-200 text-lg">No fielding statistics available</p>
                                    </div>
                                )
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
                                        {topFielders.reduce((total, player) => total + (player.catches || 0), 0)}
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