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

  // Fetch player data from clubTeams collection
  useEffect(() => {
    if (!auth.currentUser) {
      console.log("No authenticated user found.");
      return;
    }

    const q = query(collection(db, 'clubTeams'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let playerFound = false;
      let playerData = null;
      let teamWins = 0;
      let teamLosses = 0;

      snapshot.docs.forEach((doc) => {
        const teamData = doc.data();
        const players = teamData.players || [];
        
        // Find player with current user ID and user="yes"
        const player = players.find(
          (p) => p.userId === auth.currentUser.uid && p.user?.toLowerCase() === "yes"
        );
        
        if (player) {
          playerData = {
            ...player,
            teamId: doc.id, // Store team ID for reference
            teamData: { // Include relevant team data
              wins: teamData.wins,
              losses: teamData.losses,
              matches: teamData.matches
            }
          };
          playerFound = true;
          
          // Calculate team wins and losses
          teamWins = teamData.wins !== undefined ? teamData.wins : 
                    (teamData.matches || 0) - (teamData.losses || 0);
          teamLosses = teamData.losses || 0;
        }
      });

      const data = {
        batting: {},
        bowling: {},
        fielding: {},
      };

      if (playerFound && playerData) {
        const careerStats = playerData.careerStats || {
          batting: {},
          bowling: {},
          fielding: {},
        };

        // Batting stats calculations
        const battingStats = careerStats.batting || {};
        const battingRuns = battingStats.runs || 0;
        const battingInnings = battingStats.innings || 0;
        const battingNotOuts = battingStats.notOuts || 0;
        const battingAverage = battingInnings - battingNotOuts > 0
          ? (battingRuns / (battingInnings - battingNotOuts)).toFixed(2)
          : 0;
        const battingBalls = battingStats.balls || 0;
        const battingStrikeRate = battingBalls > 0
          ? ((battingRuns / battingBalls) * 100).toFixed(2)
          : 0;

        // Bowling stats calculations
        const bowlingStats = careerStats.bowling || {};
        const overs = bowlingStats.overs || 0;
        const bowlingBalls = Math.floor(overs) * 6 + Math.round((overs % 1) * 10);
        const runsConceded = bowlingStats.runsConceded || 0;
        const wickets = bowlingStats.wickets || 0;
        const bowlingAverage = wickets > 0 ? (runsConceded / wickets).toFixed(2) : 0;
        const bowlingEconomy = overs > 0 ? (runsConceded / overs).toFixed(2) : 0;

        // Fielding stats
        const fieldingStats = careerStats.fielding || {};

        // Set batting data
        data.batting = {
          runs: [{ value: battingRuns }],
          "high-score": [{ value: battingStats.highest || 0 }],
          win: [{ value: teamWins }],
          lose: [{ value: teamLosses }],
          matches: [{ value: battingStats.matches || 0 }],
          innings: [{ value: battingInnings }],
          "strike-rate": [{ value: battingStrikeRate }],
          "30s": [{ value: battingStats.thirties || 0 }],
          "50s": [{ value: battingStats.fifties || 0 }],
          "100s": [{ value: battingStats.centuries || 0 }],
          "4s": [{ value: battingStats.fours || 0 }],
          "6s": [{ value: battingStats.sixes || 0 }],
          average: [{ value: battingAverage }],
        };

        // Set bowling data
        data.bowling = {
          "best-bowl": [{ value: bowlingStats.bestBowling || "0/0" }],
          match: [{ value: battingStats.matches || 0 }],
          innings: [{ value: bowlingStats.innings || 0 }],
          overs: [{ value: overs }],
          balls: [{ value: bowlingBalls }],
          maiden: [{ value: bowlingStats.maidens || 0 }],
          runs: [{ value: runsConceded }],
          wickets: [{ value: wickets }],
          "3-wickets": [{ value: bowlingStats.threeWickets || 0 }],
          "5-wickets": [{ value: bowlingStats.fiveWickets || 0 }],
          economy: [{ value: bowlingEconomy }],
          average: [{ value: bowlingAverage }],
          wide: [{ value: bowlingStats.wides || 0 }],
          "no-balls": [{ value: bowlingStats.noBalls || 0 }],
          dots: [{ value: bowlingStats.dotBalls || 0 }],
          "4s": [{ value: bowlingStats.foursConceded || 0 }],
          "6s": [{ value: bowlingStats.sixesConceded || 0 }],
        };

        // Set fielding data
        data.fielding = {
          matches: [{ value: battingStats.matches || 0 }],
          catch: [{ value: fieldingStats.catches || 0 }],
          stumping: [{ value: fieldingStats.stumpings || 0 }],
          "run-out": [{ value: fieldingStats.runOuts || 0 }],
          "catch-and-bowl": [{ value: fieldingStats.catchAndBowl || 0 }],
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
      console.error("Error fetching clubTeams data:", error);
      // Set empty data on error
      setInsightsData({
        batting: Object.fromEntries(subOptions.batting.map(opt => [opt.id, [{ value: 0 }]])),
        bowling: Object.fromEntries(subOptions.bowling.map(opt => [opt.id, [{ value: 0 }]])),
        fielding: Object.fromEntries(subOptions.fielding.map(opt => [opt.id, [{ value: 0 }]])),
      });
      setPrevStats(null);
    });

    return () => unsubscribe();
  }, []);

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

  // [Rest of the component rendering code remains exactly the same...]
  return (
    <div
      className="min-h-full bg-fixed text-white p-5"
      style={{
        backgroundImage: 'linear-gradient(140deg,#080006 15%,#FF0077)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top Navigation Bar */}
      <div className="flex flex-col mt-0">
        <div className="flex items-start">
          <img
            src={logo}
            alt="Cricklytics Logo"
            className="h-7 w-7 md:h-10 object-cover block select-none"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/photo3.jpg";
            }}
          />
          <span className="p-2 text-2xl font-bold text-white whitespace-nowrap shadow-[1px_1px_10px_rgba(255,255,255,0.5)]">
            Cricklytics
          </span>
        </div>
      </div>
      <div className="md:absolute flex items-center gap-4">
        <img
          src={backButton}
          alt="Back"
          className="h-8 w-8 cursor-pointer -scale-x-100"
          onClick={() => window.history.back()}
        />
      </div>

      {/* User Profile */}
      <div className="max-w-5xl mx-auto mt-6">
        <div className="flex items-center gap-3 mb-6">
          <img
            src={userProfile?.profileImageUrl || "/images/user-placeholder.png"}
            alt="User Pic"
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full object-cover aspect-square"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/user-placeholder.png";
            }}
          />
          <div className="text-2xl sm:text-3xl md:text-4xl font-['Alegreya'] text-gray-300">
            {userProfile?.firstName || "User"}
          </div>
        </div>

        {/* Horizontal Navigation Bar */}
        <div className="flex overflow-x-auto justify-center whitespace-nowrap gap-4 border-b border-white/20 mb-10 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-lg font-['Alegreya'] transition-all duration-300 ${
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
        <div className="p-8 rounded-xl border border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.9)] hover:-translate-y-2 transition duration-300">
          {activeTab !== "overall" && subOptions[activeTab].length > 0 && (
            <div>
              <h2 className="text-4xl font-bold text-center mb-6 font-['Alegreya']">
                {tabs.find((tab) => tab.id === activeTab).label}
              </h2>
              <div className="flex overflow-x-auto space-x-4 p-4 scrollbar-thin scrollbar-thumb-cyan-300 scrollbar-track-transparent">
                {subOptions[activeTab].map((option) => (
                  <button
                    key={option.id}
                    className={`flex-shrink-0 px-6 py-3 rounded-lg text-base font-['Alegreya'] transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.8)] ${
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
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4 font-['sm']">
              {subOptions[activeTab].find((opt) => opt.id === activeSubOption)?.label || "Overall Stats"}
            </h3>
            {activeTab === "overall" ? (
              calculateOverallStats().content
            ) : (
              <div>
                {insightsData[activeTab]?.[activeSubOption]?.length > 0 ? (
                  insightsData[activeTab][activeSubOption].map((entry, index) => (
                    <div key={index} className="flex justify-between items-center mb-2 p-2 border-b border-gray-600">
                      <p>{entry.value}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-300">No data available.</p>
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