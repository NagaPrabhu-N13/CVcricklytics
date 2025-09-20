import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import backButton from '../../../assets/kumar/right-chevron.png';
import AIMatchCompanionModal from '../LandingPage/AIMatchCompanion';
import { db } from '../../../firebase'; // Adjust path to your firebase config
import { doc, onSnapshot } from 'firebase/firestore';
import { collection, query, where, orderBy } from 'firebase/firestore';


const MatchDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { matchId, tournamentId } = location.state || {};

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

   const [isBattersExpanded, setIsBattersExpanded] = useState(true);
  const [isBowlersExpanded, setIsBowlersExpanded] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(true);
  const [predictionData, setPredictionData] = useState(null);
  const [commentary, setCommentary] = useState([]);


  // Fetch match data in real-time
  useEffect(() => {
    if (!matchId) {
      setError("No match ID provided");
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'scoringpage', matchId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setMatch({ id: docSnapshot.id, ...docSnapshot.data() });
        setLoading(false);
      } else {
        setError("Match not found");
        setLoading(false);
      }
    }, (err) => {
      console.error("Error fetching match:", err);
      setError("Failed to load match details");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [matchId]);
  useEffect(() => {
  if (!tournamentId) return;

  const q = query(
    collection(db, "liveCommentary"),
    where("tournamentId", "==", tournamentId),
    orderBy("timestamp", "desc") // Ensures most recent first; remove if not needed
  );

  // Listener will update commentary array on any change
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const comments = querySnapshot.docs.map((doc, idx) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.commentary,
        runs: data.run,
        playerName: data.playerName,
        totalRuns: data.totalRuns || 0,      // <-- mapped
        wickets: data.wickets || 0,    
        timestamp: data.timestamp ? (
          data.timestamp instanceof Date ? data.timestamp.toLocaleString() :
          data.timestamp.toDate ? data.timestamp.toDate().toLocaleString() :
          ""
        ) : "",
        highlight: data.run >= 4 // Example: highlight 4s and 6s
      };
    });
    setCommentary(comments);
  });

  return () => unsubscribe();
}, [tournamentId]);


  // // Simulate live commentary updates
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const newComment = {
  //       id: commentary.length + 1,
  //       over: `${Math.floor(Math.random() * 15)}.${Math.floor(Math.random() * 6)}`,
  //       text: getRandomCommentary(),
  //       runs: Math.floor(Math.random() * 7),
  //       timestamp: "Just now",
  //       highlight: Math.random() > 0.7
  //     };
      
  //     setCommentary(prev => [newComment, ...prev.slice(0, 15)]);
  //   }, 15000); // Add new commentary every 15 seconds

  //   return () => clearInterval(interval);
  // }, [commentary.length]);

  const getRandomCommentary = () => {
    const commentaries = [
      "Excellent yorker! Dug out just in time.",
      "FOUR! Beautiful cover drive, no chance for the fielder.",
      "SIX! That's huge! Into the second tier!",
      "Defended solidly. Good technique shown.",
      "Edged but safe! Goes between slip and keeper.",
      "Appeal for LBW! Not given, umpire says bat involved.",
      "Quick single taken. Good running between wickets.",
      "Beaten! Beautiful delivery just missing the off stump.",
      "Driven straight down the ground for two runs.",
      "Short and pulled away with authority!",
      "Misfield! Extra run conceded.",
      "Reverse sweep attempted, doesn't connect properly.",
      "Perfect line and length, dot ball.",
      "Inside edge, saved from being bowled.",
      "Lofted over mid-off, safe and two runs."
    ];
    return commentaries[Math.floor(Math.random() * commentaries.length)];
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  if (loading) return <div className="p-4 md:p-6 text-white bg-gradient-to-br from-purple-900/30 to-indigo-800/30 min-h-screen"><p className="text-center">Loading match details...</p></div>;
  if (error) return <div className="p-4 md:p-6 text-white bg-gradient-to-br from-purple-900/30 to-indigo-800/30 min-h-screen"><p className="text-center text-red-500">{error}</p></div>;
  if (!match) return <div className="p-4 md:p-6 text-white bg-gradient-to-br from-purple-900/30 to-indigo-800/30 min-h-screen"><p className="text-center text-gray-300">No match data available.</p></div>;

  // Derive dynamic match data
  const isSecondInnings = (match.secondInnings?.playerStats?.length > 0) || (match.teamB?.overs > 0);
  const battingTeam = isSecondInnings ? match.teamB : match.teamA;
  const bowlingTeam = isSecondInnings ? match.teamA : match.teamB;
  const currentInnings = isSecondInnings ? match.secondInnings : match.firstInnings;

  const derivedMatch = {
    tournament: match.tournamentName || "Unknown Tournament",
    location: match.venue || "Not Available",
    date: match.createdAt ? match.createdAt.toDate().toISOString().split('T')[0] + " | Current Overs" : "Unknown Date",
    battingTeam: battingTeam?.name || (isSecondInnings ? "Team B" : "Team A"),
    bowlingTeam: bowlingTeam?.name || (isSecondInnings ? "Team A" : "Team B"),
    score: `${battingTeam?.totalScore || 0}/${battingTeam?.wickets || 0}`,
    overs: battingTeam?.overs || "0.0",
    batting: currentInnings?.playerStats?.map(p => ({
      name: p.name || "Unknown",
      runs: p.runs || "0",
      balls: p.balls || "0",
      fours: p.fours || "0",
      sixes: p.sixes || "0",
      sr: p.sr || "0",
    })) || [],
    bowling: currentInnings?.bowlerStats?.map(b => ({
      name: b.name || "Unknown",
      overs: b.oversBowled || "0.0",
      maidens: b.maidens || "0",
      runs: b.runsConceded || "0",
      wickets: b.wickets || "0",
      eco: b.eco || "0",
    })) || [],
    recentBalls: [], // Placeholder; implement if data available
  };

  // Calculate target for second innings
  const targetScore = (match.teamA?.totalScore || 0) + 1; // Assuming chase the score +1 to win

  return (
    <div className="p-4 md:p-6 text-white bg-gradient-to-br from-purple-900/30 to-indigo-800/30 min-h-screen">

      {/* Back Button */}
      <div className="flex items-center gap-4 mb-4">
        <img 
          src={backButton}
          alt="Back"
          className="h-8 w-8 cursor-pointer -scale-x-100"
          onClick={() => window.history.back()}
        />
        <h2 className="text-xl md:text-2xl font-bold font-['Alegreya']">
          {derivedMatch.tournament}
        </h2>
      </div>

      {/* Top Section - Match Score and AI Companion */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Match Details */}
        <div className="bg-gradient-to-br from-purple-800/20 to-indigo-800/20 p-4 md:p-6 rounded-xl shadow-lg flex-1 border border-purple-500/30">
          {/* Header Info */}
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">{derivedMatch.location}</h3>
            <span className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full shadow-md uppercase tracking-wide pulse-animation">
              <span className="w-2 h-2 bg-red-300 rounded-full mr-2"></span>
              Live
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-4">{derivedMatch.date}</p>

          {/* Score */}
          <div className="text-xl font-bold mb-2">
            {derivedMatch.battingTeam}{" "}
            <span className="text-red-400">{derivedMatch.score}</span> ({derivedMatch.overs} Ov)
          </div>
          {!isSecondInnings ? (
            <p className="text-sm text-gray-300 mb-6">Yet to Bat: {derivedMatch.bowlingTeam}</p>
          ) : (
            <p className="text-sm text-gray-300 mb-6">
              Target: {targetScore} ({match.teamA?.name || "Team A"}: {match.teamA?.totalScore || 0}/{match.teamA?.wickets || 0} in {match.teamA?.overs || 0} Ov)
            </p>
          )}
          {/* Current Players */}
          <div className="text-sm text-gray-300 mb-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Striker:</span>
              <span>{match.player?.striker?.name || 'N/A'}</span>
              {/* {match.player?.striker?.photoUrl && (
                <img 
                  src={match.player.striker.photoUrl} 
                  alt={match.player.striker.name} 
                  className="w-6 h-6 rounded-full object-cover" 
                />
              )} */}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Non-Striker:</span>
              <span>{match.player?.nonStriker?.name || 'N/A'}</span>
              {/* {match.player?.nonStriker?.photoUrl && (
                <img 
                  src={match.player.nonStriker.photoUrl} 
                  alt={match.player.nonStriker.name} 
                  className="w-6 h-6 rounded-full object-cover" 
                />
              )} */}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Bowler:</span>
              <span>{match.player?.bowler?.name || 'N/A'}</span>
              {/* {match.player?.bowler?.photoUrl && (
                <img 
                  src={match.player.bowler.photoUrl} 
                  alt={match.player.bowler.name} 
                  className="w-6 h-6 rounded-full object-cover" 
                />
              )} */}
            </div>
          </div>


           {/* Batters Dropdown */}
          <div className="mb-6">
            <div 
              className="flex items-center justify-between cursor-pointer mb-2"
              onClick={() => setIsBattersExpanded(!isBattersExpanded)}
            >
              <h4 className="text-lg font-semibold">Batters</h4>
              <svg 
                className={`w-5 h-5 transform transition-transform ${isBattersExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isBattersExpanded && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-purple-500/50">
                    <th className="py-1 pr-1">Batter</th>
                    <th className="text-center p-0.5">R</th>
                    <th className="text-center p-0.5">B</th>
                    <th className="text-center p-0.5">4s</th>
                    <th className="text-center p-0.5">6s</th>
                    <th className="text-center p-0.5">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {derivedMatch.batting.map((batter, index) => (
                    <tr key={index} className="text-left border-b border-purple-500/20">
                      <td className="py-1 pr-1 font-medium">{batter.name}</td>
                      <td className="text-center p-0.5">{batter.runs}</td>
                      <td className="text-center p-0.5">{batter.balls}</td>
                      <td className="text-center p-0.5">{batter.fours}</td>
                      <td className="text-center p-0.5">{batter.sixes}</td>
                      <td className="text-center p-0.5">{batter.sr}</td>
                    </tr>
                  ))}
                  {derivedMatch.batting.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-2">No batting data available yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Bowlers Dropdown */}
          <div className="mb-6">
            <div 
              className="flex items-center justify-between cursor-pointer mb-2"
              onClick={() => setIsBowlersExpanded(!isBowlersExpanded)}
            >
              <h4 className="text-lg font-semibold">Bowlers</h4>
              <svg 
                className={`w-5 h-5 transform transition-transform ${isBowlersExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isBowlersExpanded && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-purple-500/50">
                    <th className="py-1 pr-1">Bowler</th>
                    <th className="text-center p-0.5">O</th>
                    <th className="text-center p-0.5">M</th>
                    <th className="text-center p-0.5">R</th>
                    <th className="text-center p-0.5">W</th>
                    <th className="text-center p-0.5">Eco</th>
                  </tr>
                </thead>
                <tbody>
                  {derivedMatch.bowling.map((bowler, index) => (
                    <tr key={index} className="text-left border-b border-purple-500/20">
                      <td className="py-1 pr-1 font-medium">{bowler.name}</td>
                      <td className="text-center p-0.5">{bowler.overs}</td>
                      <td className="text-center p-0.5">{bowler.maidens}</td>
                      <td className="text-center p-0.5">{bowler.runs}</td>
                      <td className="text-center p-0.5">{bowler.wickets}</td>
                      <td className="text-center p-0.5">{bowler.eco}</td>
                    </tr>
                  ))}
                  {derivedMatch.bowling.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-2">No bowling data available yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
             </div>

          {/* Recent Balls */}
          {derivedMatch.recentBalls?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-semibold mb-2">Recent Balls</h4>
              <div className="flex flex-wrap gap-2">
                {derivedMatch.recentBalls.map((ball, i) => (
                  <span key={i} className="bg-purple-700/50 px-2 py-1 rounded text-xs border border-purple-500/30">
                    {ball}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Match Companion - Right side on desktop, second on mobile */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/60 p-4 md:p-6 rounded-xl shadow-lg lg:w-2/5 border border-gray-600/30 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-600">
            <h3 className="text-xl font-semibold flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              AI Match Companion
            </h3>
            <button 
              onClick={() => setIsModalOpen(!isModalOpen)}
              className="text-xs bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded transition-colors"
            >
              {isModalOpen ? 'Minimize' : 'Expand'}
            </button>
          </div>
          
          <div className="h-[400px] overflow-y-auto pr-2">
            <AIMatchCompanionModal
              isOpen={true}
              onClose={handleClose}
              tournamentId={tournamentId}
              embedded={true}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section - Live Commentary */}
      <div className="bg-gradient-to-br from-purple-800/20 to-indigo-800/20 p-4 md:p-6 rounded-xl shadow-lg border border-purple-500/30 order-3">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-500/50">
          <h3 className="text-xl font-semibold flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
            Live Commentary
          </h3>
          <span className="text-xs text-gray-400 bg-purple-700/50 px-2 py-1 rounded">
            Auto-updating
          </span>
        </div>
        
        <div className="h-[400px] overflow-y-auto pr-2 commentary-scroll">
          {commentary.map((item) => (
            <div 
              key={item.id}
              className={`mb-3 pb-3 border-b border-purple-500/30 last:border-b-0 transition-all duration-300 ${item.highlight ? 'bg-purple-700/30 -mx-2 px-2 py-2 rounded' : ''}`}
            >
              <div className="flex">
                <div className={`min-w-[3rem] flex flex-col items-center justify-center h-8 w-8 rounded-full mr-3 ${
                  item.runs === 0 ? 'bg-gray-700' : 
                  item.runs === 4 ? 'bg-blue-700' : 
                  item.runs === 6 ? 'bg-purple-700' : 'bg-green-700'
                }`}>
                  {/* You can display ball/over here if stored */}
                  <p className="text-sm mb-1">{item.totalRuns}/{item.wickets}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm mb-1">{item.text}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{item.timestamp}</span>
                    {item.runs > 0 && (
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-700/50">
                        {item.runs} run{item.runs > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        
        <div className="mt-4 pt-3 border-t border-purple-500/30">
          <div className="flex flex-wrap items-center text-xs text-gray-400 gap-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-700 rounded-full mr-1"></div>
              <span>Dot ball</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-700 rounded-full mr-1"></div>
              <span>1-3 runs</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-700 rounded-full mr-1"></div>
              <span>Four</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-700 rounded-full mr-1"></div>
              <span>Six</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        .commentary-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .commentary-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .commentary-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default MatchDetails;
