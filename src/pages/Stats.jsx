import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from '../assets/pawan/PlayerProfile/picture-312.png';
import backButton from '../assets/kumar/right-chevron.png';
import { db, auth } from "../firebase";
import { collection, onSnapshot, doc, onSnapshot as docSnapshot } from "firebase/firestore";

const Stats = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("batting");
  const [activeSubOption, setActiveSubOption] = useState("runs");
  const [insightsData, setInsightsData] = useState({});
  const [prevStats, setPrevStats] = useState(null);

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

  // Fetch player stats from Firestore with centric data logic
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(collection(db, 'PlayerStats'), (snapshot) => {
      const statsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(stat => stat.userId === auth.currentUser.uid); // Filter by current user's ID
      setStats(statsData);
    }, (error) => {
      console.error("Error fetching player stats:", error);
    });

    return () => unsubscribe();
  }, []);

  // Fetch player data from clubTeams collection for Insights
  useEffect(() => {
    if (!auth.currentUser) {
      console.log("No authenticated user found.");
      return;
    }
    console.log("Current User UID:", auth.currentUser.uid);

    const q = query(
      collection(db, 'clubTeams'),
      where('createdBy', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let playerFound = false;
      let playerData = null;
      let teamWins = 0;
      let teamLosses = 0;

      for (const doc of snapshot.docs) {
        const teamData = doc.data();
        console.log("Team Data:", JSON.stringify(teamData, null, 2));
        const players = teamData.players || [];
        console.log("Players Array:", players);
        const player = players.find(
          (player) => player.userId === auth.currentUser.uid && player.user?.toLowerCase() === "yes"
        );
        if (player) {
          playerData = player;
          playerFound = true;
          // Calculate wins: use teamData.wins if available, else matches - losses
          teamWins = teamData.wins !== undefined ? teamData.wins : (teamData.matches || 0) - (teamData.losses || 0);
          teamLosses = teamData.losses || 0;
          console.log("Player Found:", JSON.stringify(playerData, null, 2));
          console.log("Team Wins Calculated:", teamWins);
          console.log("Team Losses:", teamLosses);
          break;
        }
      }

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
        console.log("Career Stats:", JSON.stringify(careerStats, null, 2));

        // Calculate 30's based on run differences
        let thirtiesCount = careerStats.batting.thirties ?? 0;
        if (prevStats) {
          const prevRuns = prevStats.batting?.runs ?? 0;
          const newRuns = careerStats.batting.runs ?? 0;
          const runDiff = newRuns - prevRuns;
          if (runDiff >= 30 && runDiff < 50) {
            thirtiesCount += 1;
          }
        }

        // Calculate 3-wickets and 5-wickets based on wicket differences
        let threeWicketsCount = careerStats.bowling.threeWickets ?? 0;
        let fiveWicketsCount = careerStats.bowling.fiveWickets ?? 0;
        if (prevStats) {
          const prevWickets = prevStats.bowling?.wickets ?? 0;
          const newWickets = careerStats.bowling.wickets ?? 0;
          const wicketDiff = newWickets - prevWickets;
          if (wicketDiff === 3) {
            threeWicketsCount += 1;
          } else if (wicketDiff === 5) {
            fiveWicketsCount += 1;
          }
        }

        // Update previous stats
        setPrevStats(careerStats);

        // Calculate batting average: runs / (innings - notOuts)
        const battingRuns = careerStats.batting.runs ?? 0;
        const battingInnings = careerStats.batting.innings ?? 0;
        const battingNotOuts = careerStats.batting.notOuts ?? 0;
        const battingAverage = battingInnings - battingNotOuts > 0
          ? (battingRuns / (battingInnings - battingNotOuts)).toFixed(2)
          : 0;

        // Calculate batting strike rate: (runs / balls) * 100
        const battingBalls = careerStats.batting.balls ?? 0;
        const battingStrikeRate = battingBalls > 0
          ? ((battingRuns / battingBalls) * 100).toFixed(2)
          : 0;

        // Calculate bowling balls from overs
        const overs = careerStats.bowling.overs ?? 0;
        const bowlingBalls = Math.floor(overs) * 6 + Math.round((overs % 1) * 10);

        // Calculate bowling average: runsConceded / wickets
        const runsConceded = careerStats.bowling.runsConceded ?? 0;
        const wickets = careerStats.bowling.wickets ?? 0;
        const bowlingAverage = wickets > 0
          ? (runsConceded / wickets).toFixed(2)
          : 0;

        // Calculate bowling economy: runsConceded / overs
        const bowlingEconomy = overs > 0
          ? (runsConceded / overs).toFixed(2)
          : 0;

        // Batting stats
        data.batting.runs = [{ value: battingRuns }],
        data.batting["high-score"] = [{ value: careerStats.batting.highest ?? 0 }],
        data.batting.win = [{ value: teamWins }],
        data.batting.lose = [{ value: teamLosses }],
        data.batting.matches = [{ value: careerStats.batting.matches ?? 0 }],
        data.batting.innings = [{ value: battingInnings }],
        data.batting["strike-rate"] = [{ value: battingStrikeRate }],
        data.batting["30s"] = [{ value: thirtiesCount }],
        data.batting["50s"] = [{ value: careerStats.batting.fifties ?? 0 }],
        data.batting["100s"] = [{ value: careerStats.batting.centuries ?? 0 }],
        data.batting["4s"] = [{ value: careerStats.batting.fours ?? 0 }],
        data.batting["6s"] = [{ value: careerStats.batting.sixes ?? 0 }],
        data.batting.average = [{ value: battingAverage }];

        // Bowling stats
        data.bowling["best-bowl"] = [{ value: careerStats.bowling.bestBowling ?? "0/0" }],
        data.bowling.match = [{ value: careerStats.batting.matches ?? 0 }],
        data.bowling.innings = [{ value: careerStats.bowling.innings ?? 0 }],
        data.bowling.overs = [{ value: careerStats.bowling.overs ?? 0 }],
        data.bowling.balls = [{ value: bowlingBalls }],
        data.bowling.maiden = [{ value: careerStats.bowling.maidens ?? 0 }],
        data.bowling.runs = [{ value: careerStats.bowling.runsConceded ?? 0 }],
        data.bowling.wickets = [{ value: careerStats.bowling.wickets ?? 0 }],
        data.bowling["3-wickets"] = [{ value: threeWicketsCount }],
        data.bowling["5-wickets"] = [{ value: fiveWicketsCount }],
        data.bowling.economy = [{ value: bowlingEconomy }],
        data.bowling.average = [{ value: bowlingAverage }],
        data.bowling.wide = [{ value: careerStats.bowling.wides ?? 0 }],
        data.bowling["no-balls"] = [{ value: careerStats.bowling.noBalls ?? 0 }],
        data.bowling.dots = [{ value: careerStats.bowling.dotBalls ?? 0 }],
        data.bowling["4s"] = [{ value: careerStats.bowling.foursConceded ?? 0 }],
        data.bowling["6s"] = [{ value: careerStats.bowling.sixesConceded ?? 0 }];

        // Fielding stats
        data.fielding.matches = [{ value: careerStats.batting.matches ?? 0 }],
        data.fielding.catch = [{ value: careerStats.fielding.catches ?? 0 }],
        data.fielding.stumping = [{ value: careerStats.fielding.stumpings ?? 0 }],
        data.fielding["run-out"] = [{ value: careerStats.fielding.runOuts ?? 0 }],
        data.fielding["catch-and-bowl"] = [{ value: careerStats.fielding.catchAndBowl ?? 0 }];
      } else {
        console.log("No matching player found, using defaults.");
        // Initialize with default values
        data.batting.runs = [{ value: 0 }],
        data.batting["high-score"] = [{ value: 0 }],
        data.batting.win = [{ value: 0 }],
        data.batting.lose = [{ value: 0 }],
        data.batting.matches = [{ value: 0 }],
        data.batting.innings = [{ value: 0 }],
        data.batting["strike-rate"] = [{ value: 0 }],
        data.batting["30s"] = [{ value: 0 }],
        data.batting["50s"] = [{ value: 0 }],
        data.batting["100s"] = [{ value: 0 }],
        data.batting["4s"] = [{ value: 0 }],
        data.batting["6s"] = [{ value: 0 }],
        data.batting.average = [{ value: 0 }];

        data.bowling["best-bowl"] = [{ value: "0/0" }],
        data.bowling.match = [{ value: 0 }],
        data.bowling.innings = [{ value: 0 }],
        data.bowling.overs = [{ value: 0 }],
        data.bowling.balls = [{ value: 0 }],
        data.bowling.maiden = [{ value: 0 }],
        data.bowling.runs = [{ value: 0 }],
        data.bowling.wickets = [{ value: 0 }],
        data.bowling["3-wickets"] = [{ value: 0 }],
        data.bowling["5-wickets"] = [{ value: 0 }],
        data.bowling.economy = [{ value: 0 }],
        data.bowling.average = [{ value: 0 }],
        data.bowling.wide = [{ value: 0 }],
        data.bowling["no-balls"] = [{ value: 0 }],
        data.bowling.dots = [{ value: 0 }],
        data.bowling["4s"] = [{ value: 0 }],
        data.bowling["6s"] = [{ value: 0 }];

        data.fielding.matches = [{ value: 0 }],
        data.fielding.catch = [{ value: 0 }],
        data.fielding.stumping = [{ value: 0 }],
        data.fielding["run-out"] = [{ value: 0 }],
        data.fielding["catch-and-bowl"] = [{ value: 0 }];

        setPrevStats(null);
      }

      setInsightsData(data);
      console.log("Insights Data Set:", data);
    }, (error) => {
      console.error("Error fetching clubTeams data:", error);
      setInsightsData({
        batting: {
          runs: [{ value: 0 }],
          "high-score": [{ value: 0 }],
          win: [{ value: 0 }],
          lose: [{ value: 0 }],
          matches: [{ value: 0 }],
          innings: [{ value: 0 }],
          "strike-rate": [{ value: 0 }],
          "30s": [{ value: 0 }],
          "50s": [{ value: 0 }],
          "100s": [{ value: 0 }],
          "4s": [{ value: 0 }],
          "6s": [{ value: 0 }],
          average: [{ value: 0 }],
        },
        bowling: {
          "best-bowl": [{ value: "0/0" }],
          match: [{ value: 0 }],
          innings: [{ value: 0 }],
          overs: [{ value: 0 }],
          balls: [{ value: 0 }],
          maiden: [{ value: 0 }],
          runs: [{ value: 0 }],
          wickets: [{ value: 0 }],
          "3-wickets": [{ value: 0 }],
          "5-wickets": [{ value: 0 }],
          economy: [{ value: 0 }],
          average: [{ value: 0 }],
          wide: [{ value: 0 }],
          "no-balls": [{ value: 0 }],
          dots: [{ value: 0 }],
          "4s": [{ value: 0 }],
          "6s": [{ value: 0 }],
        },
        fielding: {
          matches: [{ value: 0 }],
          catch: [{ value: 0 }],
          stumping: [{ value: 0 }],
          "run-out": [{ value: 0 }],
          "catch-and-bowl": [{ value: 0 }],
        },
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
        <div className="space-y-4 text-gray-300">
          <p><strong>Matches Played:</strong> {battingMatches}</p>
          <p><strong>Runs Scored:</strong> {runs}</p>
          <p><strong>Wickets Taken:</strong> {wickets}</p>
          <p><strong>Catches:</strong> {catches}</p>
        </div>
      ),
    };
  };

  return (
    <div className="min-h-screen bg-fixed text-white p-4 sm:p-6 md:p-8" style={{
      backgroundImage: 'linear-gradient(140deg,#080006 15%,#FF0077)',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
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
          <span className="p-2 text-2xl md:text-3xl font-bold text-white whitespace-nowrap shadow-[1px_1px_10px_rgba(255,255,255,0.5)]">
            Cricklytics
          </span>
        </div>
      </div>
      <div className="md:absolute flex items-center gap-4 mt-2 md:mt-0">
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

        {/* Insights UI */}
        <div className="flex flex-col items-center">
          <div className="flex overflow-x-auto justify-center whitespace-nowrap gap-2 sm:gap-4 border-b border-white/20 mb-8 sm:mb-10 px-2 sm:px-4 w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-3 py-2 sm:px-4 sm:py-2 text-base sm:text-lg font-['Alegreya'] transition-all duration-300 ${
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

          <div className="p-6 sm:p-8 rounded-xl border border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.9)] hover:-translate-y-2 transition duration-300 w-full max-w-4xl">
            {activeTab !== "overall" && subOptions[activeTab].length > 0 && (
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-6 font-['Alegreya']">
                  {tabs.find((tab) => tab.id === activeTab).label}
                </h2>
                <div className="flex overflow-x-auto space-x-2 sm:space-x-4 p-4 scrollbar-thin scrollbar-thumb-cyan-300 scrollbar-track-transparent">
                  {subOptions[activeTab].map((option) => (
                    <button
                      key={option.id}
                      className={`flex-shrink-0 px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-['Alegreya'] transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.8)] ${
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
            <div className="mt-4 sm:mt-6">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 font-['sm']">
                {subOptions[activeTab].find((opt) => opt.id === activeSubOption)?.label || "Overall Stats"}
              </h3>
              {activeTab === "overall" ? (
                calculateOverallStats().content
              ) : (
                <div>
                  {insightsData[activeTab]?.[activeSubOption]?.length > 0 ? (
                    insightsData[activeTab][activeSubOption].map((entry, index) => (
                      <div key={index} className="flex justify-between items-center mb-2 p-2 border-b border-gray-600 text-gray-300">
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
    </div>
  );
};

export default Stats;