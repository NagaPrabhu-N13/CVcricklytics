import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaRegImage } from 'react-icons/fa';
import logo from '../assets/sophita/HomePage/picture3_2.png';
import backButton from '../assets/kumar/right-chevron.png';
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase"; // Adjust path as needed
import { collection, onSnapshot } from "firebase/firestore";

export default function Highlights() {
  const [activeTab, setActiveTab] = useState('myteam');
  const navigate = useNavigate();
  const [mediaData, setMediaData] = useState({ videos: [], photos: [] });

  const tabContentVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  // Fetch media data from Firestore match_highlights collection
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(collection(db, 'match_highlights'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(entry => entry.userId === auth.currentUser.uid)
        .reduce((acc, entry) => {
          const type = entry.type === 'video' ? 'videos' : 'photos';
          acc[type].push(entry);
          return acc;
        }, { videos: [], photos: [] });
      setMediaData(data);
    }, (error) => {
      console.error("Error fetching media:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div
      className="min-h-screen p-4 flex flex-col"
      style={{
        backgroundImage: 'linear-gradient(140deg,#080006 15%,#FF0077)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top Navbar */}
      <div className="flex flex-col mt-0">
        <div className="flex items-start">
          <img
            src={logo}
            alt="Cricklytics Logo"
               className="w-20 h-20 sm:w-25 sm:h-25 object-cover select-none"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/Picture3 2.png";
            }}
          />
          <span className="p-2 text-2xl font-bold text-white whitespace-nowrap text-shadow-[0_0_8px_rgba(93,224,230,0.4)]">
            Cricklytics
          </span>
        </div>
        <div className="md:absolute flex items-center gap-4 md:mt-12">
          <img
            src={backButton}
            alt="Back"
            className="h-8 w-8 cursor-pointer -scale-x-100"
            onClick={() => navigate("/search-aft")}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center space-x-12 text-white text-lg font-semibold border-b-4 border-white pb-2">
        <div
          onClick={() => setActiveTab('myteam')}
          className={`cursor-pointer ${activeTab === 'myteam' ? 'border-b-2 border-white text-blue-500' : ''}`}
        >
          Highlights
        </div>
        <div
          onClick={() => setActiveTab('following')}
          className={`cursor-pointer ${activeTab === 'following' ? 'border-b-2 border-white text-blue-500' : ''}`}
        >
          Photos
        </div>
        <div
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer ${activeTab === 'all' ? 'border-b-2 border-white text-blue-500' : ''}`}
        >
          Videos
        </div>
      </div>

      {/* Animated Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'myteam' && (
          <motion.div
            key="myteam"
            variants={tabContentVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center justify-center text-center mt-24"
          >
            <motion.div
              className="w-40 h-40 flex items-center justify-center bg-white rounded-full mb-6 shadow-lg cursor-pointer hover:scale-105 transition-transform"
              whileHover={{ scale: 1.1 }}
            >
              <FaPlay className="text-black text-6xl" />
            </motion.div>
            <p className="text-lg font-medium mb-4 text-center text-black">
              We don’t have Highlights of this player yet but you can have yours!
            </p>
            <button
              className="bg-[#70005A] text-white px-10 py-4 text-xl font-semibold rounded-md shadow-md shadow-black transition duration-300 hover:bg-[blue] hover:-translate-y-1"
              onClick={() => navigate("/go-live-upcomming")}
            >
              Go Live
            </button>
          </motion.div>
        )}

        {activeTab === 'following' && (
          <motion.div
            key="following"
            variants={tabContentVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-h-[700px] overflow-y-auto px-4"
          >
            {mediaData.photos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
                {mediaData.photos.map((photo) => (
                  <motion.div
                    key={photo.id}
                    whileHover={{ scale: 1.03 }}
                    className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center relative"
                  >
                    <img
                      src={photo.url}
                      alt="Photo"
                      className="w-full h-48 object-cover rounded-md mb-4"
                      onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center mt-24">
                <FaRegImage className="text-black text-[100px] mb-6" />
                <p className="text-lg font-medium text-black">Player match media not found</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'all' && (
          <motion.div
            key="all"
            variants={tabContentVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-h-[700px] overflow-y-auto px-4"
          >
            {mediaData.videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
                {mediaData.videos.map((video) => (
                  <motion.div
                    key={video.id}
                    whileHover={{ scale: 1.03 }}
                    className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center relative"
                  >
                    <video
                      controls
                      className="w-full h-48 object-cover rounded-md mb-4"
                    >
                      <source src={video.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <p className="text-black font-medium">{video.title || 'Video'}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center mt-24">
                <FaRegImage className="text-black text-[100px] mb-6" />
                <p className="text-lg font-medium text-black">No videos found</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}