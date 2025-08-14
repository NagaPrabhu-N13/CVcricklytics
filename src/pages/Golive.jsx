import React, { useState } from "react";
import { FaChevronDown, FaChevronUp, FaGlobeAmericas, FaTrophy, FaVenus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Southafrica from '../assets/sophita/HomePage/Southafrica.png';
import Netherland from '../assets/sophita/HomePage/Netherland.jpeg';
import backButton from '../assets/kumar/right-chevron.png';
import logo from '../assets/pawan/PlayerProfile/picture-312.png';

const Golive = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("international");
  const [openDropdown, setOpenDropdown] = useState(null);

  const iccTeams = {
    Asia: ["India", "Pakistan", "Sri Lanka", "Bangladesh", "Afghanistan"],
    Europe: ["England", "Ireland", "Scotland", "Netherlands"],
    Africa: ["South Africa", "Zimbabwe", "Namibia"],
    Australia: ["Australia", "New Zealand"],
    Americas: ["West Indies", "USA", "Canada"]
  };

  const continents = {
    Asia: ["India", "Pakistan", "Sri Lanka", "Bangladesh", "Afghanistan"],
    Europe: ["England", "Ireland", "Scotland", "Netherlands", "Germany"],
    Africa: ["South Africa", "Zimbabwe", "Namibia", "Kenya"],
    Oceania: ["Australia", "New Zealand", "Papua New Guinea"],
    Americas: ["West Indies", "USA", "Canada", "Bermuda"]
  };

  const dropdownStyles = {
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    headerBg: "#0f1a3a",
    hoverBg: "rgba(255, 255, 255, 0.15)",
    textColor: "#ffffff"
  };

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#001A80] text-white p-4 py-0">
     {/* Top Navigation Bar */}
           <div className="flex flex-col mt-0">
                   <div className="flex items-start">
                     <img 
                       src={logo}
                       alt="Cricklytics Logo"
                       className="h-7 w-7 md:h-10 object-contain block select-none"
                       onError={(e) => {
                         e.target.onerror = null;
                         e.target.src = "/images/Picture3 2.png";
                       }}
                     />
                     <span className="p-2 text-2xl font-bold text-white whitespace-nowrap text-shadow-[0_0_8px_rgba(93,224,230,0.4)]">
                       Cricklytics
                     </span>
                   </div>
                   </div>
                   <div className="md:absolute flex items-center gap-4">
                     <img 
                       src={backButton}
                       alt="Back"
                       className="h-8 w-8 cursor-pointer -scale-x-100"
                       onClick={() => navigate("/landingpage")}
                     />
                 </div>

        {/* Tab Selection - Mobile Optimized */}
        <div className="flex md:gap-10 justify-between mt-3 md:justify-end">
          <button
            className={`px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg transition-all duration-300 ${
              activeTab === "international" 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg" 
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => {
              setActiveTab("international");
              setOpenDropdown(null);
            }}
          >
            International
          </button>
          <button
            className={`px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg transition-all duration-300 ${
              activeTab === "national" 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg" 
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => {
              setActiveTab("national");
              setOpenDropdown(null);
            }}
          >
            National
          </button>
        </div>

      {/* Navigation Dropdowns - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-center gap-3 sm:gap-8 relative mb-6">
        {activeTab === "international" ? (
          <>
            {/* ICC Dropdown */}
            <div className="relative w-full sm:w-auto">
              <div
                className="flex items-center justify-between sm:justify-start gap-2 cursor-pointer text-base sm:text-lg p-2 sm:p-3 rounded-lg transition-all duration-300 hover:bg-blue-900/50"
                onClick={() => toggleDropdown("icc")}
              >
                <div className="flex items-center gap-2">
                  <FaGlobeAmericas className="text-blue-300 text-sm sm:text-base" />
                  <span>ICC Teams</span>
                </div>
                {openDropdown === "icc" ? <FaChevronUp className="text-blue-300" /> : <FaChevronDown className="text-blue-300" />}
              </div>
              {openDropdown === "icc" && (
                <div 
                  className="absolute left-0 right-0 sm:left-auto sm:right-auto rounded-lg py-2 w-full sm:min-w-[240px] max-h-[300px] overflow-y-auto border border-blue-400/50 mt-1 z-[100] shadow-xl"
                  style={{ background: dropdownStyles.background }}
                >
                  {Object.values(iccTeams).flat().map((team, index, array) => (
                    <React.Fragment key={team}>
                      <div
                        className="px-3 py-2 cursor-pointer transition-all duration-200 hover:shadow-md"
                        style={{ 
                          background: index % 2 === 0 ? "rgba(255,255,255,0.05)" : "transparent",
                          color: dropdownStyles.textColor
                        }}
                        onClick={() => navigate(`/${team.replace(/\s+/g, "")}`)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base hover:text-blue-300 transition-colors">{team}</span>
                        </div>
                      </div>
                      {index < array.length - 1 && (
                        <div className="h-[1px] w-full bg-blue-400/20 my-1"></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* T20 League Dropdown */}
            <div className="relative w-full sm:w-auto">
              <div
                className="flex items-center justify-between sm:justify-start gap-2 cursor-pointer text-base sm:text-lg p-2 sm:p-3 rounded-lg transition-all duration-300 hover:bg-blue-900/50"
                onClick={() => toggleDropdown("t20")}
              >
                <div className="flex items-center gap-2">
                  <FaTrophy className="text-blue-300 text-sm sm:text-base" />
                  <span>T20 League</span>
                </div>
                {openDropdown === "t20" ? <FaChevronUp className="text-blue-300" /> : <FaChevronDown className="text-blue-300" />}
              </div>
              {openDropdown === "t20" && (
                <div 
                  className="absolute left-0 right-0 sm:left-auto sm:right-auto rounded-lg py-2 w-full sm:min-w-[240px] max-h-[300px] overflow-y-auto border border-blue-400/50 mt-1 z-[100] shadow-xl"
                  style={{ background: dropdownStyles.background }}
                >
                  {[
                    "India vs Australia", "England vs Pakistan", "South Africa vs New Zealand",
                    "West Indies vs Bangladesh", "Sri Lanka vs Afghanistan", "Zimbabwe vs Ireland"
                  ].map((match, index, array) => (
                    <React.Fragment key={match}>
                      <div
                        className="px-3 py-2 cursor-pointer transition-all duration-200 hover:shadow-md"
                        style={{ 
                          background: index % 2 === 0 ? "rgba(255,255,255,0.05)" : "transparent",
                          color: dropdownStyles.textColor
                        }}
                        onClick={() => navigate(`/${match.replace(/\s+/g, "-")}`)}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm sm:text-base font-medium hover:text-blue-300 transition-colors">
                            {match.split(" vs ")[0]}
                          </span>
                          <span className="text-xs opacity-80">vs</span>
                          <span className="text-sm sm:text-base font-medium hover:text-blue-300 transition-colors">
                            {match.split(" vs ")[1]}
                          </span>
                        </div>
                      </div>
                      {index < array.length - 1 && (
                        <div className="h-[1px] w-full bg-blue-400/20 my-1"></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* Women's Teams Dropdown */}
            <div className="relative w-full sm:w-auto">
              <div
                className="flex items-center justify-between sm:justify-start gap-2 cursor-pointer text-base sm:text-lg p-2 sm:p-3 rounded-lg transition-all duration-300 hover:bg-blue-900/50"
                onClick={() => toggleDropdown("womens")}
              >
                <div className="flex items-center gap-2">
                  <FaVenus className="text-blue-300 text-sm sm:text-base" />
                  <span>Women's Teams</span>
                </div>
                {openDropdown === "womens" ? <FaChevronUp className="text-blue-300" /> : <FaChevronDown className="text-blue-300" />}
              </div>
              {openDropdown === "womens" && (
                <div 
                  className="absolute left-0 right-0 sm:left-auto sm:right-auto rounded-lg py-2 w-full sm:min-w-[240px] max-h-[300px] overflow-y-auto border border-blue-400/50 mt-1 z-[100] shadow-xl"
                  style={{ background: dropdownStyles.background }}
                >
                  {[
                    "India Women vs England Women", "Australia Women vs South Africa Women",
                    "Pakistan Women vs West Indies Women", "New Zealand Women vs Sri Lanka Women",
                    "Bangladesh Women vs Ireland Women"
                  ].map((match, index, array) => (
                    <React.Fragment key={match}>
                      <div
                        className="px-3 py-2 cursor-pointer transition-all duration-200 hover:shadow-md"
                        style={{ 
                          background: index % 2 === 0 ? "rgba(255,255,255,0.05)" : "transparent",
                          color: dropdownStyles.textColor
                        }}
                        onClick={() => navigate(`/${match.replace(/\s+/g, "-")}`)}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm sm:text-base font-medium hover:text-blue-300 transition-colors">
                            {match.split(" vs ")[0]}
                          </span>
                          <span className="text-xs opacity-80">vs</span>
                          <span className="text-sm sm:text-base font-medium hover:text-blue-300 transition-colors">
                            {match.split(" vs ")[1]}
                          </span>
                        </div>
                      </div>
                      {index < array.length - 1 && (
                        <div className="h-[1px] w-full bg-blue-400/20 my-1"></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* National Tab Dropdown */
          <div className="relative w-full sm:w-auto">
            <div
              className="flex items-center justify-between sm:justify-start gap-2 cursor-pointer text-base sm:text-lg p-2 sm:p-3 rounded-lg transition-all duration-300 hover:bg-blue-900/50"
              onClick={() => toggleDropdown("continents")}
            >
              <div className="flex items-center gap-2">
                <FaGlobeAmericas className="text-blue-300 text-sm sm:text-base" />
                <span>Countries</span>
              </div>
              {openDropdown === "continents" ? <FaChevronUp className="text-blue-300" /> : <FaChevronDown className="text-blue-300" />}
            </div>
            {openDropdown === "continents" && (
              <div 
                className="absolute left-0 right-0 sm:left-auto sm:right-auto rounded-lg py-2 w-full sm:min-w-[240px] max-h-[300px] overflow-y-auto border border-blue-400/50 mt-1 z-[100] shadow-xl"
                style={{ background: dropdownStyles.background }}
              >
                {Object.entries(continents).map(([continent, countries], continentIndex, continentsArray) => (
                  <React.Fragment key={continent}>
                    <div className="mb-2">
                      <h3 
                        className="px-3 py-2 font-bold text-xs sm:text-sm rounded-md shadow-md sticky top-0"
                        style={{ background: dropdownStyles.headerBg, color: dropdownStyles.textColor }}
                      >
                        {continent}
                      </h3>
                      {countries.map((country, countryIndex, countriesArray) => (
                        <React.Fragment key={country}>
                          <div
                            className="px-3 py-2 cursor-pointer transition-all duration-200 hover:shadow-md"
                            style={{ 
                              background: countryIndex % 2 === 0 ? "rgba(255,255,255,0.1)" : "transparent",
                              color: dropdownStyles.textColor
                            }}
                            onClick={() => navigate(`/${country.replace(/\s+/g, "")}`)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm sm:text-base hover:text-blue-300 transition-colors">{country}</span>
                            </div>
                          </div>
                          {countryIndex < countriesArray.length - 1 && (
                            <div className="h-[1px] w-full bg-blue-400/20 my-1"></div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    {continentIndex < continentsArray.length - 1 && (
                      <div className="h-[1px] w-full bg-blue-400/30 my-2"></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Score Section */}
      <div className="text-center font-sans text-lg sm:text-xl mt-4">
        <h1>Live Score Page - {activeTab === "international" ? "International" : "National"}</h1>
      </div>

      {/* Match Card - Mobile Optimized */}
      <div className="mt-6 relative bg-[rgba(71,156,182,0.7)] p-4 sm:p-6 rounded-xl shadow-lg border border-white/20 w-full max-w-[800px] mx-auto z-10">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 bg-[#F0EDED] p-4 sm:p-6 rounded-lg">
          {/* Netherlands */}
          <div className="flex flex-col items-center bg-[#1F048A] p-3 sm:p-4 rounded-lg w-full sm:w-48">
            <div className="bg-[#CDC6C6] p-1 sm:p-2 rounded-full mb-2">
              <img
                src={Netherland}
                alt="Netherlands Flag"
                className="w-12 h-8 sm:w-16 sm:h-10 object-cover rounded"
              />
            </div>
            <div className="text-white text-center">
              <p className="font-bold text-base sm:text-lg">Netherlands</p>
              <p className="text-lg sm:text-xl">198/6</p>
              <p className="text-xs sm:text-sm">(42 Overs)</p>
            </div>
          </div>

          <div className="text-xl sm:text-2xl font-bold text-gray-700">VS</div>

          {/* South Africa */}
          <div className="flex flex-col items-center bg-[#1F048A] p-3 sm:p-4 rounded-lg w-full sm:w-48">
            <div className="bg-[#CDC6C6] p-1 sm:p-2 rounded-full mb-2">
              <img
                src={Southafrica}
                alt="South Africa Flag"
                className="w-12 h-8 sm:w-16 sm:h-10 object-cover rounded"
              />
            </div>
            <div className="text-white text-center">
              <p className="font-bold text-base sm:text-lg">South Africa</p>
              <p className="text-lg sm:text-xl">178/3</p>
              <p className="text-xs sm:text-sm">(15.2 Overs)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex justify-center gap-4 sm:gap-6 items-center mt-8 w-full max-w-[800px] mx-auto px-4 pb-6">
        <button 
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 sm:px-6 sm:py-2 text-sm sm:text-base rounded-full transition duration-300"
          onClick={() => window.history.back()}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Golive;