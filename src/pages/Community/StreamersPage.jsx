import React, { useState, useEffect } from "react";
import { FaYoutube, FaTwitch, FaUserFriends, FaEye, FaStar, FaArrowLeft } from "react-icons/fa";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { useNavigate } from 'react-router-dom';
import backButton from '../../assets/kumar/right-chevron.png';
import cuslogo from "../../assets/yogesh/communityimg/cuslogo.png"; // Fallback image
import { db, auth } from "../../firebase"; // Adjust path as needed
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

const PlatformIcon = ({ platform }) => {
  const icons = {
    YouTube: <FaYoutube className="text-red-500" />,
    Twitch: <FaTwitch className="text-purple-500" />
  };
  return <span className="text-lg">{icons[platform]}</span>;
};

const StreamersPage = () => {
  const navigate = useNavigate();
  const [streamersData, setStreamersData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    platform: 'YouTube',
    isLive: false,
    avatar: '',
    viewers: '',
    followers: '',
    match: '',
    rating: '',
    tags: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Available tag options
  const tagOptions = ['Commentary', 'HD Stream', 'Analysis', 'Q&A', 'Multi-cam', 'Replays', 'Interviews', 'BTS'];

  // Fetch streamer data from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(collection(db, 'Streamers'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(entry => entry.userId === auth.currentUser.uid);
      setStreamersData(data);
    }, (error) => {
      console.error("Error fetching streamers:", error);
    });

    return () => unsubscribe();
  }, []);

  // Handle saving or updating streamer data
  const handleSaveData = async () => {
    if (!formData.name.trim() || !formData.platform || !formData.viewers.trim() || !formData.followers.trim() || !formData.match.trim() || !formData.rating || !formData.tags.length) {
      alert("Please fill all required fields!");
      return;
    }
    if (isNaN(formData.rating) || formData.rating < 0 || formData.rating > 5) {
      alert("Rating must be between 0 and 5!");
      return;
    }
    if (!formData.viewers.match(/^\d+(\.\d{1,2})?K?$/)) {
      alert("Viewers must be a number (e.g., 12.5K or 1000)!");
      return;
    }
    if (!formData.followers.match(/^\d+(\.\d{1,2})?K?$/)) {
      alert("Followers must be a number (e.g., 245K or 1000)!");
      return;
    }
    if (formData.avatar && !formData.avatar.match(/\.(jpg|jpeg|png|gif)$/i)) {
      alert("Please provide a valid image URL (jpg, jpeg, png, gif)!");
      return;
    }

    setIsLoading(true);
    try {
      const entryData = {
        name: formData.name,
        platform: formData.platform,
        isLive: formData.isLive,
        avatar: formData.avatar || cuslogo,
        viewers: formData.viewers,
        followers: formData.followers,
        match: formData.match,
        rating: parseFloat(formData.rating),
        tags: formData.tags,
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'Streamers', editingId), entryData);
      } else {
        await addDoc(collection(db, 'Streamers'), entryData);
      }

      setFormData({
        name: '',
        platform: 'YouTube',
        isLive: false,
        avatar: '',
        viewers: '',
        followers: '',
        match: '',
        rating: '',
        tags: [],
      });
      setEditingId(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving data:", err);
      alert("Failed to save data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting streamer data
  const handleDeleteData = async (id) => {
    if (!window.confirm("Are you sure you want to delete this streamer?")) return;

    try {
      await deleteDoc(doc(db, 'Streamers', id));
    } catch (err) {
      console.error("Error deleting data:", err);
      alert("Failed to delete data. Please try again.");
    }
  };

  // Handle editing streamer data
  const handleEditData = (streamer) => {
    setFormData({
      name: streamer.name,
      platform: streamer.platform,
      isLive: streamer.isLive,
      avatar: streamer.avatar === cuslogo ? '' : streamer.avatar,
      viewers: streamer.viewers,
      followers: streamer.followers,
      match: streamer.match,
      rating: streamer.rating.toString(),
      tags: streamer.tags,
    });
    setEditingId(streamer.id);
    setIsModalOpen(true);
  };

  return (
    <section className="bg-gradient-to-b from-[#0b0f28] to-[#06122e] text-white min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <img
            src={backButton}
            alt="Back"
            className="h-8 w-8 cursor-pointer -scale-x-100"
            onClick={() => window.history.back()}
          />
        </div>
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-blue-400 mb-2 flex items-center justify-center gap-2">
            Cricket Streamers
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
            Find the best cricket streams across platforms
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={() => {
              setFormData({
                name: '',
                platform: 'YouTube',
                isLive: false,
                avatar: '',
                viewers: '',
                followers: '',
                match: '',
                rating: '',
                tags: [],
              });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Streamer
          </button>
        </div>

        {streamersData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {streamersData.map((streamer) => (
              <div
                key={streamer.id}
                className="bg-[#111936] rounded-xl p-4 border border-blue-600/20 hover:border-blue-400 shadow-md hover:shadow-blue-700/20 transition-all duration-300 flex flex-col"
              >
                {/* Header with avatar and basic info */}
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={streamer.avatar}
                    alt={streamer.name}
                    className="w-12 h-12 rounded-full border-2 border-blue-500"
                    onError={(e) => { e.target.src = cuslogo; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold truncate">{streamer.name}</h2>
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={streamer.platform} />
                        <FiEdit
                          className="text-yellow-500 cursor-pointer hover:text-yellow-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditData(streamer);
                          }}
                        />
                        <FiTrash2
                          className="text-red-500 cursor-pointer hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteData(streamer.id);
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center text-yellow-400 text-xs">
                        <FaStar className="mr-1" />
                        {streamer.rating}
                      </div>
                      {streamer.isLive ? (
                        <div className="flex items-center bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                          LIVE
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Offline</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current match */}
                <div className="bg-[#1a2342] px-3 py-2 rounded-lg mb-3">
                  <p className="text-sm font-medium text-blue-300 truncate">{streamer.match}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <FaEye className="text-green-400" /> {streamer.viewers} watching
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {streamer.tags.map((tag, i) => (
                    <span key={i} className="bg-blue-900/40 text-blue-300 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats bar */}
                <div className="mt-auto space-y-2">
                  {streamer.hasOwnProperty('uptime') && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Uptime</span>
                      <span className="font-medium">{streamer.uptime}</span>
                    </div>
                  )}
                  {/* <UptimeBar percentage={parseInt(streamer.uptime)} /> */}

                  <div className="flex justify-between items-center text-xs mt-2">
                    <div className="flex items-center text-gray-400">
                      <FaUserFriends className="mr-1" /> {streamer.name}
                      <p>{streamer.followers}</p>
                    </div>
                    <button className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      streamer.isLive
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`} >
                      {streamer.isLive ? (
                        <>
                          <FaEye /> Watch
                        </>
                      ) : (
                        <>
                          <FaEye /> Watch
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-700"> No streamers added. Add a streamer to get started!</p>
        )}

        {/* Modal for Adding/Editing Streamer */}
        {isModalOpen && (
          <div className="border-2 border-b-white fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
            <div
              className="w-96 rounded-lg p-6 shadow-lg max-h-[80vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(140deg, rgba(8,0,6,0.85) 15%, rgba(255,0,119,0.85))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-white text-center font-semibold">
                {editingId ? 'Edit Streamer' : 'Add Streamer'}
              </h2>
              <label className="block mb-1 text-white font-semibold" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter streamer name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}>
              </input>
              <label className="block mb-1 text-white font-semibold" htmlFor="platform">
                Platform
              </label>
              <select
                id="platform"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              >
                <option value="YouTube">YouTube</option>
                <option value="Twitch">Twitch</option>
              </select>
              <label className="block mb-1 text-white font-semibold" htmlFor="isLive">
                Live Status
              </label>
              <input
                id="isLive"
                type="checkbox"
                checked={formData.isLive}
                onChange={(e) => setFormData({ ...formData, isLive: e.target.checked })}
                className="mb-4"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="avatar">
                Avatar URL (Optional)
              </label>
              <input
                id="avatar"
                type="text"
                placeholder="Enter avatar URL"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                className="w-full mb-3 p-2 rounded mb-4 border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}>
              </input>
              <label className="block mb-1 text-white font-semibold" htmlFor="viewers">
                Viewers
              </label>
              <input
                id="viewers"
                type="text"
                placeholder="Enter viewers (e.g., 12.5K)"
                value={formData.viewers}
                onChange={(e) => setFormData({ ...formData, viewers: e.target.value })}
                className="w-full mb-3 p-2 rounded mb-4 border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="followers">
                Followers
              </label>
              <input
                id="followers"
                type="text"
                placeholder="Enter followers (e.g., 245K)"
                value={formData.followers}
                onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                className="w-full mb-3 p-2 rounded mb-4 border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="match">
                Match
              </label>
              <input
                id="match"
                type="text"
                placeholder="Enter match (e.g., IND vs AUS • 3rd Test)"
                value={formData.match}
                onChange={(e) => setFormData({ ...formData, match: e.target.value })}
                className="w-full mb-3 p-2 rounded mb-4 border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="rating">
                Rating (0-5)
              </label>
              <input
                id="rating"
                type="number"
                placeholder="Enter rating"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full mb-3 p-2 rounded mb-4 border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
                max="5"
                step="0.1"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="tags">
                Tags
              </label>
              <select
                id="tags"
                multiple
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: Array.from(e.target.selectedOptions, option => option.value) })}
                className="w-full mb-3 p-2 rounded mb-4 border border-gray-600 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              >
                {tagOptions.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setFormData({
                      name: '',
                      platform: 'YouTube',
                      isLive: false,
                      avatar: '',
                      viewers: '',
                      followers: '',
                      match: '',
                      rating: '',
                      tags: [],
                    });
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveData}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded transition"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default StreamersPage;