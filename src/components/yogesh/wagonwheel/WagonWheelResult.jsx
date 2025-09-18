import React from 'react';

const regionCoordinates = {
  'Long Off': { x: 200, y: 70 },
  'Cover': { x: 310, y: 130 },
  'Point': { x: 340, y: 200 },
  'Third Man': { x: 310, y: 270 },
  'Fine Leg': { x: 90, y: 270 },
  'Mid Wicket': { x: 60, y: 200 },
  'Long On': { x: 90, y: 130 },
  'Straight': { x: 200, y: 110 },
};

export default function WagonWheelResult({  data, run, player, tournamentId }) {
  if (!data?.shotDirection) return null;

  const { shotDirection, shotType } = data;
  const coord = regionCoordinates[shotDirection];
  // Generate commentary (already saved in parent, but display it here)
  const commentary = `${player?.name || 'Player'} scored ${run} runs with a ${shotType} shot towards ${shotDirection}.`;
  // Optional: Log tournamentId for debugging
  console.log('WagonWheelResult received:', { run, player, tournamentId });
  console.log(commentary)

  return (
    <div className="mt-5 flex flex-col items-center px-3 sm:px-6">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-green-700 text-center">
        Wagon Wheel Result
      </h2>

      {/* Responsive SVG Container */}
      <div className="relative w-full max-w-[320px] sm:max-w-[400px] md:max-w-[500px] aspect-square">
        <svg
  className="w-full h-full"
  viewBox="0 0 400 400"
  preserveAspectRatio="xMidYMid meet"
>
  {/* Field Circle - Responsive */}
  <circle
    cx="50%"       // center horizontally
    cy="50%"       // center vertically
    r="42%"        // responsive radius (42% of container)
    fill="url(#fieldGradient)"
    stroke="#16a34a"
    strokeWidth="3"
  />

  {/* Pitch - relative inside circle */}
  <rect
    x="47.5%"      // center pitch
    y="35%"
    width="5%"
    height="30%"
    fill="#e2e8f0"
    rx="2"
  />

  {/* Shot Path */}
  {coord && (
    <line
      x1="50%"
      y1="50%"
      x2={coord.x}
      y2={coord.y}
      stroke="#f43f5e"
      strokeWidth="2.5"
      strokeDasharray="4"
      markerEnd="url(#arrow)"
    />
  )}

  {/* Shot End Marker */}
  {coord && (
    <circle
      cx={coord.x}
      cy={coord.y}
      r="6"
      fill="#dc2626"
      stroke="#fff"
      strokeWidth="2"
    />
  )}

  {/* Region Labels */}
  {Object.entries(regionCoordinates).map(([label, pos]) => (
    <text
      key={label}
      x={pos.x}
      y={pos.y - 10}
      fontSize="9"
      className="sm:text-[11px] md:text-[13px]"
      textAnchor="middle"
      fill={shotDirection === label ? '#dc2626' : '#1e3a8a'}
      fontWeight={shotDirection === label ? 'bold' : 'normal'}
    >
      {label}
    </text>
  ))}

  {/* Gradients + Arrow Marker */}
  <defs>
    <linearGradient id="fieldGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#bbf7d0" />
      <stop offset="100%" stopColor="#86efac" />
    </linearGradient>
    <marker
      id="arrow"
      viewBox="0 0 10 10"
      refX="10"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
    </marker>
  </defs>
</svg>

      </div>

      {/* Details Card */}
      <div className="mt-3 lg:mt-6 p-4 sm:p-5 bg-white rounded-xl shadow-lg border w-full max-w-sm sm:max-w-md text-left text-xs sm:text-sm md:text-base">
        <p>
          <strong className="text-gray-700">Shot Direction:</strong>{' '}
          {shotDirection}
        </p>
        <p>
          <strong className="text-gray-700">Shot Type:</strong> {shotType}
        </p>
      </div>
    </div>
  );
}
