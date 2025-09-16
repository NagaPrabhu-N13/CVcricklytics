import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import backButton from '../../../assets/kumar/right-chevron.png';
import AIMatchCompanionModal from '../LandingPage/AIMatchCompanion';

const MatchDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const match = location.state;
  const tournamentId = location.state;

  const [isModalOpen, setIsModalOpen] = useState(true);
  const [predictionData, setPredictionData] = useState(null);
  const [commentary, setCommentary] = useState([
    { 
      id: 1, 
      over: "12.3", 
      text: "FOUR! Beautiful drive through the covers! Perfect timing and placement.", 
      runs: 4,
      timestamp: "2 mins ago",
      highlight: true
    },
    { 
      id: 2, 
      over: "12.2", 
      text: "Defended solidly back to the bowler. Good length delivery.", 
      runs: 0,
      timestamp: "3 mins ago"
    },
    { 
      id: 3, 
      over: "12.1", 
      text: "Short and pulled away for a single. Good aggressive batting.", 
      runs: 1,
      timestamp: "4 mins ago"
    },
    { 
      id: 4, 
      over: "11.6", 
      text: "Dot ball. Excellent line and length from the bowler.", 
      runs: 0,
      timestamp: "5 mins ago"
    },
    { 
      id: 5, 
      over: "11.5", 
      text: "SIX! Massive hit over long-on! That went 95 meters!", 
      runs: 6,
      timestamp: "6 mins ago",
      highlight: true
    },
    { 
      id: 6, 
      over: "11.4", 
      text: "Edged but falls safe. Two runs taken.", 
      runs: 2,
      timestamp: "7 mins ago"
    },
    { 
      id: 7, 
      over: "11.3", 
      text: "Play and miss outside off stump. Beaten by pace.", 
      runs: 0,
      timestamp: "8 mins ago"
    },
    { 
      id: 8, 
      over: "11.2", 
      text: "Driven to deep cover for a single. Good rotation of strike.", 
      runs: 1,
      timestamp: "9 mins ago"
    },
    { 
      id: 9, 
      over: "11.1", 
      text: "Length ball, defended towards mid-on. No run.", 
      runs: 0,
      timestamp: "10 mins ago"
    }
  ]);

  // Simulate live commentary updates
  useEffect(() => {
    if (!match) navigate("/");
    
    const interval = setInterval(() => {
      const newComment = {
        id: commentary.length + 1,
        over: `${Math.floor(Math.random() * 15)}.${Math.floor(Math.random() * 6)}`,
        text: getRandomCommentary(),
        runs: Math.floor(Math.random() * 7),
        timestamp: "Just now",
        highlight: Math.random() > 0.7
      };
      
      setCommentary(prev => [newComment, ...prev.slice(0, 15)]);
    }, 15000); // Add new commentary every 15 seconds

    return () => clearInterval(interval);
  }, [match, navigate, commentary.length]);

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

  if (!match) return null;

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
          {match.tournament}
        </h2>
      </div>

      {/* Top Section - Match Score and AI Companion */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Match Details */}
        <div className="bg-gradient-to-br from-purple-800/20 to-indigo-800/20 p-4 md:p-6 rounded-xl shadow-lg flex-1 border border-purple-500/30">
          {/* Header Info */}
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">{match.location}</h3>
            <span className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full shadow-md uppercase tracking-wide pulse-animation">
              <span className="w-2 h-2 bg-red-300 rounded-full mr-2"></span>
              Live
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-4">{match.date}</p>

          {/* Score */}
          <div className="text-xl font-bold mb-2">
            {match.battingTeam}{" "}
            <span className="text-red-400">{match.score}</span> ({match.overs} Ov)
          </div>
          <p className="text-sm text-gray-300 mb-6">Yet to Bat: {match.bowlingTeam}</p>

          {/* Batters Table */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-1">Batters</h4>
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
                {match.batting.map((batter, index) => (
                  <tr key={index} className="text-left border-b border-purple-500/20">
                    <td className="py-1 pr-1 font-medium">{batter.name}</td>
                    <td className="text-center p-0.5">{batter.runs}</td>
                    <td className="text-center p-0.5">{batter.balls}</td>
                    <td className="text-center p-0.5">{batter.fours}</td>
                    <td className="text-center p-0.5">{batter.sixes}</td>
                    <td className="text-center p-0.5">{batter.sr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bowlers Table */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-1">Bowlers</h4>
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
                {match.bowling.map((bowler, index) => (
                  <tr key={index} className="text-left border-b border-purple-500/20">
                    <td className="py-1 pr-1 font-medium">{bowler.name}</td>
                    <td className="text-center p-0.5">{bowler.overs}</td>
                    <td className="text-center p-0.5">{bowler.maidens}</td>
                    <td className="text-center p-0.5">{bowler.runs}</td>
                    <td className="text-center p-0.5">{bowler.wickets}</td>
                    <td className="text-center p-0.5">{bowler.eco}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Balls */}
          {match.recentBalls?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-semibold mb-2">Recent Balls</h4>
              <div className="flex flex-wrap gap-2">
                {match.recentBalls.map((ball, i) => (
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
                  <span className="text-xs font-bold">{item.over}</span>
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

      {/* AI Match Companion Modal (for expanded view) */}
      <AIMatchCompanionModal
        isOpen={isModalOpen}
        onClose={handleClose}
        tournamentId={tournamentId}
        expanded={true}
      />

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