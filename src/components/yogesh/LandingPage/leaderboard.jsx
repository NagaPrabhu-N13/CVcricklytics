import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useClub } from './ClubContext';

const LeaderboardContent = () => {
  const { clubName } = useClub();
  const [isClubCreator, setIsClubCreator] = useState(false);

  const [showMore, setShowMore] = useState(false);
  const [battingStats, setBattingStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [clubTeams, setClubTeams] = useState([]);

  // Effect to listen for auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setError('Please log in to view the leaderboard.');
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

  // Fetch club teams for this clubName
  useEffect(() => {
    if (!clubName) {
      setClubTeams([]);
      return;
    }
    getDocs(query(collection(db, 'clubTeams'), where('clubName', '==', clubName)))
      .then(res => {
        const teams = res.docs.map(doc => doc.data().teamName);
        setClubTeams(teams);
      })
      .catch(() => setClubTeams([]));
  }, [clubName]);

  // Effect to fetch players from PlayerDetails
  useEffect(() => {
    if (!clubTeams.length) {
      setBattingStats([]);
      return;
    }
    setLoading(true);
    setError(null);

    // Assuming clubTeams length <= 10 for the demo
    const q = query(
      collection(db, 'PlayerDetails'),
      where('teamName', 'in', clubTeams)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const players = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          matches: data.matches || 0,
          innings: data.careerStats?.batting?.innings || 0,
          runs: data.careerStats?.batting?.runs || 0,
          highestScore: data.careerStats?.batting?.highest || 0,
          notOuts: data.careerStats?.batting?.notOuts || 0,
          average: data.careerStats?.batting?.average || 0,
          strikeRate: data.careerStats?.batting?.strikeRate || 0,
          centuries: data.careerStats?.batting?.centuries || 0,
          fifties: data.careerStats?.batting?.fifties || 0,
          fours: data.careerStats?.batting?.fours || 0,
          sixes: data.careerStats?.batting?.sixes || 0
        };
      });

      setBattingStats(players.sort((a, b) => b.runs - a.runs));
      setLoading(false);
    }, (err) => {
      setError("Failed to load players: " + err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clubTeams]);

  if (authLoading) {
    return <div className="text-white text-center p-4 bg-gray-900 min-h-screen">Loading authentication...</div>;
  }

  if (!currentUserId) {
    return <div className="text-white text-center p-4 bg-gray-900 min-h-screen">Please log in to view the leaderboard.</div>;
  }

  if (loading) {
    return <div className="text-white text-center p-4 bg-gray-900 min-h-screen">Loading leaderboard...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4 bg-gray-900 min-h-screen">Error: {error}</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto bg-gray-900 min-h-screen">
      {/* Title */}
      <h1 className="text-2xl font-bold text-white mb-4">Batting Leaderboard</h1>

      {/* Stats Table */}
      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">NO.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Batter</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">MAT</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">INN</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">R</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">HS</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">N/O</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">AVG</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">SR</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">100s</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">50s</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">4s</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">6s</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {battingStats.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-4 py-3 text-center text-sm text-gray-300">
                    No players found.
                  </td>
                </tr>
              ) : (
                battingStats.slice(0, showMore ? battingStats.length : 5).map((player, index) => (
                  <tr key={player.id} className="hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{player.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{player.matches}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{player.innings}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{player.runs}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{player.highestScore}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{player.notOuts}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{player.average.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{player.strikeRate.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{player.centuries}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{player.fifties}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{player.fours}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{player.sixes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load More Button */}
      {battingStats.length > 5 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowMore(!showMore)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
          >
            {showMore ? 'SHOW LESS' : 'LOAD MORE'}
          </button>
        </div>
      )}
    </div>
  );
};

export default LeaderboardContent;
