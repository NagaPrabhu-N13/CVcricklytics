import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../../firebase'; // Assuming firebase is configured and imported
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';


const pitchTypes = ["Red Soil", "Black Soil", "Matting", "Astro Turf"];
const tossOptions = ["Bat First", "Bowl First"];
const weatherOptions = ["Sunny", "Cloudy", "Humid", "Rainy"];


export default function PitchAnalyzer({
  teamA,
  teamB,
  onAnalyzeComplete,
  tournamentName,
  tournamentId,
  enableSummary = true,
  enableAdvice = true,
  enablePrediction = true,
  isPremium = false
}) {
  const [pitchType, setPitchType] = useState('');
  const [tossResult, setTossResult] = useState('');
  const [weather, setWeather] = useState('');
  const [location, setLocation] = useState('');
  const [pitchMedia, setPitchMedia] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [savedResults, setSavedResults] = useState(null);
  const [publishedToggles, setPublishedToggles] = useState({});


  const navigate = useNavigate();


  useEffect(() => {
    if (pitchMedia) {
      const file = pitchMedia[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      return () => URL.revokeObjectURL(url);
    }
  }, [pitchMedia]);


  useEffect(() => {
    const checkViewMode = async () => {
      if (tournamentName && tournamentId) {
        setViewMode(true);
        const published = await fetchPublishedByTournamentId(tournamentId);
        if (published) {
          setSavedResults(published);
        } else {
          setSavedResults(null);
        }
      } else {
        setViewMode(false);
      }
    };
    checkViewMode();
  }, [tournamentName, tournamentId]);


  const fetchPublishedByTournamentId = async (tournamentId) => {
    try {
      const colRef = collection(db, 'PitchAnalyzer');
      const q = query(colRef, where('tournamentId', '==', tournamentId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          if (data.published && Object.keys(data.published).length > 0) {
            return data.published;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching PitchAnalyzer by tournamentId:', error);
      return null;
    }
  };


  const handleAnalyze = async () => {
    if (viewMode) return; // No analysis in view mode


    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const formData = new FormData();
      formData.append("pitchType", pitchType);
      formData.append("tossResult", tossResult);
      formData.append("weather", weather);
      formData.append("location", location);
      if (pitchMedia) formData.append("media", pitchMedia[0]);
      // TODO: Integrate actual API call to Firebase storage + AI API for real analysis
      const analysisResult = handleDummyData();
      setResult(analysisResult);
      setPublishedToggles({
        pitchType: false,
        pitchBehavior: false,
        strategicAdvice: false,
        scorePrediction: false,
        matchPrediction: false,
        suggestedXI: false,
      });
      setShowModal(true);
      if (onAnalyzeComplete) onAnalyzeComplete(analysisResult);
    } finally {
      setIsAnalyzing(false);
    }
  };


  const handleDummyData = () => {
    let pitchBehavior = '';
    let strategicAdvice = '';
    let scorePrediction = '';
    let suggestedXI = [];
    let matchPrediction = '';


    // Dummy logic based on new pitch types and weather
    switch (pitchType) {
      case 'Red Soil':
        pitchBehavior = `The pitch is dry and likely to help spinners, especially under ${weather.toLowerCase() || 'typical'} conditions.`;
        strategicAdvice = 'Focus on spin bowlers and batsmen who handle turn well. Pick 1-2 all-rounders for balance.';
        scorePrediction = 'Expected first innings score: 250-300 runs.';
        suggestedXI = [
          'Openers: Technically sound batsmen',
          'Middle Order: Spin-playing specialists',
          'Bowlers: 3 spinners, 2 pacers'
        ];
        break;
      case 'Black Soil':
        pitchBehavior = `The pitch retains moisture and assists seamers, particularly in ${weather.toLowerCase() || 'overcast'} weather.`;
        strategicAdvice = 'Emphasize fast bowlers and resilient batsmen. Include seam-bowling all-rounders.';
        scorePrediction = 'Expected first innings score: 200-250 runs.';
        suggestedXI = [
          'Openers: Defensive batsmen',
          'Middle Order: All-round contributors',
          'Bowlers: 3 pacers, 2 spinners'
        ];
        break;
      case 'Matting':
        pitchBehavior = `The pitch offers consistent bounce, behaving predictably regardless of ${weather.toLowerCase() || 'any'} conditions.`;
        strategicAdvice = 'Balance the team with versatile players. Focus on consistent performers.';
        scorePrediction = 'Expected first innings score: 275-325 runs.';
        suggestedXI = [
          'Openers: Aggressive stroke-makers',
          'Middle Order: Anchor players',
          'Bowlers: Mix of pace and spin'
        ];
        break;
      case 'Astro Turf':
        pitchBehavior = `The pitch is fast and bouncy, favoring pace under ${weather.toLowerCase() || 'sunny'} skies.`;
        strategicAdvice = 'Prioritize quick bowlers and batsmen with good technique against bounce.';
        scorePrediction = 'Expected first innings score: 180-220 runs.';
        suggestedXI = [
          'Openers: Quick-scoring batsmen',
          'Middle Order: Bounce handlers',
          'Bowlers: 4 pacers, 1 spinner'
        ];
        break;
      default:
        pitchBehavior = `The pitch at ${location || 'this venue'} is expected to behave neutrally.`;
        strategicAdvice = 'Build a balanced team with all-round capabilities.';
        scorePrediction = 'Expected first innings score: 220-270 runs.';
        suggestedXI = ['Balanced XI recommended'];
    }


    matchPrediction = `Teams winning the toss are ${tossResult === 'Bat First' ? 'likely to bat first and post a competitive total' : 'expected to bowl first and exploit conditions'}.`;


    return {
      pitchBehavior,
      strategicAdvice,
      scorePrediction,
      suggestedXI,
      matchPrediction,
      pitchType,
      tossResult,
      weather,
      location
    };
  };


  const handlePublishToggle = async (section) => {
    if (!tournamentId || !auth.currentUser) return;


    const newToggles = { ...publishedToggles, [section]: !publishedToggles[section] };
    setPublishedToggles(newToggles);


    const userId = auth.currentUser.uid;
    const docRef = doc(db, 'PitchAnalyzer', `${userId}_${tournamentId}`);
    const publishedData = {};


    Object.keys(newToggles).forEach(key => {
      if (newToggles[key] && result[key]) {
        publishedData[key] = result[key];
      }
    });


    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, { published: publishedData });
    } else {
      await setDoc(docRef, {
        userId,
        tournamentId,
        published: publishedData,
        // createdAt: Timestamp.now()
      });
    }
  };


  const handleMediaChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPitchMedia(e.target.files);
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
          {!viewMode ? (
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                    Weather
                  </label>
                  <select
                    value={weather}
                    onChange={e => setWeather(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select weather</option>
                    {weatherOptions.map(option => <option key={option}>{option}</option>)}
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
                    Pitch Photo/Video (5-10 sec video preferred)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="px-3 py-1.5 border border-dashed border-gray-300 rounded-md hover:border-blue-400 text-center text-xs">
                        {pitchMedia ? "Media selected" : "Click to upload"}
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleMediaChange}
                          className="hidden"
                        />
                      </div>
                    </label>
                    {pitchMedia && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Uploaded
                      </span>
                    )}
                  </div>
                  {previewUrl && (
                    <div className="mt-1 flex justify-center">
                      {mediaType === 'image' ? (
                        <img 
                          src={previewUrl} 
                          alt="Pitch preview" 
                          className="w-32 h-32 object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <video 
                          src={previewUrl} 
                          className="w-32 h-32 object-cover rounded border border-gray-200"
                          controls
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
              {!pitchType && !tossResult && !weather && !pitchMedia && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  Please provide at least one input for analysis
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!pitchType && !tossResult && !weather && !pitchMedia)}
                  className={`px-4 py-2 text-sm rounded-md font-medium flex items-center gap-1 ${isAnalyzing || (!pitchType && !tossResult && !weather && !pitchMedia) 
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
          ) : (
            // View Mode: Display saved published results
            <div className="bg-white bg-opacity-80 p-4 rounded-lg border border-blue-100 mb-4">
              {savedResults && Object.keys(savedResults).length > 0 ? (
                Object.entries(savedResults).map(([section, value]) => (
                  <div key={section} className="mb-4">
                    <h3 className="text-md font-bold text-blue-800 mb-2 capitalize">{section.replace(/([A-Z])/g, ' $1').trim()}</h3>
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-sm">
                      {Array.isArray(value) ? (
                        <ul className="list-disc pl-4">
                          {value.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      ) : (
                        <p>{value}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">No published analysis available for this tournament.</p>
              )}
              {/* Conditional Next Button */}
              {tournamentName && tournamentId && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => {
                      navigate("/match", {
                        state: {
                          tournamentId,
                          tournamentName,
                        }
                      });
                    }}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 text-base rounded-lg font-semibold hover:shadow-lg transition w-full sm:w-auto"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {showModal && result && !viewMode && (
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
                {/* Pitch Type Recognition */}
                {result.pitchType && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-bold text-blue-800 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 p-1.5 rounded-full">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </span>
                        Pitch Type
                      </h3>
                      <label className="flex items-center gap-1 text-xs">
                        Publish
                        <input
                          type="checkbox"
                          checked={publishedToggles.pitchType}
                          onChange={() => handlePublishToggle('pitchType')}
                          className="toggle-checkbox"
                        />
                      </label>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-sm">
                      <p>{result.pitchType}</p>
                    </div>
                  </div>
                )}

                {/* AI Pitch Behavior Summary */}
                {enableSummary && result.pitchBehavior && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-bold text-blue-800 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 p-1.5 rounded-full">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        Pitch Behavior Summary
                      </h3>
                      <label className="flex items-center gap-1 text-xs">
                        Publish
                        <input
                          type="checkbox"
                          checked={publishedToggles.pitchBehavior}
                          onChange={() => handlePublishToggle('pitchBehavior')}
                          className="toggle-checkbox"
                        />
                      </label>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-sm">
                      <p>{result.pitchBehavior}</p>
                    </div>
                  </div>
                )}

                {/* Strategic Advice */}
                {enableAdvice && result.strategicAdvice && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-bold text-green-800 flex items-center gap-2">
                        <span className="bg-green-100 text-green-800 p-1.5 rounded-full">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </span>
                        Strategic Advice
                      </h3>
                      <label className="flex items-center gap-1 text-xs">
                        Publish
                        <input
                          type="checkbox"
                          checked={publishedToggles.strategicAdvice}
                          onChange={() => handlePublishToggle('strategicAdvice')}
                          className="toggle-checkbox"
                        />
                      </label>
                    </div>
                    <div className="bg-green-50 p-3 rounded-md border border-green-200 text-sm">
                      <p>{result.strategicAdvice}</p>
                    </div>
                  </div>
                )}

                {/* Score Prediction */}
                {enablePrediction && result.scorePrediction && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-bold text-purple-800 flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-800 p-1.5 rounded-full">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </span>
                        Score Prediction
                      </h3>
                      <label className="flex items-center gap-1 text-xs">
                        Publish
                        <input
                          type="checkbox"
                          checked={publishedToggles.scorePrediction}
                          onChange={() => handlePublishToggle('scorePrediction')}
                          className="toggle-checkbox"
                        />
                      </label>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-md border border-purple-200 text-sm">
                      <p>{result.scorePrediction}</p>
                    </div>
                  </div>
                )}

                {/* Match Prediction */}
                {result.matchPrediction && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-bold text-purple-800 flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-800 p-1.5 rounded-full">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </span>
                        Match Prediction
                      </h3>
                      <label className="flex items-center gap-1 text-xs">
                        Publish
                        <input
                          type="checkbox"
                          checked={publishedToggles.matchPrediction}
                          onChange={() => handlePublishToggle('matchPrediction')}
                          className="toggle-checkbox"
                        />
                      </label>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-md border border-purple-200 text-sm">
                      <p>{result.matchPrediction}</p>
                    </div>
                  </div>
                )}

                {/* Player Suggestion (Premium) */}
                {isPremium && result.suggestedXI && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-bold text-amber-800 flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-800 p-1.5 rounded-full">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </span>
                        Suggested XI for this Pitch Type
                      </h3>
                      <label className="flex items-center gap-1 text-xs">
                        Publish
                        <input
                          type="checkbox"
                          checked={publishedToggles.suggestedXI}
                          onChange={() => handlePublishToggle('suggestedXI')}
                          className="toggle-checkbox"
                        />
                      </label>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {result.suggestedXI.map((item, index) => (
                        <div key={index} className="bg-white p-2 rounded border border-blue-100 hover:border-blue-300 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <p>{item}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Pitch Card (Premium) */}
                {isPremium && previewUrl && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-bold text-indigo-800 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-800 p-1.5 rounded-full">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </span>
                        Visual Pitch Card
                      </h3>
                      <label className="flex items-center gap-1 text-xs">
                        Publish
                        <input
                          type="checkbox"
                          checked={publishedToggles.visualPitchCard}
                          onChange={() => handlePublishToggle('visualPitchCard')}
                          className="toggle-checkbox"
                        />
                      </label>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-md border border-indigo-200 flex justify-center">
                      {mediaType === 'image' ? (
                        <img 
                          src={previewUrl} 
                          alt="Pitch visual" 
                          className="max-w-full h-auto rounded"
                        />
                      ) : (
                        <video 
                          src={previewUrl} 
                          className="max-w-full h-auto rounded"
                          controls
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Conditional Next Button */}
                {tournamentName && tournamentId && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => {
                        navigate("/match", {
                          state: {
                            tournamentId,
                            tournamentName,
                          }
                        });
                        setShowModal(false);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 text-base rounded-lg font-semibold hover:shadow-lg transition w-full sm:w-auto"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
