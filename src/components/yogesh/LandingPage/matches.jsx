import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../../../firebase';
import { collection, query, onSnapshot, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useClub } from './ClubContext';

const Matches = () => {
  const { clubName } = useClub();

  const [currentUserId, setCurrentUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState('all');

  // --- NEW: Teams and Matches state ---
  const [clubTeams, setClubTeams] = useState([]);        // All team names from clubTeams
  const [matchesData, setMatchesData] = useState([]);    // Filtered matches from scoringpage
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [matchesError, setMatchesError] = useState(null);

  // User auth
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setMatchesData([]);
        setMatchesError('Please log in to view matches.');
      }
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // --- Fetch club teams for this clubName ---
  useEffect(() => {
    if (!clubName) {
      setClubTeams([]);
      return;
    }
    setLoadingMatches(true);
    getDocs(query(collection(db, 'clubTeams'), where('clubName', '==', clubName)))
      .then(res => {
        const teams = res.docs.map(doc =>
          doc.data().teamName
        );
        setClubTeams(teams);
      })
      .catch(() => setClubTeams([]));
  }, [clubName]);

  // --- Fetch all matches from scoringpage and filter by club teams, add status ---
  useEffect(() => {
    if (!clubTeams.length) {
      setMatchesData([]);
      setLoadingMatches(false);
      return;
    }
    setLoadingMatches(true);
    const q = collection(db, 'scoringpage');
    const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
      const matches = [];
      const now = new Date(); // current browser time
      querySnapshot.forEach(doc => {
        const match = doc.data();
        if (
          match?.teamA?.name && clubTeams.includes(match.teamA.name) ||
          match?.teamB?.name && clubTeams.includes(match.teamB.name)
        ) {
          const status = getMatchStatus(match, now);
          matches.push({ id: doc.id, ...match, status });
        }
      });
      setMatchesData(matches);
      setLoadingMatches(false);
      setMatchesError(matches.length === 0 ? 'No matches found for your club teams.' : null);
    }, (err) => {
      setLoadingMatches(false);
      setMatchesError("Failed to load match data: " + err.message);
    });
    return () => unsubscribeSnapshot();
  }, [clubTeams]);

  useEffect(() => {
    // Only fetch if viewing 'upcoming'
    if (activeFilter !== 'upcoming' || !clubTeams.length) return;

    // Fetch all roundrobin docs
    getDocs(collection(db, 'roundrobin'))
      .then(snapshot => {
        let rrMatches = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          const tournamentName = data.tournamentName || 'Round Robin Tournament'; // Fetch from doc
          // Defensive: handle empty or undefined matchSchedule array
          (data?.matchSchedule || []).forEach((sched, idx) => {
            if (!sched.match) return;
            // Split teams
            const [teamA, teamB] = sched.match.split(' vs ').map(x => x.trim());
            // Either team must be a club team, and winner must be null
            if (
              (clubTeams.includes(teamA) || clubTeams.includes(teamB))
              && sched.winner == null // Show only if winner is not set
            ) {
              rrMatches.push({
                key: `${doc.id}_${idx}`,
                tournamentName, // Use the doc-level tournamentName
                match: sched.match, // Display this
                date: sched.date, // Display this
                time: sched.time, // Display this
                matchId: sched.matchId,
                teamA: { name: teamA }, // Standardize for rendering
                teamB: { name: teamB },
                status: 'upcoming',
                matchResult: null // No result yet
              });
            }
          });
        });
        // Combine with matchesData, replacing 'upcoming' ones
        setMatchesData(prevMatches => [
          ...prevMatches.filter(m => m.status !== 'upcoming'), // Filter out old 'upcoming'
          ...rrMatches // Add new 'upcoming' matches from roundrobin
        ]);
      });
  }, [clubTeams, activeFilter]);

  // Categorization function
  function getMatchStatus(match, now = new Date()) {
    // Prioritize the 'status' field if it exists
    if (match.status) {
      if (match.status === 'live') return 'live';
      if (match.status === 'past') return 'past';
    }

    // Fallback to existing logic if status is missing or not live/past
    if (!match.date || !match.time) {
      return 'past'; // Fallback if fields are missing
    }

    let matchDateTime;
    try {
      matchDateTime = new Date(`${match.date}T${match.time}:00`);
      if (isNaN(matchDateTime.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (e) {
      console.error(`Invalid date/time for match ${match.id}: ${match.date} ${match.time}`);
      return 'past';
    }

    const delta = matchDateTime.getTime() - now.getTime();
    const threeHoursMs = 3 * 60 * 60 * 1000;

    if (match.matchResult == null) {
      // Even if expired, treat as upcoming if no result
      return 'upcoming';
    }

    if (delta > 0) {
      // If in the future
      if (delta <= threeHoursMs) {
        return 'live'; // Within 3 hours future: live
      }
      return 'upcoming'; // More than 3 hours future: upcoming
    }

    return 'past'; // Past and has result
  }

  // Filtering and sorting (latest first, using full datetime)
  const filteredMatches = matchesData
    .filter(match => {
      if (activeFilter === 'all') return true;
      return match.status === activeFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}:00`);
      const dateB = new Date(`${b.date}T${b.time}:00`);
      return dateB - dateA; // Latest at top
    });

  // Defensive loading/UI
  if (authLoading) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">
        Loading...
      </div>
    );
  }
  if (!clubName) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">
        No club selected. Please select a club to view matches.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-4 min-h-screen text-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-purple-400 font-bold text-xl">
          Matches for Club Teams of <span className="text-green-400">{clubName}</span>
        </h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'live', 'upcoming', 'past'].map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
              activeFilter === tab
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loadingMatches ? (
          <div className="text-center text-gray-400 text-xl py-8">Loading matches...</div>
        ) : matchesError ? (
          <div className="text-center text-red-500 text-xl py-8">{matchesError}</div>
        ) : filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <div key={match.id || match.key} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 hover:border-purple-500 transition-colors">
              <div className="p-4 border-b border-gray-700">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <h2 className="text-lg font-bold text-purple-400">
                    {match.tournamentName || 'Match'}
                  </h2>
                  <span className="text-sm text-gray-400">
                    Umpire: {match.umpire || 'TBD'}, Date: {match.date}, Time: {match.time}, Overs: {match.teamA?.overs || 'TBD'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-base font-semibold text-gray-100">
                    {match.teamA?.name || match.teams?.[0]}
                  </div>
                  <div className="text-base font-bold text-gray-100">
                    {typeof match.teamA?.totalScore !== 'undefined' ? match.teamA.totalScore : '-'}
                  </div>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-base font-semibold text-gray-100">
                    {match.teamB?.name || match.teams?.[1]}
                  </div>
                  <div className="text-base font-bold text-gray-100">
                    {typeof match.teamB?.totalScore !== 'undefined' ? match.teamB.totalScore : '-'}
                  </div>
                </div>
                <div className="mt-3 p-2 bg-green-900 bg-opacity-30 rounded border border-green-800">
                  <p className="font-medium text-green-400">
                    {match.status === 'upcoming' ? 'Upcoming' : (match.matchResult ? `${match.matchResult} team, won the match` : 'No result yet')}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 text-xl py-8">No matches found for your club teams.</div>
        )}
      </div>
    </div>
  );
};

export default Matches;
