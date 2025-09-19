import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from '../assets/pawan/PlayerProfile/picture-312.png';
import backButton from '../assets/kumar/right-chevron.png';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';

const Match = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("my-matches");
  const [activeSubOption, setActiveSubOption] = useState("info");
  const [matches, setMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const { tournamentName } = location.state || {};
  const { tournamentId } = location.state || {};
  console.log(tournamentId, tournamentName);

  const tabs = [
    { id: "my-matches", label: "My Matches (Live + Past)" },
    { id: "following", label: "Following (Live + Past)" },
    { id: "all", label: "All" },
    { id: "live", label: "Live" },
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" }
  ];

  const subOptions = [
    { id: "info", label: "Info" },
    { id: "summary", label: "Summary" },
    { id: "scorecard", label: "Scorecard" },
    { id: "squad", label: "Squad" },
    { id: "analysis", label: "Analysis" },
    { id: "mvp", label: "MVP" },
  ];

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch all scoringpage documents (no userId filter in query for flexibility)
    const q = query(collection(db, 'scoringpage'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMatches(matchesData);
    }, (error) => {
      console.error("Error fetching matches:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (tournamentId) {
      // If tournamentId is received, auto-set to "following" tab
      setActiveTab("following");
    } else if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    setActiveSubOption("info");
  }, [location.state, tournamentId]);  // Added tournamentId dependency

  useEffect(() => {
    if (activeTab !== 'upcoming' || !tournamentId) return;

    const fetchUpcoming = async () => {
      try {
        const docRef = doc(db, 'roundrobin', tournamentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const schedule = docSnap.data().matchSchedule || [];
          const upcoming = getUpcomingMatches(schedule);
          setUpcomingMatches(upcoming);
        } else {
          setUpcomingMatches([]);
        }
      } catch (error) {
        console.error('Error fetching roundrobin:', error);
      }
    };

    fetchUpcoming();
  }, [activeTab, tournamentId]);

  const getUpcomingMatches = (matchSchedule) => {
    const now = new Date(); // current datetime
    return matchSchedule.filter(match => {
      if (!match.date || !match.time || match.winner) return false;

      // Parse date: '17 Sept 25' -> YYYY-MM-DD
      const dateObj = new Date(Date.parse(match.date.replace(/(\d+) (\w+) (\d+)/, '$2 $1 20$3')));
      // Parse time: '1:00 AM'
      let [time, meridian] = match.time.split(' ');
      let [hours, minutes] = time.split(':');
      hours = meridian.toLowerCase() === 'pm' ? (parseInt(hours, 10) === 12 ? 12 : parseInt(hours, 10) + 12) : (parseInt(hours, 10) === 12 ? 0 : parseInt(hours, 10));
      const matchDateTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), parseInt(hours), parseInt(minutes));

      // If the match is in the future or within 3 hours
      return matchDateTime > now || (matchDateTime - now) / 3600000 <= 3;
    });
  };

  const getFilteredMatches = (tab) => {
    const today = new Date().toISOString().split('T')[0];

    return matches.filter(match => {
      const matchDate = match.createdAt ? match.createdAt.toDate().toISOString().split('T')[0] : null;
      const hasResult = !!match.matchResult;

      if (tab === "my-matches") {
        return match.userId === auth.currentUser.uid;  // Only user's matches
      } else if (tab === "following") {
        if (tournamentId) {
          return match.tournamentId === tournamentId;  // Filter by received tournamentId (assuming field name is 'tournamentId')
        } else {
          return match.tabCategory === "following";  // Fallback to existing logic
        }
      } else if (tab === "all") {
        return true;  // All matches
      } else if (tab === "live") {
        return !hasResult && matchDate === today;
      } else if (tab === "upcoming") {
        return !hasResult && matchDate > today;
      } else if (tab === "past") {
        return hasResult || (matchDate && matchDate < today);
      }
      return false;  // Default: no matches
    });
  };

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

  // New function to transform match data into live layout format
  const transformToLiveFormat = (match) => {
    const matchData = getMatchData(match, "info");
    const scorecard = getMatchData(match, "scorecard");

    return {
      id: match.id,
      tournamentId: match.tournamentId || "unknown", // Include tournamentId,
      tournament: match.tournamentName || "Unknown Tournament",
      location: matchData.venue,
      date: matchData.date + " | Current Overs",
      status: "LIVE",
      battingTeam: match.teamA?.name || "Team A",
      bowlingTeam: match.teamB?.name || "Team B",
      score: `${match.teamA?.totalScore || 0}/${match.teamA?.wickets || 0}`,
      overs: match.teamA?.overs || "0.0",
      batting: match.firstInnings?.playerStats?.map(p => ({
        name: p.name || "Unknown",
        runs: p.runs || "0",
        balls: p.balls || "0",
        fours: p.fours || "0",
        sixes: p.sixes || "0",
        sr: p.sr || "0",
      })) || [],
      bowling: match.firstInnings?.bowlerStats?.map(b => ({
        name: b.name || "Unknown",
        overs: b.oversBowled || "0.0",
        maidens: b.maidens || "0",
        runs: b.runsConceded || "0",
        wickets: b.wickets || "0",
        eco: b.eco || "0",
      })) || [],
      recentBalls: [], // Placeholder; add logic if available in data
      commentary: [], // Placeholder; add logic if available in data
    };
  };

  // New function to transform match data into upcoming layout format
  const transformToUpcomingFormat = (match) => {
    return {
      id: match.matchId || "N/A",
      tournament: tournamentName || "Unknown Tournament",
      location: match.venue || "Not Available",
      date: `${match.date} ${match.time}`,
      status: "UPCOMING",
      matchId: match.matchId || "N/A",
      // teams: `${match.team1 || "Team 1"} vs ${match.team2 || "Team 2"}`,
      match: match.match,
    };
  };

  // New function to transform match data into past layout format
  const transformToPastFormat = (match) => {
    const matchData = getMatchData(match, "info");
    const summary = getMatchData(match, "summary");

    return {
      id: match.id,
      tournament: match.tournamentName || "Unknown Tournament",
      location: matchData.venue,
      date: matchData.date,
      status: "RESULT",
      match: "LEAGUE MATCHES", // Static or derive if needed
      team1: { name: match.teamA?.name || "Team 1", score: `${match.teamA?.totalScore || 0}/${match.teamA?.wickets || 0}`, overs: `${match.teamA?.overs || 0} Ov` },
      team2: { name: match.teamB?.name || "Team 2", score: `${match.teamB?.totalScore || 0}/${match.teamB?.wickets || 0}`, overs: `${match.teamB?.overs || 0} Ov` },
      result: summary.score,
    };
  };

  const getStatusBadgeStyle = (status) => {
    switch (status.toUpperCase()) {
      case "LIVE":
        return "bg-gradient-to-r from-red-500 to-yellow-500";
      case "UPCOMING":
        return "bg-gradient-to-r from-orange-500 to-yellow-500";
      case "PAST":
      case "RESULT":
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
      className="min-h-screen bg-fixed text-white p-4 md:p-5"
      style={{
        ...getBackgroundStyle(activeTab),
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top Navigation Bar */}
      <div className="flex flex-col">
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
          <span className="p-2 text-xl sm:text-2xl font-bold text-white whitespace-nowrap text-shadow-[0_0_8px_rgba(93,224,1)]">
            Cricklytics
          </span>
        </div>
      </div>
      <div className="md:absolute flex items-center gap-4 p-3 sm:p-4 pt-0">
        <img
          src={backButton}
          alt="Back"
          className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer -scale-x-100"
          onClick={() => window.history.back()}
        />
      </div>

      {/* Horizontal Navigation Bar */}
      <div className="max-w-6xl mx-auto mt-4">
        <div className="flex overflow-x-auto scrollbar-hide pb-2 mb-4">
          <div className="flex space-x-2 md:space-x-4 mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-3 py-2 text-sm md:text-lg font-medium whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? "text-cyan-300 border-b-2 border-cyan-300"
                    : "text-white hover:text-cyan-200"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-8 rounded-xl border border-white/20 shadow-lg bg-white/5 backdrop-blur">
          {activeTab === "my-matches" && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">My Matches</h2>
              <div className="flex overflow-x-auto scrollbar-hide md:justify-center space-x-2 md:space-x-4 p-2 md:p-4">
                {subOptions.map((option) => (
                  <button
                    key={option.id}
                    className={`flex-shrink-0 px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base transition-all duration-300 shadow-md ${
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
              <div className="mt-4">
                <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">
                  {activeSubOption.charAt(0).toUpperCase() + activeSubOption.slice(1)}
                </h3>
                {getFilteredMatches(activeTab).length === 0 ? (
                  <p className="text-center text-gray-300 py-4">No data available.</p>
                ) : (
                  getFilteredMatches(activeTab).map((match) => {
                    const matchData = getMatchData(match, activeSubOption);
                    return (
                      <div key={match.id} className="mb-4 p-3 md:p-4 bg-[rgba(0,0,0,0.3)] rounded-lg">
                        <p className="text-sm md:text-base"><strong>Match ID:</strong> {matchData.matchId}</p>
                        {activeSubOption === "info" && (
                          <div className="space-y-1 md:space-y-2 mt-2">
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
                          <div className="mt-2">
                            <p><strong>Summary:</strong> {matchData.score}</p>
                          </div>
                        )}
                        {activeSubOption === "scorecard" && (
                          <div className="space-y-2 md:space-y-4 mt-2">
                            <div>
                              <h4 className="font-bold">Batting</h4>
                              <p className="whitespace-pre-line text-sm md:text-base">{matchData.batting}</p>
                            </div>
                            <div>
                              <h4 className="font-bold">Bowling</h4>
                              <p className="whitespace-pre-line text-sm md:text-base">{matchData.bowling}</p>
                            </div>
                          </div>
                        )}
                        {activeSubOption === "squad" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mt-2">
                            <div>
                              <h4 className="font-bold">Team A</h4>
                              <p className="text-sm md:text-base">{matchData.squadIndia}</p>
                            </div>
                            <div>
                              <h4 className="font-bold">Team B</h4>
                              <p className="text-sm md:text-base">{matchData.squadAustralia}</p>
                            </div>
                          </div>
                        )}
                        {activeSubOption === "analysis" && (
                          <div className="mt-2">
                            <p className="text-sm md:text-base">{matchData.analysis}</p>
                          </div>
                        )}
                        {activeSubOption === "mvp" && (
                          <div className="mt-2">
                            <p className="text-sm md:text-base"><strong>MVP:</strong> {matchData.mvp}</p>
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
              <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">Following (Live + Past)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {getFilteredMatches(activeTab).length === 0 ? (
                  <p className="text-center text-gray-300 col-span-3 py-4">No matches to show here.</p>
                ) : (
                  getFilteredMatches(activeTab).map((match) => {
                    const matchData = getMatchData(match, "info");
                    return (
                      <div
                        key={match.id}
                        className="bg-[rgba(0,0,0,0.3)] p-4 rounded-md shadow-md hover:bg-[rgba(0,0,0,0.5)] transition-all duration-300 cursor-pointer relative"
                        // onClick={() => navigate(`/match/${match.id}`)}
                      >
                        <p className="text-sm"><strong>Match ID:</strong> {matchData.matchId}</p>
                        <h3 className="text-lg font-semibold mt-1">{matchData.teams}</h3>
                        <p className="text-gray-300 text-sm">{matchData.date}</p>
                        <p className="text-blue-400 text-sm">{matchData.status}</p>
                        <p className="mt-2 text-sm">{matchData.score}</p>
                        <p className="text-gray-400 text-xs">{matchData.venue}</p>

                        {/* Live Button for Live Matches */}
                        {matchData.status === "Live" && (
                          <button
                            className="absolute bottom-2 right-2 px-3 py-1 bg-gradient-to-r from-red-500 to-yellow-500 text-white text-xs rounded-full font-semibold hover:brightness-90 transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/match-details", { 
                                state: { 
                                  matchId: match.id, 
                                  tournamentId: match.tournamentId 
                                } 
                              });
                            }}
                          >
                            Live
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "all" && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">All Matches</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {getFilteredMatches(activeTab).length === 0 ? (
                  <p className="text-center text-gray-300 col-span-3 py-4">No matches to show here.</p>
                ) : (
                  getFilteredMatches(activeTab).map((match) => {
                    const matchData = getMatchData(match, "info");
                    return (
                      <div
                        key={match.id}
                        className="bg-[rgba(0,0,0,0.3)] p-4 rounded-lg shadow-md hover:bg-[rgba(0,0,0,0.5)] transition-all duration-300 cursor-pointer"
                        // onClick={() => navigate(`/match/${match.id}`)}
                      >
                        <p className="text-sm"><strong>Match ID:</strong> {matchData.matchId}</p>
                        <h3 className="text-lg font-semibold mt-1">{matchData.teams}</h3>
                        <p className="text-gray-300 text-sm">{matchData.date}</p>
                        <p className="text-cyan-300 text-sm">{matchData.status}</p>
                        <p className="mt-2 text-sm">{matchData.score}</p>
                        <p className="text-gray-400 text-xs">{matchData.venue}</p>
                        <p className="text-xs mt-1"><strong>Format:</strong> {matchData.Format}</p>
                        <p className="text-xs"><strong>Umpires:</strong> {matchData.umpire}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "live" && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">Live Matches</h2>

              <div className="space-y-4 md:space-y-6">
                {getFilteredMatches(activeTab).length === 0 ? (
                  <p className="text-center text-gray-300 py-4">No live match is currently available.</p>
                ) : (
                  getFilteredMatches(activeTab).map((match) => {
                    const transformedMatch = transformToLiveFormat(match);
                    return (
                      <div
                        key={transformedMatch.id}
                        className="bg-[rgba(0,0,0,0.3)] p-4 md:p-6 rounded-lg shadow-md hover:bg-[rgba(0,0,0,0.5)] transition-all duration-300 cursor-pointer"
                        onClick={() => navigate("/match-details", { state: { 
                                  matchId: match.id, 
                                  tournamentId: match.tournamentId 
                                }  
                              })}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg md:text-xl font-semibold">{transformedMatch.tournament}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs md:text-sm ${getStatusBadgeStyle(transformedMatch.status)}`}
                          >
                            {transformedMatch.status}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-300 mb-1">{transformedMatch.location}</p>
                        <p className="text-xs md:text-sm text-gray-300 mb-2">{transformedMatch.date}</p>
                        <div className="text-white text-base md:text-lg font-bold mb-1">
                          {transformedMatch.battingTeam} <span className="text-yellow-400">{transformedMatch.score}</span> ({transformedMatch.overs} Ov)
                        </div>
                        <p className="text-xs md:text-sm text-gray-300">Yet to Bat: {transformedMatch.bowlingTeam}</p>
                        {/* Add batting and bowling details if needed for live view */}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          
          {activeTab === "upcoming" && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">Upcoming Matches</h2>
              
              <div className="flex justify-end mb-4">
                <button className="text-white hover:text-cyan-300 transition text-sm md:text-base">
                  SHARE
                </button>
              </div>

              <div className="space-y-4 md:space-y-6">
                {upcomingMatches.length === 0 ? (
                  <p className="text-center text-gray-300 py-4">No upcoming matches available.</p>
                ) : (
                  upcomingMatches.map((match) => {
                    const transformedMatch = transformToUpcomingFormat(match);
                    return (
                      <div key={transformedMatch.id} className="bg-[rgba(0,0,0,0.3)] p-4 md:p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg md:text-xl font-bold">{transformedMatch.tournament}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs md:text-sm ${getStatusBadgeStyle(transformedMatch.status)}`}>
                            {transformedMatch.status}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-300">{transformedMatch.matchId}</p>
                        <p className="text-xs md:text-sm text-gray-300">{transformedMatch.location} | {transformedMatch.date}</p>
                        <p className="text-sm md:text-base mt-2">{transformedMatch.match}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "past" && (
            <div className="px-4 md:px-8 py-4 md:py-6">
              <h2 className="text-2xl md:text-4xl font-bold text-center mb-6 md:mb-10 text-white">Past Matches</h2>

              <div className="space-y-4 md:space-y-6">
                {getFilteredMatches(activeTab).length === 0 ? (
                  <p className="text-center text-gray-300 py-4">No past matches available.</p>
                ) : (
                  getFilteredMatches(activeTab).map((match) => {
                    const transformedMatch = transformToPastFormat(match);
                    return (
                      <div
                        key={transformedMatch.id}
                        className="bg-gradient-to-r from-[#4b0082] to-[#6a0dad] rounded-xl md:rounded-2xl px-4 py-4 md:px-8 md:py-6 shadow-lg"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-xl md:text-2xl font-bold">{transformedMatch.tournament}</h3>
                          <span className="bg-gray-700 text-white px-2 py-1 rounded-full text-xs md:text-sm font-semibold">
                            {transformedMatch.status}
                          </span>
                        </div>

                        <p className="text-xs md:text-sm text-gray-300 mb-1">{transformedMatch.location} | {transformedMatch.date}</p>
                        <p className="text-xs uppercase text-cyan-300 font-semibold mb-2">{transformedMatch.match}</p>

                        <div className="space-y-1 text-white text-sm md:text-base">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{transformedMatch.team1.name}</span>
                            <span className="text-right">
                              <span className="font-bold">{transformedMatch.team1.score}</span>{" "}
                              <span className="text-xs text-gray-300">({transformedMatch.team1.overs})</span>
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="font-medium">{transformedMatch.team2.name}</span>
                            <span className="text-right">
                              <span className="font-bold">{transformedMatch.team2.score}</span>{" "}
                              <span className="text-xs text-gray-300">({transformedMatch.team2.overs})</span>
                            </span>
                          </div>
                        </div>

                        <p className="text-xs md:text-sm text-white mt-2 md:mt-4">{transformedMatch.result}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Match;
