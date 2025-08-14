import React from 'react';

const PlayerCard = ({ player, onPlay }) => {
  const handleCardClick = () => {
    if (player.audioUrl) {
      onPlay(player.audioUrl); // 🔊 Play using parent-managed audio
    }
  };

  // Calculate batting average: runs / outs, where outs = matches - notOuts
  const outs = player.matches && player.notOuts ? Math.abs(player.matches - player.notOuts) : 0;
  const battingAvg = outs > 0 && player.runs ? (player.runs / outs).toFixed(2) : 'N/A';

  // Calculate bowling average: overs / wickets
  const bowlingAvg = player.wickets > 0 && player.overs ? (player.overs / player.wickets).toFixed(2) : 'N/A';

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
          <span className="text-lg font-medium text-gray-800">{battingAvg}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Bowling Avg</span>
          <span className="text-lg font-medium text-gray-800">{bowlingAvg}</span>
        </div>
      </div>

      <div>
        <span className="text-sm text-gray-500 block mb-1">Highest Score</span>
        <span className="text-lg font-medium text-gray-800">
          {player.highest !== undefined ? player.highest : 'N/A'}
        </span>
      </div>
    </div>
  );
};

export default PlayerCard;