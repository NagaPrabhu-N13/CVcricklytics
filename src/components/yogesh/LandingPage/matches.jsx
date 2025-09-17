import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleSelectionModal from '../LandingPage/RoleSelectionModal';
import AddMatchModal from '../LandingPage/AddMatchModal';
import { db, auth } from '../../../firebase';
import { collection, query, onSnapshot, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useClub } from './ClubContext';

const Matches = () => {
  const { clubName } = useClub();

  const [showRoleModal, setShowRoleModal] = useState(() => {
    const storedRole = sessionStorage.getItem('userRole');
    return !storedRole;
  });
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('userRole') || null;
  });
  const [isClubCreator, setIsClubCreator] = useState(false);
  const [clubCreatorLoading, setClubCreatorLoading] = useState(true);

  const [showAddMatchModal, setShowAddMatchModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState('all');

  // --- NEW: Teams and Matches state ---
  const [clubTeams, setClubTeams] = useState([]);        // All team names from clubTeams
  const [matchesData, setMatchesData] = useState([]);    // Filtered matches from scoringpage
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [matchesError, setMatchesError] = useState(null);

  const handleSelectRole = (role) => {
    setUserRole(role);
    sessionStorage.setItem('userRole', role);
    setShowRoleModal(false);
  };

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

  // Club creator status
  useEffect(() => {
    if (!currentUserId || !clubName) {
      setIsClubCreator(false);
      setClubCreatorLoading(false);
      return;
    }
    setClubCreatorLoading(true);
    const q = query(
      collection(db, 'clubs'),
      where('name', '==', clubName),
      where('userId', '==', currentUserId)
    );
    const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
      setIsClubCreator(!querySnapshot.empty);
      if (querySnapshot.empty && !sessionStorage.getItem('userRole')) {
        setUserRole('viewer');
        sessionStorage.setItem('userRole', 'viewer');
        setShowRoleModal(false);
      } else if (!querySnapshot.empty && !sessionStorage.getItem('userRole')) {
        setShowRoleModal(true);
      }
      setClubCreatorLoading(false);
    }, (err) => {
      setIsClubCreator(false);
      setClubCreatorLoading(false);
    });
    return () => unsubscribeSnapshot();
  }, [currentUserId, clubName]);

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
          const createdAt = match.createdAt; // store Firestore string
          const status = createdAt ? getMatchStatus(createdAt, now) : 'past';
          matches.push({ id: doc.id, ...match, status, createdAt });
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

  // Categorization function
  function getMatchStatus(createdAt, now = new Date()) {
    const matchDate = new Date(createdAt);
    const twoHoursMs = 2 * 60 * 60 * 1000;
    const delta = matchDate - now;

    if (Math.abs(delta) <= twoHoursMs) return 'live';
    if (delta < -twoHoursMs) return 'past';
    return 'upcoming';
  }

  // Filtering and sorting (latest first)
  const filteredMatches = matchesData
    .filter(match => {
      if (activeFilter === 'all') return true;
      return match.status === activeFilter;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Latest at top

  // Add match modal permissions (if any)
  const canAddMatch = userRole === 'admin' && currentUserId && isClubCreator;

  // Defensive loading/UI
  if (authLoading || clubCreatorLoading) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">
        Loading...
      </div>
    );
  }
  if (!currentUserId && userRole === 'admin') {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">
        Please log in to add matches as an admin.
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
      <AnimatePresence>
        {showRoleModal && isClubCreator && (
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
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-purple-400 font-bold text-xl">
              Matches for Club Teams of <span className="text-green-400">{clubName}</span>
            </h2>
            {canAddMatch && (
              <button
                onClick={() => setShowAddMatchModal(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ml-4"
              >
                Add Match
              </button>
            )}
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
                <div key={match.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 hover:border-purple-500 transition-colors">
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <h2 className="text-lg font-bold text-purple-400">
                        {match.phase || match.stage || 'Match'}
                      </h2>
                      <span className="text-sm text-gray-400">
                        Umpire: {match.umpire}, Date: {match.date}, Overs: {match.teamA?.overs}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-base font-semibold text-gray-100">
                        {match.teamA?.name}
                      </div>
                      <div className="text-base font-bold text-gray-100">
                        {typeof match.teamA?.totalScore !== 'undefined' ? match.teamA.totalScore : '-'}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-base font-semibold text-gray-100">
                        {match.teamB?.name}
                      </div>
                      <div className="text-base font-bold text-gray-100">
                        {typeof match.teamB?.totalScore !== 'undefined' ? match.teamB.totalScore : '-'}
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-green-900 bg-opacity-30 rounded border border-green-800">
                      <p className="font-medium text-green-400">
                        {match.matchResult ? `${match.matchResult} team, won the match` : 'No result yet'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 text-xl py-8">No matches found for your club teams.</div>
            )}
          </div>
        </>
      )}

      {/* {showAddMatchModal && canAddMatch && (
        <AddMatchModal
          onClose={() => setShowAddMatchModal(false)}
          onMatchAdded={() => {
            setShowAddMatchModal(false);
          }}
          currentUserId={currentUserId}
        />
      )} */}
    </div>
  );
};

export default Matches;
