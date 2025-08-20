import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChartLine, FaTrash } from 'react-icons/fa';
import logo from './../assets/kumar/logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  doc
} from 'firebase/firestore';

const Tabletoppers = () => {
  const [activeTab, setActiveTab] = useState('leather');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    rank: '',
    team: '',
    since: '',
    matches: '',
    wins: '',
    dominance: '',
    streak: ''
  });

  const collectionName = 'tabletoppers';

  const fetchTeams = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) {
        setTeams([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, collectionName),
        where('ballType', '==', activeTab),
        where('userId', '==', auth.currentUser.uid),
        orderBy('rank')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      console.log(`Fetched teams for "${activeTab}":`, data);
      setTeams(data);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setTeams([]);
      alert('Failed to fetch teams');
    }
    setLoading(false);
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;

    try {
      await deleteDoc(doc(db, collectionName, teamId));
      setTeams(teams.filter(team => team.id !== teamId));
    } catch (err) {
      console.error('Error deleting team:', err);
      alert('Failed to delete team');
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [activeTab]);

  const totalTeams = teams.length;
  const avgMatches = totalTeams
    ? (teams.reduce((sum, t) => sum + Number(t.matches), 0) / totalTeams).toFixed(1)
    : 0;
  const topWinPercent = totalTeams
    ? Math.max(...teams.map((t) => parseInt(t.dominance)))
    : 0;
  const longestStreak = totalTeams
    ? teams
        .map((t) => ({
          type: t.streak[0],
          len: parseInt(t.streak.slice(1)),
        }))
        .sort((a, b) => b.len - a.len)[0]
    : null;
  const longestStreakStr = longestStreak
    ? longestStreak.type + longestStreak.len
    : '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, collectionName), {
        ...formData,
        matches: Number(formData.matches),
        wins: Number(formData.wins),
        ballType: activeTab,
        userId: auth.currentUser.uid
      });
      setFormData({
        rank: '',
        team: '',
        since: '',
        matches: '',
        wins: '',
        dominance: '',
        streak: ''
      });
      setShowModal(false);
      fetchTeams();
    } catch (err) {
      console.error('Error adding team:', err);
      alert('Failed to add team');
    }
  };

  const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
  const tabVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#03001e] via-[#7303c0] to-[#ec38bc] text-white">
      {/* Header */}
      <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto px-4 pt-6 pb-2">
  <div className="flex items-center gap-4 bg-black/30 rounded-lg p-4 mb-5">
    <motion.button
      onClick={() => navigate(-1)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="text-white/80 hover:text-white text-2xl p-2"
    >
      <FaChevronLeft />
    </motion.button>
    <img
      src={logo}
      alt="Cricklytics"
          className="w-20 h-20 md:h-20 md:w-20"
    />
    <span className="text-2xl font-bold text-shadow-[0_0_8px_rgba(93,224,230,0.4)]">
      Cricklytics
    </span>
  </div>
</motion.header>

      {/* Tabs and Add Button */}
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center mb-3">
        <div className="flex border-b border-gray-600">
          {['leather', 'tennis'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative py-4 px-6 text-lg font-medium transition-colors ${
                activeTab === tab ? 'text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              {tab === 'leather' ? 'Leather Ball' : 'Tennis Ball'}
              {activeTab === tab && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 rounded-t"
                />
              )}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)} className="bg-yellow-400 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-500">
          Add Team
        </button>
      </div>

      {/* Summary Stats */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <FaChartLine className="text-yellow-400" />
            {activeTab === 'leather' ? 'Leather Ball Dominance' : 'Tennis Ball Supremacy'}
          </h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-200">
            {[
              ['Total Teams', totalTeams],
              ['Avg. Matches', avgMatches],
              ['Top Win %', topWinPercent + '%'],
              ['Longest Streak', longestStreakStr]
            ].map(([label, val]) => (
              <div key={label} className="bg-white/10 p-3 rounded-lg">
                <div className="text-sm text-gray-300">{label}</div>
                <div className="text-xl font-bold">{val}</div>
              </div>
            ))}
          </div>

          {loading && <p className="text-center mt-4">Loading…</p>}
        </motion.div>

        {/* Teams List */}
        {!loading && teams.length === 0 && (
          <p className="text-center text-lg">No teams available. Click "Add Team."</p>
        )}

        {!loading && teams.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial="hidden" animate="visible" exit="hidden" variants={tabVariants} className="space-y-6">
              {teams.map((item, idx) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={`relative overflow-hidden bg-gradient-to-r ${
                    idx === 0
                      ? 'from-yellow-500/10 via-yellow-600/10 to-yellow-700/10 border-yellow-400'
                      : 'from-white/5 via-white/10 to-white/5 border-white/20'
                  } rounded-xl border p-6 shadow-lg`}
                >
                  {idx === 0 && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-black px-3 py-1 text-xs font-bold rounded-bl-lg">
                      CHAMPIONS
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full mr-4 ${
                          idx === 0
                            ? 'bg-yellow-400 text-black'
                            : idx === 1
                            ? 'bg-gray-300 text-black'
                            : idx === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        <span className="text-xl font-bold">{item.rank}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-semibold">{item.team}</h3>
                          <div
                            className={`px-2 py-1 text-xs rounded-full ${
                              item.streak.startsWith('W')
                                ? 'bg-green-500/30 text-green-300'
                                : 'bg-red-500/30 text-red-300'
                            }`}
                          >
                            {item.streak}
                          </div>
                        </div>
                        <p className="text-sm text-gray-300">Since {item.since}</p>
                        <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-gray-100">
                          <div>Matches: <span className="font-semibold">{item.matches}</span></div>
                          <div>Wins: <span className="font-semibold">{item.wins}</span></div>
                          <div>Dominance: <span className="font-semibold">{item.dominance}</span></div>
                        </div>
                      </div>
                    </div>
                    <FaTrash
                      className="text-white hover:text-red-500 cursor-pointer"
                      onClick={() => handleDeleteTeam(item.id)}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Add Team Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-[#1a1a2e] rounded-lg max-w-lg w-full p-6 overflow-auto max-h-[90vh]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">
                Add {activeTab === 'leather' ? 'Leather' : 'Tennis'} Ball Team
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 text-white">
                {[
                  { key: 'rank', label: 'Rank', example: 'e.g., 1' },
                  { key: 'team', label: 'Team', example: 'e.g., India' },
                  { key: 'since', label: 'Since', example: 'e.g., 2023' },
                  { key: 'matches', label: 'Matches', example: 'e.g., 50' },
                  { key: 'wins', label: 'Wins', example: 'e.g., 30' },
                  { key: 'dominance', label: 'Dominance', example: 'e.g., 60%' },
                  { key: 'streak', label: 'Streak', example: 'e.g., W5' }
                ].map(({ key, label, example }) => (
                  <div key={key}>
                    <label className="block mb-1 font-semibold">
                      {label}
                    </label>
                    <p className="text-sm text-gray-300 mb-1">{example}</p>
                    <input
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 rounded bg-[#222244] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder={`Enter ${key}`}
                    />
                  </div>
                ))}
                <div className="flex justify-end mt-6 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-md"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tabletoppers;