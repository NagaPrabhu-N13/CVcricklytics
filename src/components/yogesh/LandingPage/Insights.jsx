import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from '../../../assets/pawan/PlayerProfile/picture-312.png';
import backButton from '../../../assets/kumar/right-chevron.png';
import { db, auth } from "../../../firebase";
import { collection, query, where, onSnapshot, doc, onSnapshot as docSnapshot } from "firebase/firestore";

const Insights = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("batting");
  const [activeSubOption, setActiveSubOption] = useState("runs");
  const [insightsData, setInsightsData] = useState({});
  const [prevStats, setPrevStats] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const tabs = [
    { id: "batting", label: "Batting" },
    { id: "bowling", label: "Bowling" },
    { id: "fielding", label: "Fielding" },
    { id: "overall", label: "Overall Stats" },
  ];

  const subOptions = {
    batting: [
      { id: "runs", label: "Runs" },
      { id: "high-score", label: "High Score" },
      { id: "win", label: "Win" },
      { id: "lose", label: "Lose" },
      { id: "matches", label: "Matches" },
      { id: "innings", label: "Innings" },
      { id: "strike-rate", label: "Strike Rate" },
      { id: "30s", label: "30's" },
      { id: "50s", label: "50's" },
      { id: "100s", label: "100's" },
      { id: "4s", label: "4's" },
      { id: "6s", label: "6's" },
      { id: "average", label: "Average" },
    ],
    bowling: [
      { id: "best-bowl", label: "Best Bowl" },
      { id: "match", label: "Matches" },
      { id: "innings", label: "Innings" },
      { id: "overs", label: "Overs" },
      { id: "balls", label: "Balls" },
      { id: "maiden", label: "Maiden" },
      { id: "runs", label: "Runs" },
      { id: "wickets", label: "Wickets" },
      { id: "3-wickets", label: "3 Wickets" },
      { id: "5-wickets", label: "5 Wickets" },
      { id: "economy", label: "Economy" },
      { id: "average", label: "Average" },
      { id: "wide", label: "Wides" },
      { id: "no-balls", label: "No Balls" },
      { id: "dots", label: "Dot Balls" },
      { id: "4s", label: "4's" },
      { id: "6s", label: "6's" },
    ],
    fielding: [
      { id: "matches", label: "Matches" },
      { id: "catch", label: "Catch" },
      { id: "stumping", label: "Stumping" },
      { id: "run-out", label: "Run Out" },
      { id: "catch-and-bowl", label: "Catch and Bowl" },
    ],
    overall: [],
  };

  // Fetch user profile from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = docSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setUserProfile({ uid: auth.currentUser.uid, ...doc.data() });
      } else {
        setUserProfile(null);
      }
    }, (error) => {
      console.error("Error fetching user profile:", error);
    });

    return () => unsubscribe();
  }, []);

  // Fetch player data from PlayerDetails collection by matching name with user's firstName
  useEffect(() => {
    if (!userProfile?.firstName) return;

    const playerQuery = query(
      collection(db, 'PlayerDetails'),
      where('name', '==', userProfile.firstName)
    );

    const unsubscribe = onSnapshot(playerQuery, (snapshot) => {
      let playerData = null;

      if (!snapshot.empty) {
        // Assuming the first matching document is the correct one
        const playerDoc = snapshot.docs[0];
        playerData = playerDoc.data();
      }

      const data = {
        batting: {},
        bowling: {},
        fielding: {},
      };

      if (playerData) {
        const careerStats = playerData.careerStats || {
          batting: {},
          bowling: {},
          fielding: {},
        };

        // Batting stats from careerStats.batting
        const battingStats = careerStats.batting || {};
        const battingRuns = battingStats.runs || 0;
        const battingInnings = battingStats.innings || 0;
        const battingNotOuts = battingStats.notOuts || 0;
        const battingAverage = battingStats.average || (battingInnings - battingNotOuts > 0 ? (battingRuns / (battingInnings - battingNotOuts)).toFixed(2) : 0);
        const battingStrikeRate = battingStats.strikeRate || 0;

        // Bowling stats from careerStats.bowling
        const bowlingStats = careerStats.bowling || {};
        const wickets = bowlingStats.wickets || 0;
        const bowlingAverage = bowlingStats.average || 0;
        const bowlingEconomy = bowlingStats.economy || 0;
        const bowlingStrikeRate = bowlingStats.strikeRate || 0;

        // Assuming overs, balls, runsConceded, etc., are not directly available; set to 0 or derive if possible
        const overs = 0; // Not in structure
        const bowlingBalls = 0; // Not in structure
        const runsConceded = 0; // Not in structure

        // Fielding stats from careerStats.fielding
        const fieldingStats = careerStats.fielding || {};

        // Set batting data
        data.batting = {
          runs: [{ value: battingRuns }],
          "high-score": [{ value: battingStats.highest || 0 }],
          win: [{ value: 0 }], // No team data
          lose: [{ value: 0 }], // No team data
          matches: [{ value: battingStats.matches || playerData.matches || 0 }],
          innings: [{ value: battingInnings }],
          "strike-rate": [{ value: battingStrikeRate }],
          "30s": [{ value: 0 }], // Not available
          "50s": [{ value: battingStats.fifties || 0 }],
          "100s": [{ value: battingStats.centuries || 0 }],
          "4s": [{ value: battingStats.fours || 0 }],
          "6s": [{ value: battingStats.sixes || 0 }],
          average: [{ value: battingAverage }],
        };

        // Set bowling data
        data.bowling = {
          "best-bowl": [{ value: bowlingStats.best || playerData.bestBowling || "0/0" }],
          match: [{ value: battingStats.matches || playerData.matches || 0 }],
          innings: [{ value: bowlingStats.innings || 0 }],
          overs: [{ value: overs }],
          balls: [{ value: bowlingBalls }],
          maiden: [{ value: 0 }], // Not available
          runs: [{ value: runsConceded }],
          wickets: [{ value: wickets }],
          "3-wickets": [{ value: 0 }], // Not available
          "5-wickets": [{ value: 0 }], // Not available
          economy: [{ value: bowlingEconomy }],
          average: [{ value: bowlingAverage }],
          wide: [{ value: 0 }], // Not available
          "no-balls": [{ value: 0 }], // Not available
          dots: [{ value: 0 }], // Not available
          "4s": [{ value: 0 }], // Not available
          "6s": [{ value: 0 }], // Not available
        };

        // Set fielding data
        data.fielding = {
          matches: [{ value: battingStats.matches || playerData.matches || 0 }],
          catch: [{ value: fieldingStats.catches || 0 }],
          stumping: [{ value: fieldingStats.stumpings || 0 }],
          "run-out": [{ value: fieldingStats.runOuts || 0 }],
          "catch-and-bowl": [{ value: 0 }], // Not available
        };

        setPrevStats(careerStats);
      } else {
        // Set default values if no player found
        Object.keys(subOptions).forEach(tab => {
          subOptions[tab].forEach(option => {
            data[tab][option.id] = [{ value: 0 }];
          });
        });
        setPrevStats(null);
      }

      setInsightsData(data);
    }, (error) => {
      console.error("Error fetching PlayerDetails data:", error);
      // Set empty data on error
      setInsightsData({
        batting: Object.fromEntries(subOptions.batting.map(opt => [opt.id, [{ value: 0 }]])),
        bowling: Object.fromEntries(subOptions.bowling.map(opt => [opt.id, [{ value: 0 }]])),
        fielding: Object.fromEntries(subOptions.fielding.map(opt => [opt.id, [{ value: 0 }]])),
      });
      setPrevStats(null);
    });

    return () => unsubscribe();
  }, [userProfile]);

  // Calculate overall stats
  const calculateOverallStats = () => {
    const battingMatches = insightsData.batting?.matches?.[0]?.value || 0;
    const runs = insightsData.batting?.runs?.[0]?.value || 0;
    const wickets = insightsData.bowling?.wickets?.[0]?.value || 0;
    const catches = insightsData.fielding?.catch?.[0]?.value || 0;

    return {
      title: "Overall Stats",
      content: (
        <div className="space-y-4">
          <p><strong>Matches Played:</strong> {battingMatches}</p>
          <p><strong>Runs Scored:</strong> {runs}</p>
          <p><strong>Wickets Taken:</strong> {wickets}</p>
          <p><strong>Catches:</strong> {catches}</p>
        </div>
      ),
    };
  };

  return (
    <div
      className="min-h-screen bg-fixed text-white p-4 md:p-5"
      style={{
        backgroundImage: 'linear-gradient(140deg,#080006 15%,#FF0077)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top Navigation Bar */}
      <div className="md:absolute flex items-center gap-4">
        <img
          src={backButton}
          alt="Back"
          className="h-8 w-8 cursor-pointer -scale-x-100"
          onClick={() => window.history.back()}
        />
      </div>

      {/* User Profile */}
      <div className="max-w-5xl mx-auto mt-4 md:mt-6">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <img
            src={userProfile?.profileImageUrl || "/images/user-placeholder.png"}
            alt="User Pic"
            className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full object-cover aspect-square"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/user-placeholder.png";
            }}
          />
          <div className="text-xl sm:text-2xl md:text-3xl font-['Alegreya'] text-gray-300">
            {userProfile?.firstName || "User"}
          </div>
        </div>

        {/* Horizontal Navigation Bar */}
        <div className="flex overflow-x-auto scrollbar-hide whitespace-nowrap gap-2 md:gap-4 border-b border-white/20 mb-6 md:mb-10 px-2 md:px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-3 py-1 md:px-4 md:py-2 text-sm md:text-lg font-['Alegreya'] transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-cyan-300 border-b-2 border-cyan-300"
                  : "text-gray-300 hover:text-white"
              }`}
              onClick={() => {
                setActiveTab(tab.id);
                setActiveSubOption(tab.id === "overall" ? "default" : subOptions[tab.id][0].id);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-6 lg:p-8 rounded-xl border border-white/20 shadow-lg hover:-translate-y-1 transition duration-300">
          {activeTab !== "overall" && subOptions[activeTab].length > 0 && (
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-4 md:mb-6 font-['Alegreya']">
                {tabs.find((tab) => tab.id === activeTab).label}
              </h2>
              <div className="flex overflow-x-auto scrollbar-hide space-x-2 md:space-x-4 p-2 md:p-4">
                {subOptions[activeTab].map((option) => (
                  <button
                    key={option.id}
                    className={`flex-shrink-0 px-4 py-2 md:px-6 md:py-3 rounded-lg text-xs md:text-base font-['Alegreya'] transition-all duration-300 shadow-md ${
                      activeSubOption === option.id
                        ? "text-white bg-blue-500"
                        : "text-white hover:bg-blue-600 hover:text-cyan-300"
                    }`}
                    onClick={() => setActiveSubOption(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 md:mt-6">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">
              {subOptions[activeTab].find((opt) => opt.id === activeSubOption)?.label || "Overall Stats"}
            </h3>
            {activeTab === "overall" ? (
              calculateOverallStats().content
            ) : (
              <div>
                {insightsData[activeTab]?.[activeSubOption]?.length > 0 ? (
                  insightsData[activeTab][activeSubOption].map((entry, index) => (
                    <div key={index} className="flex justify-between items-center mb-2 p-2 border-b border-gray-600">
                      <p className="text-sm md:text-base">{entry.value}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-300 text-center py-4">No data available.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
