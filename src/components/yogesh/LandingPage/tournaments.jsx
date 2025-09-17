import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleSelectionModal from '../LandingPage/RoleSelectionModal';
import AddTournamentModal from '../LandingPage/AddTournamentModal';
import { db, auth } from '../../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useClub } from './ClubContext';

// Helper function to parse DD-MMM-YY to Date object for sorting
const parseDateString = (dateStr) => {
  if (!dateStr) return new Date(0); // Return a very old date for invalid strings

  const [day, monthStr, yearStr] = dateStr.split('-');
  const currentYear = new Date().getFullYear();
  let year = parseInt(yearStr, 10);

  // Simple heuristic for 2-digit years (e.g., '22' -> 2022, '99' -> 1999)
  const fullYear = year > (currentYear % 100) + 10 ? 1900 + year : 2000 + year;

  const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };
  const month = monthMap[monthStr];

  if (month === undefined || isNaN(parseInt(day, 10))) {
    console.warn("Invalid date string encountered:", dateStr);
    return new Date(0); // Return a very old date for unparseable strings
  }

  return new Date(fullYear, month, parseInt(day, 10));
};

const Tournament = () => {
  const { clubName } = useClub();
  const [isClubCreator, setIsClubCreator] = useState(false);

  const [showRoleModal, setShowRoleModal] = useState(() => {
    const storedRole = sessionStorage.getItem('userRole');
    return !storedRole; // Show modal if no role is stored
  });
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('userRole') || null;
  });
  const [showAddTournamentModal, setShowAddTournamentModal] = useState(false);

  const [tournamentData, setTournamentData] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(() => {
    return sessionStorage.getItem('selectedTournamentId') || null;
  });
  const [loadingTournament, setLoadingTournament] = useState(true);
  const [tournamentError, setTournamentError] = useState(null);

  const [recentMatches, setRecentMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesError, setMatchesError] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [topBattingPerformers, setTopBattingPerformers] = useState([]);
  const [topBowlingPerformers, setTopBowlingPerformers] = useState([]);
  const [loadingPerformers, setLoadingPerformers] = useState(true);
  const [performersError, setPerformersError] = useState(null);

  const [totalRuns, setTotalRuns] = useState(0);
  const [totalWickets, setTotalWickets] = useState(0);
  const [averageWicketsPerPlayer, setAverageWicketsPerPlayer] = useState(0);
  const [totalHalfCenturies, setTotalHalfCenturies] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const handleSelectRole = (role) => {
    setUserRole(role);
    sessionStorage.setItem('userRole', role);
    setShowRoleModal(false);
  };

  const handleTournamentAdded = (newTournament) => {
    setTournaments((prevTournaments) => {
      if (prevTournaments.some((t) => t.id === newTournament.id)) {
        return prevTournaments;
      }
      const updatedTournaments = [...prevTournaments, newTournament];
      return updatedTournaments.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
    });

    setSelectedTournamentId(newTournament.id);
    setTournamentData(newTournament);
    sessionStorage.setItem('selectedTournamentId', newTournament.id);
    setTournamentError(null);
    setShowAddTournamentModal(false);
  };

  // Effect to listen for auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setTournamentData(null);
        setTournaments([]);
        setRecentMatches([]);
        setUpcomingMatches([]);
        setTopBattingPerformers([]);
        setTopBowlingPerformers([]);
        setTournamentError("You must be logged in to view tournaments.");
        setIsClubCreator(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch club ownership to determine if current user is the creator
  useEffect(() => {
    if (!currentUserId || !clubName) {
      setIsClubCreator(false);
      return;
    }

    const q = query(
      collection(db, "clubs"),
      where("name", "==", clubName),
      where("userId", "==", currentUserId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setIsClubCreator(!querySnapshot.empty);
    }, (err) => {
      console.error("Error checking club ownership:", err);
      setIsClubCreator(false);
    });

    return () => unsubscribe();
  }, [currentUserId, clubName]);

  // Fetch all matching tournaments from the tournament collection
  useEffect(() => {
    if (!clubName) {
      setLoadingTournament(false);
      setTournaments([]);
      setTournamentData(null);
      setSelectedTournamentId(null);
      sessionStorage.removeItem('selectedTournamentId');
      return;
    }

    setLoadingTournament(true);
    setTournamentError(null);

    const q = query(
      collection(db, "tournament"),
      where("selectedClubs", "array-contains", clubName)
    );

    const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const fetchedTournaments = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTournaments(fetchedTournaments);

        const storedTournamentId = sessionStorage.getItem('selectedTournamentId');
        const isValidTournament = fetchedTournaments.some(t => t.id === storedTournamentId);

        if (storedTournamentId && isValidTournament) {
          const selected = fetchedTournaments.find(t => t.id === storedTournamentId);
          setSelectedTournamentId(storedTournamentId);
          setTournamentData(selected || null);
        } else {
          const newestTournament = fetchedTournaments.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
          })[0];

          if (newestTournament) {
            setSelectedTournamentId(newestTournament.id);
            setTournamentData(newestTournament);
            sessionStorage.setItem('selectedTournamentId', newestTournament.id);
          } else {
            setSelectedTournamentId(null);
            setTournamentData(null);
            sessionStorage.removeItem('selectedTournamentId');
          }
        }
      } else {
        setTournaments([]);
        setTournamentData(null);
        setSelectedTournamentId(null);
        sessionStorage.removeItem('selectedTournamentId');
        setTournamentError("No tournaments found for this club.");
      }
      setLoadingTournament(false);
    }, (err) => {
      console.error("Error fetching tournaments:", err);
      setTournamentError("Failed to load tournaments: " + err.message);
      setLoadingTournament(false);
    });

    return () => unsubscribeSnapshot();
  }, [clubName]);

  // Handle tournament selection
  const handleTournamentChange = (event) => {
    const tournamentId = event.target.value;
    setSelectedTournamentId(tournamentId);
    sessionStorage.setItem('selectedTournamentId', tournamentId);
    const selectedTournament = tournaments.find(t => t.id === tournamentId);
    setTournamentData(selectedTournament || null);
  };

  // Fetch matches for the selected tournament
  useEffect(() => {
    if (!tournamentData?.id) {
      setRecentMatches([]);
      setUpcomingMatches([]);
      setLoadingMatches(false);
      return;
    }

    setLoadingMatches(true);
    setMatchesError(null);

    const matchesQuery = query(
      collection(db, "tournamentMatches"),
      where("tournamentId", "==", tournamentData.id)
    );

    const unsubscribeMatches = onSnapshot(matchesQuery, (querySnapshot) => {
      const allMatches = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const now = new Date();
      const tempRecent = [];
      const tempUpcoming = [];

      allMatches.forEach(match => {
        const matchDate = parseDateString(match.date);
        if (match.status && match.status.toLowerCase() === 'past') {
          tempRecent.push(match);
        } else if (match.status && match.status.toLowerCase() === 'upcoming') {
          tempUpcoming.push(match);
        } else {
          if (matchDate < now) {
            tempRecent.push(match);
          } else {
            tempUpcoming.push(match);
          }
        }
      });

      tempRecent.sort((a, b) => parseDateString(b.date) - parseDateString(a.date));
      tempUpcoming.sort((a, b) => parseDateString(a.date) - parseDateString(b.date));

      setRecentMatches(tempRecent);
      setUpcomingMatches(tempUpcoming);
      setLoadingMatches(false);
    }, (err) => {
      console.error("Error fetching tournament matches:", err);
      setMatchesError("Failed to load matches: " + err.message);
      setLoadingMatches(false);
    });

    return () => unsubscribeMatches();
  }, [tournamentData]);

  // Fetch top performers and calculate tournament statistics
  useEffect(() => {
    if (!clubName || !tournamentData?.name) {
      setLoadingPerformers(false);
      setLoadingStats(false);
      setPerformersError("You must be logged in and select a tournament to view performers.");
      setStatsError("You must be logged in and select a tournament to view statistics.");
      setTopBattingPerformers([]);
      setTopBowlingPerformers([]);
      setTotalRuns(0);
      setTotalWickets(0);
      setTotalHalfCenturies(0);
      setAverageWicketsPerPlayer(0);
      return;
    }

    setLoadingPerformers(true);
    setPerformersError(null);
    setLoadingStats(true);
    setStatsError(null);

    const playersQuery = query(
      collection(db, 'clubPlayers'),
      where('clubName', '==', clubName),
      where('tournamentName', '==', tournamentData.name)
    );

    const unsubscribePlayers = onSnapshot(playersQuery, (querySnapshot) => {
      const players = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          matches: data.careerStats?.batting?.matches || 0,
          innings: data.careerStats?.batting?.innings || 0,
          runs: data.careerStats?.batting?.runs || 0,
          highestScore: data.careerStats?.batting?.highest || 0,
          notOuts: data.careerStats?.batting?.notOuts || 0,
          battingAverage: data.careerStats?.batting?.average || 0,
          strikeRate: data.careerStats?.batting?.strikeRate || 0,
          centuries: data.careerStats?.batting?.centuries || 0,
          fifties: data.careerStats?.batting?.fifties || 0,
          fours: data.careerStats?.batting?.fours || 0,
          sixes: data.careerStats?.batting?.sixes || 0,
          wickets: data.careerStats?.bowling?.wickets || 0,
          bowlingAverage: data.careerStats?.bowling?.average || 0,
          economy: data.careerStats?.bowling?.economy || 0,
        };
      });

      if (players.length === 0) {
        setPerformersError("No players found for this tournament.");
        setStatsError("No statistics available for this tournament.");
        setTopBattingPerformers([]);
        setTopBowlingPerformers([]);
        setTotalRuns(0);
        setTotalWickets(0);
        setTotalHalfCenturies(0);
        setAverageWicketsPerPlayer(0);
        setLoadingPerformers(false);
        setLoadingStats(false);
        return;
      }

      // Sort and set top batting performers
      const sortedBatting = players
        .filter(p => p.runs > 0)
        .sort((a, b) => b.runs - a.runs)
        .slice(0, 2);
      setTopBattingPerformers(sortedBatting);

      // Sort and set top bowling performers
      const sortedBowling = players
        .filter(p => p.wickets > 0)
        .sort((a, b) => b.wickets - a.wickets)
        .slice(0, 2);
      setTopBowlingPerformers(sortedBowling);

      // Calculate tournament statistics
      const totalRuns = players.reduce((sum, player) => sum + (player.runs || 0), 0);
      const totalWickets = players.reduce((sum, player) => sum + (player.wickets || 0), 0);
      const totalHalfCenturies = players.reduce((sum, player) => sum + (player.fifties || 0), 0);
      const totalPlayersWithWickets = players.filter(p => p.wickets > 0).length;
      const averageWickets = totalPlayersWithWickets > 0 ? (totalWickets / totalPlayersWithWickets).toFixed(2) : 0;

      setTotalRuns(totalRuns);
      setTotalWickets(totalWickets);
      setTotalHalfCenturies(totalHalfCenturies);
      setAverageWicketsPerPlayer(averageWickets);

      setLoadingPerformers(false);
      setLoadingStats(false);
    }, (err) => {
      console.error("Error fetching performers and stats:", err);
      setPerformersError("Failed to load top performers: " + err.message);
      setStatsError("Failed to load tournament statistics: " + err.message);
      setLoadingPerformers(false);
      setLoadingStats(false);
    });

    return () => unsubscribePlayers();
  }, [clubName, tournamentData]);

  if (authLoading) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">
        Loading authentication...
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen p-6 text-gray-100">
      <AnimatePresence>
        {showRoleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RoleSelectionModal onSelectRole={handleSelectRole} />
          </motion.div>
        )}
      </AnimatePresence>

      {userRole && (
        <>
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              {loadingTournament ? (
                <div className="text-gray-400">Loading tournament data...</div>
              ) : tournamentError ? (
                <div className="text-red-500">{tournamentError}</div>
              ) : tournamentData ? (
                <>
                  <div>
                    <h1 className="text-3xl font-bold text-purple-400">{tournamentData.name}</h1>
                    <select
                      value={selectedTournamentId || ''}
                      onChange={handleTournamentChange}
                      className="mt-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-md p-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {tournaments.map(tournament => (
                        <option key={tournament.id} value={tournament.id}>
                          {tournament.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-gray-400 mt-2">
                      {tournamentData.location} | {tournamentData.season}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-4">
                      <span className="bg-purple-900 text-purple-300 px-3 py-1 rounded-full text-sm">
                        {tournamentData.teams} Teams
                      </span>
                      <span className="bg-purple-900 text-purple-300 px-3 py-1 rounded-full text-sm">
                        {tournamentData.matches} Matches
                      </span>
                      <span className="bg-purple-900 text-purple-300 px-3 py-1 rounded-full text-sm">
                        {tournamentData.currentStage}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <h3 className="font-semibold text-gray-300">Defending Champions</h3>
                    <p className="text-xl font-bold text-blue-400">{tournamentData.defendingChampion || '...'}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {tournamentData.startDate} - {tournamentData.endDate}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-gray-400">
                  No tournaments found. {userRole === 'admin' ? 'Add one below.' : 'Check back later.'}
                </div>
              )}
              {/*
              {userRole === 'admin' && currentUserId && isClubCreator && (
                <button
                  onClick={() => setShowAddTournamentModal(true)}
                  className="mt-6 md:mt-0 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors self-start md:self-center"
                >
                  Add Tournament
                </button>
              )}
              */}
            </div>
          </div>

          {!loadingTournament && !tournamentData && (
            <div className="text-center text-gray-400 text-xl py-8">
              {userRole === 'admin'
                ? 'No tournaments found. Add a new tournament to get started.'
                : 'No active tournaments found for your club.'}
            </div>
          )}

          {tournamentData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 lg:col-span-2 border border-gray-700">
                <h2 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">Recent Matches</h2>
                {loadingMatches ? (
                  <div className="text-gray-400 text-center">Loading recent matches...</div>
                ) : matchesError ? (
                  <div className="text-red-500 text-center">{matchesError}</div>
                ) : recentMatches.length > 0 ? (
                  <div className="space-y-4">
                    {recentMatches.map((match) => (
                      <div key={match.id} className="border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-100">{match.team1} vs {match.team2}</h3>
                            <p className="text-sm text-gray-400 mt-1">{match.date} - {match.overs}</p>
                          </div>
                          <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs text-sm">
                            {match.status}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-300">{match.result}</p>
                        <p className="mt-1 text-sm text-purple-400">⭐ {match.stage}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center">No recent matches found for this tournament.</div>
                )}
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">Upcoming Matches</h2>
                {loadingMatches ? (
                  <div className="text-gray-400 text-center">Loading upcoming matches...</div>
                ) : matchesError ? (
                  <div className="text-red-500 text-center">{matchesError}</div>
                ) : upcomingMatches.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingMatches.map((match) => (
                      <div key={match.id} className="border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
                        <h3 className="font-medium text-gray-100">{match.team1} vs {match.team2}</h3>
                        <div className="mt-2 flex items-center text-sm text-gray-400">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {match.date}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-400">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a6 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {match.location}
                        </div>
                        <button className="mt-3 w-full bg-purple-900 text-purple-300 py-1 rounded text-sm font-medium hover:bg-purple-800 transition">
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center">No upcoming matches found for this tournament.</div>
                )}
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">Top Performers</h2>
                {loadingPerformers ? (
                  <div className="text-gray-400 text-center">Loading top performers...</div>
                ) : performersError ? (
                  <div className="text-red-500 text-center">{performersError}</div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-300 mb-2">Batting</h3>
                      <div className="space-y-3">
                        {topBattingPerformers.length > 0 ? (
                          topBattingPerformers.map((player, index) => (
                            <div key={player.id} className="flex items-center">
                              <div className="w-8 h-8 bg-purple-900 rounded-full flex items-center justify-center text-purple-300 font-bold mr-3">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-100">{player.name}</p>
                                <p className="text-xs text-gray-400">
                                  {player.runs} runs | Avg: {player.battingAverage.toFixed(2)} | SR: {player.strikeRate.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400 text-sm">No top batsmen found.</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-300 mb-2">Bowling</h3>
                      <div className="space-y-3">
                        {topBowlingPerformers.length > 0 ? (
                          topBowlingPerformers.map((player, index) => (
                            <div key={player.id} className="flex items-center">
                              <div className="w-8 h-8 bg-purple-900 rounded-full flex items-center justify-center text-purple-300 font-bold mr-3">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-100">{player.name}</p>
                                <p className="text-xs text-gray-400">
                                  {player.wickets} wkts | Avg: {player.bowlingAverage.toFixed(2)} | Econ: {player.economy.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400 text-sm">No top bowlers found.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg p-6 lg:col-span-2 border border-gray-700">
                <h2 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">Tournament Statistics</h2>
                {loadingStats ? (
                  <div className="text-gray-400 text-center">Loading statistics...</div>
                ) : statsError ? (
                  <div className="text-red-500 text-center">{statsError}</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-700 p-4 rounded-lg text-center border border-gray-600">
                      <p className="text-2xl font-bold text-purple-400">{totalRuns}</p>
                      <p className="text-sm text-gray-400">Total Runs</p>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg text-center border border-gray-600">
                      <p className="text-2xl font-bold text-purple-400">{totalWickets}</p>
                      <p className="text-sm text-gray-400">Total Wickets</p>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg text-center border border-gray-600">
                      <p className="text-2xl font-bold text-purple-400">{averageWicketsPerPlayer}</p>
                      <p className="text-sm text-gray-400">Avg Wkts per Player</p>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg text-center border border-gray-600">
                      <p className="text-2xl font-bold text-purple-400">{totalHalfCenturies}</p>
                      <p className="text-sm text-gray-400">Half Centuries</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showAddTournamentModal && currentUserId && (
        <AddTournamentModal
          onClose={() => setShowAddTournamentModal(false)}
          onTournamentAdded={handleTournamentAdded}
          currentUserId={currentUserId}
          clubName={clubName}
        />
      )}
    </div>
  );
};

export default Tournament;
