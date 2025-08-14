import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from '../assets/pawan/PlayerProfile/picture-312.png';
import backButton from '../assets/kumar/right-chevron.png';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const Match = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("my-matches");
  const [activeSubOption, setActiveSubOption] = useState("info");
  const [matches, setMatches] = useState([]);

const tabs = [
  { id: "my-matches", label: "My Matches (Live + Past)" },
  { id: "following", label: "Following (Live + Past)" },
  { id: "all", label: "All" },
  { id: "live", label: "Live" },             // ✅ Added: Live matches tab
  { id: "upcoming", label: "Upcoming" },     // 🟢 Capitalized
  { id: "past", label: "Past" }              // 🟢 Capitalized
];
const pastMatches = [
  {
    id: "1",
    tournament: "Budapest Kupa",
    location: "Gb Oval, Szodliget, Budapest",
    date: "17-Jul-25",
    status: "RESULT",
    match: "LEAGUE MATCHES",
    team1: { name: "Budapest Zalmi", score: "172/10", overs: "24.3 Ov" },
    team2: { name: "Nacionaline kriketo taryba", score: "144/9", overs: "25.0 Ov" },
    result: "Budapest Zalmi won by 28 runs"
  },
  {
    id: "2",
    tournament: "Budapest Kupa",
    location: "Gb Oval, Szodliget, Budapest",
    date: "16-Jul-25",
    status: "RESULT",
    match: "LEAGUE MATCHES",
    team1: { name: "Budapest Zalmi", score: "211/10", overs: "24.0 Ov" },
    team2: { name: "Nacionaline kriketo taryba", score: "138/5", overs: "23.0 Ov" },
    result: "Budapest Zalmi won by 73 runs"
  },
  {
    id: "3",
    tournament: "Budapest Kupa",
    location: "Gb Oval, Szodliget, Budapest",
    date: "15-Jul-25",
    status: "RESULT",
    match: "LEAGUE MATCHES",
    team1: { name: "Budapest Zalmi", score: "134/10", overs: "17.5 Ov" },
    team2: { name: "Nacionaline kriketo taryba", score: "79/10", overs: "15.0 Ov" },
    result: "Budapest Zalmi won by 55 runs"
  },
];


const liveMatches = [
  {
    id: "1",
    tournament: "Budapest Kupa",
    location: "GB-Ovid, Szudíjgyi, Budapest",
    date: "17-Jul-53 | 23.Ov",
    status: "LIVE",
    battingTeam: "Team A",
    bowlingTeam: "Team B",
    score: "47/0",
    overs: "4.3",
    batting: [
      {
        name: "Khaibar Deldar",
        runs: "32",
        balls: "20",
        fours: "1",
        sixes: "3",
        sr: "160",
      }
    ],
    bowling: [
      {
        name: "DHARSAN S",
        overs: "2.5",
        maidens: "0",
        runs: "29",
        wickets: "0",
        eco: "10"
      }
    ],
    recentBalls: ["0", "0", "0", "4", "2", "1", "0", "6", "0"],
    commentary: [
      { over: "4.3", text: "Pandey S to Deldar, no run" },
      { over: "4.2", text: "Pandey S to Deldar, SIX, pulled to deep midwicket" },
    ]
  },
  {
    id: "2",
    tournament: "Nacionaline kirketo taryba",
    location: "Budapest Zainé",
    date: "Thu. 17 Jul. 1:20 PM",
    status: "LIVE",
    battingTeam: "Team C",
    bowlingTeam: "Team D",
    score: "42/1",
    overs: "5.0",
    batting: [
      {
        name: "Rona Moaz",
        runs: "42",
        balls: "30",
        fours: "2",
        sixes: "4",
        sr: "163"
      }
    ],
    bowling: [
      {
        name: "Virat Kholi",
        overs: "2.0",
        maidens: "0",
        runs: "27",
        wickets: "0",
        eco: "10.5"
      }
    ],
     recentBalls: ["0", "0", "0", "4", "2", "1", "0", "6", "0"],
    commentary: [
      { over: "2.3", text: "Pandey S to Deldar, no run" },
      { over: "3.2", text: "Pandey S to Deldar, SIX, pulled to deep midwicket" },
    ]
  }
];


