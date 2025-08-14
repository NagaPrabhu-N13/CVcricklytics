import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const pitchTypes = ["Dry", "Green", "Dusty", "Flat", "Bouncy", "Spinning"];
const tossOptions = ["Bat First", "Bowl First"];

export default function PitchAnalyzer({ teamA, teamB, onAnalyzeComplete }) {
  const [pitchType, setPitchType] = useState('');
  const [tossResult, setTossResult] = useState('');
  const [location, setLocation] = useState('');
  const [pitchImage, setPitchImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const formData = new FormData();
      formData.append("pitchType", pitchType);
      formData.append("tossResult", tossResult);
      formData.append("location", location);
      if (pitchImage) formData.append("image", pitchImage);

      const analysisResult = handleDummyData();
      setResult(analysisResult);
      setShowModal(true);
      if (onAnalyzeComplete) onAnalyzeComplete(analysisResult);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDummyData = () => {
    const analysisResult = {
      pitchSummary: `The pitch at ${location || 'this venue'} is ${pitchType.toLowerCase() || 'typically'} and expected to assist ${pitchType === 'Spinning' || pitchType === 'Dusty' ? 'spinners' : 'fast bowlers'} in the second innings. The surface shows visible cracks which will open up as the match progresses.`,
      playerAdvice: `Focus on ${pitchType === 'Spinning' || pitchType === 'Dusty' ? 'spin bowlers and batsmen who play spin well' : 'fast bowlers and technically sound batsmen'}. All-rounders who can contribute with both bat and ball will be valuable.`,
      topPlayers: getRecommendedPlayers(pitchType),
      matchPrediction: `Teams winning the toss are ${tossResult === 'Bat First' ? 'likely to bat first and aim for 280+ runs' : 'expected to bowl first and restrict the opposition'}. ${pitchType === 'Dry' || pitchType === 'Dusty' ? 'Chasing may be difficult in the second innings.' : 'The pitch should remain consistent throughout the match.'}`,
      pitchType,
      tossResult,
      location
    };
    
    return analysisResult;
  };

  const getRecommendedPlayers = (type) => {
    const basePlayers = [
      "Ravindra Jadeja", "Kuldeep Yadav", "Shreyas Iyer", 
      "Joe Root", "Ravichandran Ashwin", "Steve Smith"
    ];
    
    if (type === 'Green' || type === 'Bouncy') {
      return [
        "Jasprit Bumrah", "Pat Cummins", "Virat Kohli",
        "Kane Williamson", "Mitchell Starc", "KL Rahul"
      ];
    }
    
    if (type === 'Flat') {
      return [
        "Rohit Sharma", "David Warner", "Babar Azam",
        "Jos Buttler", "Glenn Maxwell", "Ben Stokes"
      ];
    }
    
    return basePlayers;
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPitchImage(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg shadow-md border border-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-3 border-b border-blue-700">
          <h2 className="text-lg font-bold text-white">Pitch Analysis</h2>
        </div>

        <div className="p-4">
          {teamA && teamB && (
            <div className="mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-md border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Match Context</h3>
              <div className="flex items-center justify-center gap-3 text-sm">
                <span className="font-medium text-blue-900">{teamA}</span>
                <span className="text-blue-700 font-bold">vs</span>
                <span className="font-medium text-blue-900">{teamB}</span>
              </div>
            </div>
          )}

          <div className="bg-white bg-opacity-80 p-4 rounded-lg border border-blue-100 mb-4">
            <div className="grid gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Pitch Type
                </label>
                <select
                  value={pitchType}
                  onChange={e => setPitchType(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select pitch type</option>
                  {pitchTypes.map(type => <option key={type}>{type}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18m-5-5h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Toss Result
                </label>
                <select
                  value={tossResult}
                  onChange={e => setTossResult(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select toss result</option>
                  {tossOptions.map(option => <option key={option}>{option}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Match Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g., Chepauk, Chennai"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Pitch Image
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="px-3 py-1.5 border border-dashed border-gray-300 rounded-md hover:border-blue-400 text-center text-xs">
                      {pitchImage ? "Image selected" : "Click to upload"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  </label>
                  {pitchImage && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Uploaded
                    </span>
                  )}
                </div>
                {pitchImage && (
                  <div className="mt-1">
                    <img 
                      src={URL.createObjectURL(pitchImage)} 
                      alt="Pitch preview" 
                      className="max-h-32 rounded border border-gray-200 mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>

            {!pitchType && !tossResult && !pitchImage && (
              <p className="text-xs text-red-500 mt-2 text-center">
                Please provide at least one input for analysis
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!pitchType && !tossResult && !pitchImage)}
                className={`px-4 py-2 text-sm rounded-md font-medium flex items-center gap-1 ${isAnalyzing || (!pitchType && !tossResult && !pitchImage) 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-md'}`}
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Analyze
                  </>
                )}
              </button>
              
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 p-3 flex justify-between items-center border-b border-blue-700">
                <h2 className="text-lg font-bold text-white">Pitch Analysis Report</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-full hover:bg-blue-700 transition"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-md font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 p-1.5 rounded-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    Pitch Behavior Summary
                  </h3>
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-sm">
                    <p>{result.pitchSummary}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-bold text-green-800 mb-2 flex items-center gap-2">
                    <span className="bg-green-100 text-green-800 p-1.5 rounded-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                    Strategic Advice
                  </h3>
                  <div className="bg-green-50 p-3 rounded-md border border-green-200 text-sm">
                    <p>{result.playerAdvice}</p>
                  </div>
                </div>

                {result.matchPrediction && (
                  <div>
                    <h3 className="text-md font-bold text-purple-800 mb-2 flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-800 p-1.5 rounded-full">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                      Match Prediction
                    </h3>
                    <div className="bg-purple-50 p-3 rounded-md border border-purple-200 text-sm">
                      <p>{result.matchPrediction}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-md font-bold text-amber-800 mb-2 flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-800 p-1.5 rounded-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    Top Player Recommendations
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {result.topPlayers.map((player, index) => (
                      <div key={player} className="bg-white p-2 rounded border border-blue-100 hover:border-blue-300 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{player}</h4>
                            <p className="text-xs text-gray-500">Specialist {player.includes("Jadeja") || player.includes("Ashwin") || player.includes("Yadav") ? "Spin Bowler" : "Batsman"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}