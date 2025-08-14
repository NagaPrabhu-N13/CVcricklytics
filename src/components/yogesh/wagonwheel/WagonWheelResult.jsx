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
    <div className="mt-5 flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-6 text-green-700">Wagon Wheel Result</h2>

      <div className="relative w-[400px] h-[400px]">
        <svg className="w-full h-full" viewBox="0 0 400 400">
          <circle cx="200" cy="200" r="190" fill="url(#fieldGradient)" stroke="#16a34a" strokeWidth="4" />
          <rect x="190" y="130" width="20" height="140" fill="#e2e8f0" rx="4" />
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
          {Object.entries(regionCoordinates).map(([label, pos]) => (
            <text
              key={label}
              x={pos.x}
              y={pos.y - 10}
              fontSize="12"
              textAnchor="middle"
              fill="#1e3a8a"
              fontWeight={shotDirection === label ? "bold" : "normal"}
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

      <div className="mt-6 p-5 bg-white rounded-xl shadow-xl border w-full max-w-md text-left text-sm sm:text-base">
        <p><strong className="text-gray-700">Shot Direction:</strong> {shotDirection}</p>
        <p><strong className="text-gray-700">Shot Type:</strong> {shotType}</p>
      </div>
    </div>
  );
}
