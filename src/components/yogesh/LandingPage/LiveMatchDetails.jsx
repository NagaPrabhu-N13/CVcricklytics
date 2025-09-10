import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import backButton from '../../../assets/kumar/right-chevron.png';
import AIMatchCompanionModal from '../LandingPage/AIMatchCompanion'; // Adjust import path as needed

const MatchDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const match = location.state;
  const tournamentId = location.state; // Assuming tournamentId is passed in match state

  console.log(tournamentId);

  const [isModalOpen, setIsModalOpen] = useState(true); // Local state: open by default
  const [predictionData, setPredictionData] = useState(null); // Example: fetch or set data here

  useEffect(() => {
    if (!match) navigate("/");
    
    // Optional: Fetch or set predictionData dynamically if needed
    // For example:
    // setPredictionData({ battingTeam: 'Team A', ... });
  }, [match, navigate]);

  const handleClose = () => {
    setIsModalOpen(false);
  };

  if (!match) return null;

  return (
    <div className="p-6 text-white bg-[rgba(42,29,78,0.3)] ">

      {/* Back Button */}
      <div className="md:absolute flex items-center gap-4">
        <img 
          src={backButton}
          alt="Back"
          className="h-8 w-8 cursor-pointer -scale-x-100"
          onClick={() => window.history.back()}
        />
      </div>

      <h2 className="text-2xl font-bold text-center mb-6 font-['Alegreya']">
        {match.tournament}
      </h2>

      <div className="bg-[rgba(60,41,112,0.3)] p-6 rounded-lg shadow-md">
        {/* Header Info */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">{match.location}</h3>
          <span className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full shadow-md uppercase tracking-wide">
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
        <p className="text-sm text-gray-300 mb-4">Yet to Bat: {match.bowlingTeam}</p>

        {/* Batters Table */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Batters</h4>
          <table className="w-full text-sm border-separate">
            <thead>
              <tr className="text-gray-400 text-left">
                <th className="py-1 pr-4">Name</th>
                <th className="text-center px-2">R</th>
                <th className="text-center px-2">B</th>
                <th className="text-center px-2">4s</th>
                <th className="text-center px-2">6s</th>
                <th className="text-center px-2">SR</th>
              </tr>
            </thead>
            <tbody>
              {match.batting.map((batter, index) => (
                <tr key={index} className="text-left">
                  <td className="py-1 pr-4">{batter.name}</td>
                  <td className="text-center">{batter.runs}</td>
                  <td className="text-center">{batter.balls}</td>
                  <td className="text-center">{batter.fours}</td>
                  <td className="text-center">{batter.sixes}</td>
                  <td className="text-center">{batter.sr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bowlers Table */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Bowlers</h4>
          <table className="w-full text-sm border-separate">
            <thead>
              <tr className="text-gray-400 text-left">
                <th className="py-1 pr-4">Name</th>
                <th className="text-center px-2">O</th>
                <th className="text-center px-2">M</th>
                <th className="text-center px-2">R</th>
                <th className="text-center px-2">W</th>
                <th className="text-center px-2">Eco</th>
              </tr>
            </thead>
            <tbody>
              {match.bowling.map((bowler, index) => (
                <tr key={index} className="text-left">
                  <td className="py-1 pr-4">{bowler.name}</td>
                  <td className="text-center">{bowler.overs}</td>
                  <td className="text-center">{bowler.maidens}</td>
                  <td className="text-center">{bowler.runs}</td>
                  <td className="text-center">{bowler.wickets}</td>
                  <td className="text-center">{bowler.eco}</td>
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
                <span key={i} className="bg-gray-700 px-2 py-1 rounded text-xs">
                  {ball}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Commentary */}
        {/* {match.commentary?.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-2">Commentary</h4>
            {match.commentary.map((item, i) => (
              <p key={i} className="text-sm text-gray-300">
                <span className="text-white font-medium">{item.over}</span>{" "}
                {item.text}
              </p>
            ))}
          </div>
        )} */}
      </div>

      {/* AI Match Companion Modal - Displayed by default */}
      <AIMatchCompanionModal
        isOpen={isModalOpen}
        onClose={handleClose}
        tournamentId={tournamentId}
      />
    </div>
  );
};

export default MatchDetails;
