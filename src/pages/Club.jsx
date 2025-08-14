import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaUserFriends, FaCalendarAlt, FaPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';
import cricketImage from '../assets/sophita/Homepage/cricket1.png';
import logo from '../assets/sophita/HomePage/Picture3.png';
import backButton from '../assets/kumar/right-chevron.png';

const ClubPage = () => {
  const [showTeamsDropdown, setShowTeamsDropdown] = useState(false);
  const [showMatchesDropdown, setShowMatchesDropdown] = useState(false);
  const [showClubDropdown, setShowClubDropdown] = useState(false);

  return (
    <div 
      className="min-h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #000000 15%, #001A80 87%, #000D40 100%)'
      }}
    >
      {/* Header */}
      <header className="pt-2 px-2">
        <div className="w-full mx-auto flex justify-between items-start">
          {/* Logo and Back Button */}
          <div className="flex flex-col">
            <div className="flex items-center">
              <motion.img
                src={logo}
                alt="Cricklytics Logo"
                className="h-7 w-7 md:h-10 object-contain block select-none"
                whileHover={{ scale: 1.05 }}
              />
              <span className="text-2xl font-bold text-white pl-3">Cricklytics</span>
            </div>
            <img 
              src={backButton} 
              alt="Back"
              className="h-7 w-7 md:h-10 w-10 mt-2 ml-1 cursor-pointer transform rotate-180"
              onClick={() => window.history.back()}
            />
          </div>
          
          {/* Mobile Dropdowns - Top Right Corner */}
          <div className="flex md:hidden flex-col gap-2">
            <div className="relative">
              <button 
                className="flex items-center justify-between w-full bg-[#51aab1] text-white px-4 py-2 rounded-lg hover:bg-[#4acfd4] transition-colors"
                onClick={() => setShowClubDropdown(!showClubDropdown)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">Austria CC Wien Club</span>
                </div>
                {showClubDropdown ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {showClubDropdown && (
                <div className="absolute right-0 mt-1 w-full bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <a href="#" className="block px-4 py-2 text-gray-800 hover:bg-gray-200 transition-colors text-sm">Club Profile</a>
                    <a href="#" className="block px-4 py-2 text-gray-800 hover:bg-gray-200 transition-colors text-sm">Club Members</a>
                    <a href="#" className="block px-4 py-2 text-gray-800 hover:bg-gray-200 transition-colors text-sm">Club Settings</a>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                className="flex items-center justify-between w-full bg-[#51aab1] text-white px-4 py-2 rounded-lg hover:bg-[#4acfd4] transition-colors"
                onClick={() => setShowMatchesDropdown(!showMatchesDropdown)}
              >
                <div className="flex items-center gap-2">
                  <FaCalendarAlt />
                  <span className="text-sm">Upcoming Matches</span>
                </div>
                {showMatchesDropdown ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {showMatchesDropdown && (
                <div className="absolute right-0 mt-1 w-full bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <div className="p-2 hover:bg-gray-200 cursor-pointer transition-colors">
                      <p className="font-medium text-gray-800 text-sm">Austria CC vs Vienna CC</p>
                      <p className="text-xs text-gray-600">May 10, 2025</p>
                    </div>
                    <div className="p-2 hover:bg-gray-200 cursor-pointer transition-colors">
                      <p className="font-medium text-gray-800 text-sm">Austria CC vs Graz CC</p>
                      <p className="text-xs text-gray-600">May 17, 2025</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                className="flex items-center justify-between w-full bg-[#51aab1] text-white px-4 py-2 rounded-lg hover:bg-[#4acfd4] transition-colors"
                onClick={() => setShowTeamsDropdown(!showTeamsDropdown)}
              >
                <div className="flex items-center gap-2">
                  <FaUserFriends />
                  <span className="text-sm">Teams And Players</span>
                </div>
                {showTeamsDropdown ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {showTeamsDropdown && (
                <div className="absolute right-0 mt-1 w-full bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <div className="p-2 hover:bg-gray-200 cursor-pointer transition-colors">
                      <p className="font-medium text-gray-800 text-sm">Senior Team</p>
                      <p className="text-xs text-gray-600">12 players</p>
                    </div>
                    <div className="p-2 hover:bg-gray-200 cursor-pointer transition-colors">
                      <p className="font-medium text-gray-800 text-sm">Junior Team</p>
                      <p className="text-xs text-gray-600">8 players</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col md:flex-row md:gap-20 h-[calc(100vh-120px)] mt-[-20px]">
        {/* Left Side - Cricket Image */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-end h-full items-start pt-4 md:pt-2">
          <img 
            src={cricketImage} 
            alt="Cricket"
            className="h-auto max-h-[65vh] md:max-h-[75vh] object-contain"
          />
        </div>

        {/* Right Side - Dropdowns (desktop only) */}
        <div className="hidden md:flex flex-col gap-4 w-1/2 h-full justify-center pt-4 md:pl-10 pr-8">
          <div className="relative w-full max-w-xs">
            <button 
              className="flex items-center justify-between w-full bg-[#51aab1] text-white px-4 py-2 rounded-lg hover:bg-[#4acfd4] transition-colors"
              onClick={() => setShowClubDropdown(!showClubDropdown)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base">Austria CC Wien Club</span>
              </div>
              {showClubDropdown ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {showClubDropdown && (
              <div className="absolute w-full mt-1 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <a href="#" className="block px-4 py-2 text-gray-800 hover:bg-gray-200 transition-colors text-sm">Club Profile</a>
                  <a href="#" className="block px-4 py-2 text-gray-800 hover:bg-gray-200 transition-colors text-sm">Club Members</a>
                  <a href="#" className="block px-4 py-2 text-gray-800 hover:bg-gray-200 transition-colors text-sm">Club Settings</a>
                </div>
              </div>
            )}
          </div>

          <div className="relative w-full max-w-xs">
            <button 
              className="flex items-center justify-between w-full bg-[#51aab1] text-white px-4 py-2 rounded-lg hover:bg-[#4acfd4] transition-colors"
              onClick={() => setShowMatchesDropdown(!showMatchesDropdown)}
            >
              <div className="flex items-center gap-2">
                <FaCalendarAlt />
                <span className="text-sm sm:text-base">Upcoming Matches</span>
              </div>
              {showMatchesDropdown ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {showMatchesDropdown && (
              <div className="absolute w-full mt-1 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <div className="p-2 hover:bg-gray-200 cursor-pointer transition-colors">
                    <p className="font-medium text-gray-800 text-sm">Austria CC vs Vienna CC</p>
                    <p className="text-xs text-gray-600">May 10, 2025</p>
                  </div>
                  <div className="p-2 hover:bg-gray-200 cursor-pointer transition-colors">
                    <p className="font-medium text-gray-800 text-sm">Austria CC vs Graz CC</p>
                    <p className="text-xs text-gray-600">May 17, 2025</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative w-full max-w-xs">
            <button 
              className="flex items-center justify-between w-full bg-[#51aab1] text-white px-4 py-2 rounded-lg hover:bg-[#4acfd4] transition-colors"
              onClick={() => setShowTeamsDropdown(!showTeamsDropdown)}
            >
              <div className="flex items-center gap-2">
                <FaUserFriends />
                <span className="text-sm sm:text-base">Teams And Players</span>
              </div>
              {showTeamsDropdown ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {showTeamsDropdown && (
              <div className="absolute w-full mt-1 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <div className="p-2 hover:bg-gray-200 cursor-pointer transition-colors">
                    <p className="font-medium text-gray-800 text-sm">Senior Team</p>
                    <p className="text-xs text-gray-600">12 players</p>
                  </div>
                  <div className="p-2 hover:bg-gray-200 cursor-pointer transition-colors">
                    <p className="font-medium text-gray-800 text-sm">Junior Team</p>
                    <p className="text-xs text-gray-600">8 players</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Join Club Button */}
        <div className="absolute w-full flex justify-center bottom-16 md:bottom-20">
          <button className="bg-[#51aab1] text-white px-8 py-3 rounded-lg hover:bg-[#4acfd4] transition-colors flex items-center justify-center gap-2 text-lg md:text-xl">
            <FaPlus size={20} />
            Join Club
          </button>
        </div>
      </main>
    </div>
  );
};

export default ClubPage;