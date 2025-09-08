// PlayerCard.jsx (updated to conditionally display wickets if type === "Bowling")
import React from 'react';

const PlayerCard = ({ player, onPlay, type }) => {  // Added 'type' prop
  const handleCardClick = () => {
    if (player.audioUrl) {
      onPlay(player.audioUrl); // 🔊 Play using parent-managed audio
    }
  };

  // Get first letter of player name for avatar fallback
  const firstLetter = player.name ? player.name.charAt(0).toUpperCase() : '?';

  return (
    <div
      onClick={handleCardClick}
      className="w-120 max-w-sm rounded-lg shadow-md bg-white p-6 transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-white cursor-pointer"
    >
      <div className="flex items-center gap-4 mb-4">
        {player.photoUrl ? (
          <img
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 aspect-square"
            src={player.photoUrl}
            alt={player.name}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center border-2 border-gray-200 text-white text-2xl font-semibold aspect-square"
            style={{ display: player.photoUrl ? 'none' : 'flex' }}
          >
            {firstLetter}
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{player.name}</h2>
          <p className="text-sm text-gray-600">{player.role || 'Unknown Role'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Batting Avg</span>
          <span className="text-lg font-medium text-gray-800">{typeof player.average === 'number' && isFinite(player.average) 
    ? player.average.toFixed(2) 
    : 'N/A'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Bowling Avg</span>
          <span className="text-lg font-medium text-gray-800">{typeof player.bowlingAverage === 'number' && isFinite(player.bowlingAverage) 
    ? player.bowlingAverage.toFixed(2) 
    : 'N/A'}</span>
        </div>
      </div>

      <div>
        {/* Conditionally display based on type prop */}
        <span className="text-sm text-gray-500 block mb-1">
          {type === "Bowling" ? "Wickets" : "Total Runs"}
        </span>
        <span className="text-lg font-medium text-gray-800">
          {type === "Bowling"
            ? (player.wickets !== undefined ? player.wickets : 'N/A')
            : (player.runs !== undefined ? player.runs : 'N/A')}
        </span>
      </div>
    </div>
  );
};

export default PlayerCard;