const upcomingMatches = [
  {
    id: "1",
    tournament: "Budapest Kupa",
    location: "GB-Ovid, Szudíjgyi, Budapest",
    date: "17-Jul.53 | 23.Ov",
    status: "UPCOMING"
  },
  {
    id: "2",
    tournament: "Nacionaline kirketo taryba",
    location: "Budapest Zainé",
    date: "Thu. 17 Jul. 120 PM",
    status: "UPCOMING"
  }
];

  const subOptions = [
    { id: "info", label: "Info" },
    { id: "summary", label: "Summary" },
    { id: "scorecard", label: "Scorecard" },
    { id: "squad", label: "Squad" },
    { id: "analysis", label: "Analysis" },
    { id: "mvp", label: "MVP" },

  ];

  // Fetch match data from scoringpage collection
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'scoringpage'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(match => match.userId === auth.currentUser.uid);
      setMatches(matchesData);
    }, (error) => {
      console.error("Error fetching matches:", error);
    });

    return () => unsubscribe();
  }, []);

  // Set active tab from location state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      setActiveSubOption("info");
    }
  }, [location.state]);

  // Filter matches based on active tab and sub-option
  const filteredMatches = matches.filter(match => {
    if (activeTab === "my-matches") {
      return true; // All matches for my-matches tab
    } else if (activeTab === "following") {
      return match.tabCategory === "following";
    } else {
      return true; // All matches for all tab
    }
  });

  // Format match data based on active sub-option
  const getMatchData = (match, subOption) => {
    const {
      teamA = { name: "N/A", totalScore: 0, wickets: 0, overs: 0, result: null },
      teamB = { name: "N/A", totalScore: 0, wickets: 0, overs: 0, result: null },
      createdAt,
      matchResult,
      firstInnings = { playerStats: [], bowlerStats: [] },
      secondInnings = { playerStats: [], bowlerStats: [] },
      Format = "N/A",
      venue = "Not Available",
      umpire = "Not Available",
      matchId,
    } = match;

    switch (subOption) {
      case "info":
        return {
          matchId: matchId || "N/A",
          teams: `${teamA.name} vs ${teamB.name}`,
          date: createdAt ? createdAt.toDate().toISOString().split('T')[0] : "Unknown Date",
          status: matchResult ? "Past" : "Live",
          score: `${teamA.totalScore || 0}/${teamA.wickets || 0} (${teamA.overs || 0}) vs ${teamB.totalScore || 0}/${teamB.wickets || 0} (${teamB.overs || 0})`,
          venue,
          Format,
          umpire,
        };
      case "summary":
        let summary = "Match in progress";
        if (matchResult === "Tie") {
          summary = "Match Tied";
        } else if (teamA.result === "Win") {
          const runDiff = (teamA.totalScore || 0) - (teamB.totalScore || 0);
          if (runDiff > 0) {
            summary = `${teamA.name} beat ${teamB.name} by ${runDiff} runs`;
          }
        } else if (teamB.result === "Win") {
          const wicketsRemaining = 10 - (teamB.wickets || 0);
          if ((teamB.totalScore || 0) >= (teamA.totalScore || 0)) {
            summary = `${teamB.name} beat ${teamA.name} by ${wicketsRemaining} wickets`;
          }
        }
        return {
          matchId: matchId || "N/A",
          score: summary,
        };
      case "scorecard":
        const battingDetails = [
          `${teamA.name}:`,
          ...(firstInnings && firstInnings.playerStats?.length > 0
            ? firstInnings.playerStats
                .filter(p => (p.runs || 0) > 0 || (p.balls || 0) > 0)
                .map(p => `${p.name || "Unknown"}: ${p.runs || 0} runs (${p.balls || 0} balls)`)
            : ["No batting data available"]),
          `\n${teamB.name}:`,
          ...(secondInnings && secondInnings.playerStats?.length > 0
            ? secondInnings.playerStats
                .filter(p => (p.runs || 0) > 0 || (p.balls || 0) > 0)
                .map(p => `${p.name || "Unknown"}: ${p.runs || 0} runs (${p.balls || 0} balls)`)
            : ["No batting data available"]),
        ].join('\n');
        const bowlingDetails = [
          `${teamB.name} Bowling:`,
          ...(secondInnings && secondInnings.bowlerStats?.length > 0
            ? secondInnings.bowlerStats
                .filter(b => b.oversBowled && b.oversBowled !== "0.0")
                .map(b => `${b.name || "Unknown"}: ${b.wickets || 0}/${b.runsConceded || 0} (${b.oversBowled || "0.0"} overs)`)
            : ["No bowling data available"]),
          `\n${teamA.name} Bowling:`,
          ...(firstInnings && firstInnings.bowlerStats?.length > 0
            ? firstInnings.bowlerStats
                .filter(b => b.oversBowled && b.oversBowled !== "0.0")
                .map(b => `${b.name || "Unknown"}: ${b.wickets || 0}/${b.runsConceded || 0} (${b.oversBowled || "0.0"} overs)`)
            : ["No bowling data available"]),
        ].join('\n');
        return {
          matchId: matchId || "N/A",
          batting: battingDetails,
          bowling: bowlingDetails,
        };
      case "squad":
        const squadIndia = firstInnings && firstInnings.playerStats?.length > 0
          ? firstInnings.playerStats.map(p => p.name || "Unknown").join(', ')
          : "No squad data available";
        const squadAustralia = secondInnings && secondInnings.playerStats?.length > 0
          ? secondInnings.playerStats.map(p => p.name || "Unknown").join(', ')
          : "No squad data available";
        return {
          matchId: matchId || "N/A",
          squadIndia,
          squadAustralia,
        };
      case "analysis":
        const analysis = `Match between ${teamA.name} and ${teamB.name} was played on ${createdAt ? createdAt.toDate().toLocaleDateString() : 'Unknown Date'}. ${teamA.name} scored ${teamA.totalScore || 0}/${teamA.wickets || 0} in ${teamA.overs || 0} overs, while ${teamB.name} scored ${teamB.totalScore || 0}/${teamB.wickets || 0} in ${teamB.overs || 0} overs.`;
        return {
          matchId: matchId || "N/A",
          analysis,
        };
      case "mvp":
        return {
          matchId: matchId || "N/A",
          mvp: "Not specified",
        };
      default:
        return { matchId: matchId || "N/A" };
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status.toUpperCase()) {
      case "LIVE":
        return "bg-gradient-to-r from-red-500 to-yellow-500";
      case "UPCOMING":
        return "bg-gradient-to-r from-orange-500 to-yellow-500";
      case "PAST":
        return "bg-gradient-to-r from-blue-500 to-cyan-500";
      default:
        return "bg-gray-500";
    }
  };

 const getBackgroundStyle = (tab) => {
  switch(tab) {
    case "live":
    case "upcoming":
    case "past":
      return { 
        backgroundImage: 'linear-gradient(140deg, #4C1D95 15%, #7E22CE 50%, #A855F7 85%)' 
      };
    default:
      return { 
        backgroundImage: 'linear-gradient(140deg, #080006 15%, #FF0077)' 
      };
  }
};


  return (
    <div 
  className="min-h-full bg-fixed text-white p-5"
  style={{
    ...getBackgroundStyle(activeTab),
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
          onClick={() => window.history.back()}
        />
      </div>

      {/* Horizontal Navigation Bar */}
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-center gap-4 border-b border-white/20 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-lg font-['Alegreya'] transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-blue-500 border-b-2 border-cyan-300"
                  : "text-white hover:text-white"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-8 rounded-xl border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] bg-white/5 backdrop-blur">
          {activeTab === "my-matches" && (
            <div>
              <h2 className="text-2xl font-bold text-center mb-6 font-['Alegreya']">My Matches</h2>
              <div className="flex overflow-x-auto md:justify-center item-center space-x-4 p-4 scrollbar-thin scrollbar-thumb-cyan-300 scrollbar-track-gray-800">
                {subOptions.map((option) => (
                  <button
                    key={option.id}
                    className={`flex-shrink-0 px-6 py-3 rounded-lg text-base font-['Alegreya'] transition-all duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.8)] ${
                      activeSubOption === option.id
                        ? "bg-gradient-to-r from-[#48C6EF] to-[#6F86D6] text-white scale-105"
                        : "bg-transparent text-white hover:bg-white/10 hover:scale-105"
                    }`}
                    onClick={() => setActiveSubOption(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="">
                <h3 className="text-xl font-bold mb-4 font-['Alegreya']">
                  {activeSubOption.charAt(0).toUpperCase() + activeSubOption.slice(1)}
                </h3>
                {filteredMatches.length === 0 ? (
                  <p className="text-center text-gray-300">No data available.</p>
                ) : (
                  filteredMatches.map((match) => {
                    const matchData = getMatchData(match, activeSubOption);
                    return (
                      <div key={match.id} className="mb-4 p-4 bg-[rgba(0,0,0,0.3)] rounded-lg">
                        <p><strong>Match ID:</strong> {matchData.matchId}</p>
                        {activeSubOption === "info" && (
                          <div className="space-y-2">
                            <p><strong>Teams:</strong> {matchData.teams}</p>
                            <p><strong>Date:</strong> {matchData.date}</p>
                            <p><strong>Status:</strong> {matchData.status}</p>
                            <p><strong>Score:</strong> {matchData.score}</p>
                            <p><strong>Venue:</strong> {matchData.venue}</p>
                            <p><strong>Format:</strong> {matchData.Format}</p>
                            <p><strong>Umpires:</strong> {matchData.umpire}</p>
                          </div>
                        )}
                        {activeSubOption === "summary" && (
                          <div className="space-y-2">
                            <p><strong>Summary:</strong> {matchData.score}</p>
                          </div>
                        )}
                        {activeSubOption === "scorecard" && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-bold">Batting</h4>
                              <p className="whitespace-pre-line">{matchData.batting}</p>
                            </div>
                            <div>
                              <h4 className="font-bold">Bowling</h4>
                              <p className="whitespace-pre-line">{matchData.bowling}</p>
                            </div>
                          </div>
                        )}
                        {activeSubOption === "squad" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-bold">India</h4>
                              <p>{matchData.squadIndia}</p>
                            </div>
                            <div>
                              <h4 className="font-bold">Australia</h4>
                              <p>{matchData.squadAustralia}</p>
                            </div>
                          </div>
                        )}
                        {activeSubOption === "analysis" && (
                          <div className="space-y-2">
                            <p>{matchData.analysis}</p>
                          </div>
                        )}
                        {activeSubOption === "mvp" && (
                          <div className="space-y-2">
                            <p><strong>MVP:</strong> {matchData.mvp}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          {activeTab === "following" && (
            <div>
              <h2 className="text-2xl font-bold text-center mb-6 font-['Alegreya']">Following (Live + Past)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMatches.length === 0 ? (
                  <p className="text-center text-gray-300 col-span-3">No matches to show here.</p>
                ) : (
                  filteredMatches.map((match) => {
                    const matchData = getMatchData(match, "info");
                    return (
                      <div
                        key={match.id}
                        className="bg-[rgba(0,0,0,0.3)] p-6 rounded-md shadow-md hover:bg-[rgba(0,0,0,0.5)] transition-all duration-300 cursor-pointer"
                        onClick={() => navigate(`/match/${match.id}`)}
                      >
                        <p><strong>Match ID:</strong> {matchData.matchId}</p>
                        <h3 className="text-lg font-bold font-semibold">{matchData.teams}</h3>
                        <p className="text-gray-300">{matchData.date}</p>
                        <p className="text-blue-600">{matchData.status}</p>
                        <p className="mt-2">{matchData.score}</p>
                        <p className="text-gray-400">{matchData.venue}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "all" && (
            <div>
              <h2 className="text-2xl font-bold text-center mb-6 font-['Alegreya']">All Matches</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMatches.length === 0 ? (
                  <p className="text-center text-gray-300 col-span-3">No matches to show here.</p>
                ) : (
                  filteredMatches.map((match) => {
                    const matchData = getMatchData(match, "info");
                    return (
                      <div
                        key={match.id}
                        className="bg-[rgba(0,0,0,0.3)] p-6 rounded-lg shadow-md hover:bg-[rgba(0,0,0,0.5)] transition-all duration-300 cursor-pointer"
                        onClick={() => navigate(`/match/${match.id}`)}
                      >
                        <p><strong>Match ID:</strong> {matchData.matchId}</p>
                        <h3 className="text-lg font-bold font-['Alegreya']">{matchData.teams}</h3>
                        <p className="text-gray-300">{matchData.date}</p>
                        <p className="text-cyan-300">{matchData.status}</p>
                        <p className="mt-2">{matchData.score}</p>
                        <p className="text-gray-400">{matchData.venue}</p>
                        <p><strong>Format:</strong> {matchData.Format}</p>
                        <p><strong>Umpires:</strong> {matchData.umpire}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

{activeTab === "live" && (
  <div>
    <h2 className="text-2xl font-bold text-center mb-6 font-['Alegreya']">Live</h2>

    <div className="space-y-6">
      {liveMatches.length === 0 ? (
        <p className="text-center text-gray-300">No live match is currently available.</p>
      ) : (
        liveMatches.map((match) => {
          return (
            <div
              key={match.id}
              className="bg-[rgba(0,0,0,0.3)] p-6 rounded-lg shadow-md hover:bg-[rgba(0,0,0,0.5)] transition-all duration-300 cursor-pointer"
              onClick={() => navigate("/match-details", { state: match })}
            >
              {/* Summary Header */}
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-semibold text-white">{match.tournament}</h3>
                <span
                  className={`px-4 py-1 rounded-full text-sm ${getStatusBadgeStyle(match.status)}`}
                >
                  {match.status}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-2">{match.location}</p>
              <p className="text-sm text-gray-300 mb-2">{match.date}</p>
              <div className="text-white text-lg font-bold mb-2">
                {match.battingTeam} <span className="text-yellow-400">{match.score}</span> ({match.overs} Ov)
              </div>
              <p className="text-sm text-gray-300 mb-4">Yet to Bat: {match.bowlingTeam}</p>

            </div>
          );
        })
      )}
    </div>
  </div>
)}
      
         
          
         {activeTab === "upcoming" && (
        <div>
          <h2 className="text-2xl font-bold text-center mb-6 font-['Alegreya']">Upcoming Matches</h2>
          
          {/* SHARE button at the top right */}
          <div className="flex justify-end mb-6">
            <button className="text-white hover:text-cyan-300 transition">
              SHARE
            </button>
          </div>

          {/* Match Schedule Banners */}
          <div className="space-y-6">
            {upcomingMatches.map((match) => (
              <div key={match.id} className="bg-[rgba(0,0,0,0.3)] p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">{match.tournament}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadgeStyle(match.status)}`}>
                    {match.status}
                  </span>
                </div>
                <p className="text-gray-300 mb-2">{match.location} | {match.date}</p>
                
                
              </div>
            ))}
          </div>
        </div>
      )}

  {activeTab === "past" && (
  <div className="px-8 py-6">
    <h2 className="text-4xl font-bold text-center mb-10 text-white font-['Alegreya']">Past Matches</h2>

    <div className="space-y-6">
      {pastMatches.map((match) => (
        <div
          key={match.id}
          className="bg-gradient-to-r from-[#4b0082] to-[#6a0dad] rounded-2xl px-8 py-6 shadow-lg"
        >
          {/* Header row */}
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-2xl font-bold text-white">{match.tournament}</h3>
            <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {match.status}
            </span>
          </div>

          {/* Location and date */}
          <p className="text-base text-gray-300 mb-2">{match.location} | {match.date}</p>

          {/* Match type */}
          <p className="text-xs uppercase text-cyan-300 font-semibold mb-3">{match.match}</p>

          {/* Scores */}
          <div className="space-y-1 text-white text-base">
            {/* Team 1 */}
            <div className="flex justify-between items-center">
              <span className="font-medium">{match.team1.name}</span>
              <span className="text-right">
                <span className="font-bold">{match.team1.score}</span>{" "}
                <span className="text-sm text-gray-300">({match.team1.overs})</span>
              </span>
            </div>

            {/* Team 2 */}
            <div className="flex justify-between items-center">
              <span className="font-medium">{match.team2.name}</span>
              <span className="text-right">
                <span className="font-bold">{match.team2.score}</span>{" "}
                <span className="text-sm text-gray-300">({match.team2.overs})</span>
              </span>
            </div>
          </div>

          {/* Result */}
          <p className="text-sm text-white mt-4">{match.result}</p>
        </div>
      ))}
    </div>
  </div>
)}


        </div>
      </div>
    </div>
  );
};

export default Match;
