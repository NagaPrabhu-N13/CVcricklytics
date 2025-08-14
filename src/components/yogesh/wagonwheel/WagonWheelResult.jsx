import React from 'react';

const regionCoordinates = {
  'Long Off': { x: 200, y: 40 },
  'Cover': { x: 300, y: 110 },
  'Point': { x: 340, y: 200 },
  'Third Man': { x: 300, y: 290 },
  'Fine Leg': { x: 100, y: 290 },
  'Mid Wicket': { x: 60, y: 200 },
  'Long On': { x: 100, y: 110 },
  'Straight': { x: 200, y: 90 },
};

export default function WagonWheelResult({ data }) {
  if (!data?.shotDirection) return null;

  const { shotDirection, shotType, catchType, fielder } = data;
  const coord = regionCoordinates[shotDirection];

  return (
    <div className="mt-6 md:mt-12 flex flex-col items-center px-4">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6 text-green-700">Wagon Wheel Result</h2>

      <div className="relative w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px] aspect-square">
        <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
          {/* Field background */}
          <circle cx="200" cy="200" r="190" fill="url(#fieldGradient)" stroke="#16a34a" strokeWidth="4" />
          
          {/* Pitch */}
          <rect x="190" y="130" width="20" height="140" fill="#e2e8f0" rx="4" />
          
          {/* Shot direction line */}
          {coord && (
            <line
              x1="200"
              y1="200"
              x2={coord.x}
              y2={coord.y}
              stroke="#f43f5e"
              strokeWidth="3"
              strokeDasharray="4"
              markerEnd="url(#arrow)"
            />
          )}
          
          {/* Shot destination marker */}
          {coord && (
            <circle
              cx={coord.x}
              cy={coord.y}
              r="8"
              fill="#dc2626"
              stroke="#fff"
              strokeWidth="2"
            />
          )}
          
          {/* Region labels */}
          {Object.entries(regionCoordinates).map(([label, pos]) => (
            <text
              key={label}
              x={pos.x}
              y={pos.y - 10}
              fontSize="10"
              textAnchor="middle"
              fill="#1e3a8a"
              fontWeight={shotDirection === label ? "bold" : "normal"}
              className="text-xs sm:text-sm"
            >
              {label}
            </text>
          ))}
          
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

      <div className="mt-4 md:mt-6 p-4 md:p-5 bg-white rounded-lg md:rounded-xl shadow-md md:shadow-xl border w-full max-w-xs sm:max-w-sm md:max-w-md text-left text-sm sm:text-base">
        <p className="mb-2"><strong className="text-gray-700">Shot Direction:</strong> <span className="text-green-800">{shotDirection}</span></p>
        <p className="mb-2"><strong className="text-gray-700">Shot Type:</strong> <span className="text-green-800">{shotType}</span></p>
        {catchType && (
          <p className="mb-2"><strong className="text-gray-700">Catch Type:</strong> <span className="text-green-800">{catchType}</span></p>
        )}
        {fielder && (
          <p><strong className="text-gray-700">Fielder:</strong> <span className="text-green-800">{fielder}</span></p>
        )}
      </div>
    </div>
  );
}