import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Picture3 from '../../../assets/sophita/HomePage/Picture3.png';
import { motion } from 'framer-motion';
import { FaCrown, FaChevronLeft, FaStar } from 'react-icons/fa';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from '../../../firebase';

const FieldingStatsPage = () => {
  const [stats, setStats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      console.log("No authenticated user found.");
      setStats([]);
      return;
    }

    const q = query(
      collection(db, 'clubTeams'),
      where('createdBy', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const statsList = [];

      snapshot.docs.forEach((doc) => {
        const teamData = doc.data();
        const teamPlayers = teamData.players || [];

        teamPlayers.forEach((player) => {
          if (player.userId === auth.currentUser.uid) {
            const fieldingStats = player.careerStats?.fielding || {};
            const matches = player.careerStats?.batting?.matches || 0;
            const totalPoints = (fieldingStats.runOuts || 0) + (fieldingStats.catches || 0);
            const rankScore = matches > 0 ? totalPoints / matches : 0;

            statsList.push({
              id: player.playerId?.toString() || `${doc.id}-${player.name}`,
              playerId: player.playerId || "N/A",
              name: player.name || 'Unknown',
              matches,
              runOuts: fieldingStats.runOuts || 0,
              catches: fieldingStats.catches || 0,
              overs: Math.floor(player.careerStats?.bowling?.overs || 0),
              rankScore,
              stars: player.stars || 0,
              avatar: player.avatar || player.image || '',
              userId: player.userId,
              teamName: player.teamName || "Unknown"
            });
          }
        });
      });

      const sortedStats = statsList.sort((a, b) => b.rankScore - a.rankScore);

      let rank = 1;
      let prevScore = null;

      sortedStats.forEach((player) => {
        if (prevScore !== null && player.rankScore !== prevScore) {
          rank++;
        }
        player.rank = rank;
        prevScore = player.rankScore;
      });

      // Top 5 get Pro tag
      sortedStats.forEach((player, index) => {
        player.isPro = index < 5;
      });

      setStats(sortedStats);
    }, (error) => {
      console.error("Error fetching fielding stats:", error);
      setStats([]);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#03001e] via-[#7303c0] to-[#ec38bc] text-white">
      <nav className="fixed top-0 w-full bg-gradient-to-r from-[#03001e] to-[#7303c0] p-4 shadow-lg z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/landingpage")}
              className="flex items-center bg-[#7303c0] hover:bg-[#8a05e6] px-3 py-2 rounded-full"
            >
              <FaChevronLeft className="text-xl" />
            </button>
            <img src={Picture3} alt="Logo" className="h-8 w-8" />
            <span className="text-xl font-bold">Cricklytics</span>
          </div>
        </div>
      </nav>

      <main className="pt-24 px-4 md:px-8 pb-8">
        <motion.div
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, staggerChildren: 0.1 } }}
          initial="hidden"
          animate="visible"
          className="overflow-x-auto"
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="text-left p-2">Player</th>
                <th className="text-center p-2">Mat</th>
                <th className="text-center p-2">Runouts</th>
                <th className="text-center p-2">Catches</th>
                <th className="text-center p-2">Overs</th>
                <th className="text-center p-2">Rank</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((p) => (
                <motion.tr
                  key={p.id}
                  className="border-b border-gray-700 hover:bg-gray-800/50"
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                >
                  <td className="p-2 flex items-center gap-3">
                    <div className="relative">
                      {p.avatar ? (
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-10 h-10 rounded-full object-cover bg-gray-700"
                          onError={(e) => { e.currentTarget.src = ""; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white uppercase font-bold text-lg">
                          {p.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      {p.isPro && (
                        <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                          <FaCrown className="text-xs text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-300">
                        ID: {p.playerId} | {p.teamName}
                      </div>
                      <div className="flex items-center">
                        {Array.from({ length: p.stars }).map((_, i) => (
                          <FaStar key={i} className="text-yellow-400 text-xs" />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="p-2 text-center">{p.matches}</td>
                  <td className="p-2 text-center">{p.runOuts}</td>
                  <td className="p-2 text-center">{p.catches}</td>
                  <td className="p-2 text-center">{p.overs}</td>
                  <td className="p-2 text-center font-bold text-yellow-400">{p.rank}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </main>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
        className="fixed bottom-4 right-4 text-yellow-400 text-4xl"
      >
        <FaCrown />
      </motion.div>
    </div>
  );
};

export default FieldingStatsPage;
