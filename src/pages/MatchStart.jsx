import React, { useState, useEffect, useRef  } from 'react';
import { motion } from 'framer-motion';
import FireworksCanvas from '../components/sophita/HomePage/FireworksCanvas';
import { FaChevronDown, FaChevronUp, FaTrophy, FaHeart, FaCommentDots, FaShareAlt } from 'react-icons/fa';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { ScatterChart, Scatter, ZAxis, BarChart, Bar } from 'recharts';
import logo from '../assets/sophita/HomePage/Picture3_2.png';
import netherland from '../assets/sophita/HomePage/Netherland.jpeg';
import southAfrica from '../assets/sophita/HomePage/Southafrica.png';
import trophy from '../assets/sophita/HomePage/trophy.png';
import ipl2 from '../assets/sophita/HomePage/ipl2.jpeg';
import ipl2022 from '../assets/sophita/HomePage/2022.jpeg';
import ipl2025 from '../assets/sophita/HomePage/2025.jpeg';
import ipl2019 from '../assets/sophita/HomePage/2019.jpeg';
import ipl2019_3 from '../assets/sophita/HomePage/2019-3.jpeg';
import ipl2021 from '../assets/sophita/HomePage/2021.jpeg';
import ipl2020 from '../assets/sophita/HomePage/2020.jpeg';
import ipl2018 from '../assets/sophita/HomePage/2018.jpeg';
import advertisement1 from '../assets/sophita/HomePage/Advertisement1.webp'
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import Startmatch from './Startmatch'; // Assuming this is StartmatchPlayers
import nav from '../assets/kumar/right-chevron.png';
import placeholderFlag from '../assets/sophita/HomePage/Netherland.jpeg'; // ADD a placeholder image (ensure this path is correct)

const IPLCards = ({ setActiveTab }) => {
  const cards = [
    {
      image: ipl2,
      videoUrl: "https://www.youtube.com/embed/AFEZzf9_EHk?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0",
      title: "Rohit Sharma Hits 140!",
      alt: "Cricket Match 1",
    },
    {
      image: ipl2022,
      alt: "Cricket Match 1",
    },
    {
      image: ipl2025,
      alt: "Cricket Match 3",
    },
    {
      image: ipl2019,
      alt: "Cricket Match 1",
    },
    {
      image: ipl2019_3,
      alt: "Cricket Match 2",
    },
    {
      image: ipl2021,
      alt: "Cricket Match 3",
    },
    {
      image: ipl2020,
      alt: "Cricket Match 1",
    },
    {
      image: ipl2019,
      alt: "Cricket Match 2",
    },
    {
      image: advertisement1,
      alt: "Cricket Match 3",
    },
  ];

  // Create refs for file inputs (optional, but a common pattern)
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handlePhotoUploadClick = () => {
    // Trigger the hidden file input for photos
    photoInputRef.current.click();
  };

  const handleVideoUploadClick = () => {
    // Trigger the hidden file input for videos
    videoInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      // Process the uploaded files here
      console.log("Uploaded files:", files);
      // You would typically upload these files to a server or display them
    }
    // Clear the input value so the same file can be selected again
    event.target.value = null;
  };

    // Handler for the Next button
    const handleNextClick = () => {
      setActiveTab('Match Analytics');
    };
  

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 py-0">
       {/* Buttons for Upload */}
       <div className="flex justify-center gap-6 mb-6 w-full max-w-md"> {/* Adjusted width and added justify-center */}
       <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg"
        onClick={handlePhotoUploadClick}>Upload Photo
        </button>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg"
          onClick={handleVideoUploadClick}>Upload Video
          </button>
           {/* Added Next button */}
          <motion.button
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm sm:text-base flex-1" // Added flex-1 and green color
            onClick={handleNextClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Next
          </motion.button>


          {/* Hidden file input elements */}
          <input
            type="file"
            accept="image/*" // Accept image files
            ref={photoInputRef}
            className="hidden" // Hide the input
            onChange={handleFileChange}
          />
          <input
            type="file"
            accept="video/*" // Accept video files
            ref={videoInputRef}
            className="hidden" // Hide the input
            onChange={handleFileChange}
          />
        </div>
      <div className="flex flex-wrap justify-center gap-6 mb-12">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            className="bg-white rounded-2xl overflow-hidden shadow-md flex flex-col items-center"
            whileHover={{ scale: 1.05 }}
          >
            <img
              src={card.image}
              alt={card.alt}
              className="w-[300px] h-[220px] object-cover"
            />
            <div className="flex justify-around items-center w-full py-3">
              <FaHeart className="text-red-500 text-2xl cursor-pointer" />
              <FaCommentDots className="text-black text-2xl cursor-pointer" />
              <FaShareAlt className="text-black text-2xl cursor-pointer" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const WormGraph = () => {
  const data = [
    { over: 1, runs: 5 },
    { over: 2, runs: 15 },
    { over: 3, runs: 25 },
    { over: 4, runs: 35 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
        <XAxis dataKey="over" stroke="#cbd5e0" />
        <YAxis stroke="#cbd5e0" />
        <Tooltip contentStyle={{ backgroundColor: "#374151", color: "#fff" }} />
        <Line type="monotone" dataKey="runs" stroke="#ffc658" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const WagonWheelChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
      <CartesianGrid stroke="#4a5568" />
      <XAxis type="number" dataKey="distance" name="Distance" domain={[0, 10]} stroke="#cbd5e0" />
      <YAxis type="number" dataKey="angle" name="Angle" domain={[0, 360]} stroke="#cbd5e0" />
      <Tooltip contentStyle={{ backgroundColor: '#374151', color: '#fff' }} />
      <Scatter data={data} fill="#8884d8" />
    </ScatterChart>
  </ResponsiveContainer>
);

const BatsmanHeatmapChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
      <CartesianGrid stroke="#4a5568" />
      <XAxis type="number" dataKey="x" name="Pitch X" domain={[0, 5]} stroke="#cbd5e0" />
      <YAxis type="number" dataKey="y" name="Pitch Y" domain={[0, 5]} stroke="#cbd5e0" />
      <ZAxis type="number" dataKey="intensity" range={[0, 100]} />
      <Tooltip contentStyle={{ backgroundColor: '#374151', color: '#fff' }} />
      <Scatter data={data} fill="#ffc658" />
    </ScatterChart>
  </ResponsiveContainer>
);

const BowlerHeatmapChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
      <CartesianGrid stroke="#4a5568" />
      <XAxis type="number" dataKey="x" name="Pitch X" domain={[0, 5]} stroke="#cbd5e0" />
      <YAxis type="number" dataKey="y" name="Pitch Y" domain={[0, 5]} stroke="#cbd5e0" />
      <ZAxis type="number" dataKey="intensity" range={[0, 100]} />
      <Tooltip contentStyle={{ backgroundColor: '#374151', color: '#fff' }} />
      <Scatter data={data} fill="#82ca9d" />
    </ScatterChart>
  </ResponsiveContainer>
);

const FallOfWicketsChart = () => {
  const data = [
    { over: 5, wickets: 1 },
    { over: 12, wickets: 2 },
    { over: 18, wickets: 3 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
        <XAxis dataKey="over" stroke="#cbd5e0" />
        <YAxis stroke="#cbd5e0" />
        <Tooltip contentStyle={{ backgroundColor: "#374151", color: "#fff" }} />
        <Bar dataKey="wickets" fill="#d9534f" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const FallOfWicketsDetails = () => {
  const data = [
    { wicket: 1, batsman: 'Player A', bowler: 'Bowler X', over: 5, score: 30 },
    { wicket: 2, batsman: 'Player B', bowler: 'Bowler Y', over: 12, score: 65 },
    { wicket: 3, batsman: 'Player C', bowler: 'Bowler Z', over: 18, score: 95 },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Wicket</th>
            <th className="px-4 py-2 text-left">Batsman</th>
            <th className="px-4 py-2 text-left">Bowler</th>
            <th className="px-4 py-2 text-left">Over</th>
            <th className="px-4 py-2 text-left">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {data.map((item) => (
            <tr key={item.wicket}>
              <td className="px-4 py-2">{item.wicket}</td>
              <td className="px-4 py-2">{item.batsman}</td>
              <td className="px-4 py-2">{item.bowler}</td>
              <td className="px-4 py-2">{item.over}</td>
              <td className="px-4 py-2">{item.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const FixtureGenerator = () => {

  const [selectedTeamA, setSelectedTeamA] = useState('');
  const [selectedTeamB, setSelectedTeamB] = useState('');


  // --- UPDATED NEW STATES for Live Score data from Startmatch ---
  const [liveTeamA, setLiveTeamA] = useState({ name: 'Team A', flag: placeholderFlag, score: '0/0', overs: '(0.0)' });
  const [liveTeamB, setLiveTeamB] = useState({ name: 'Team B', flag: placeholderFlag, score: '0/0', overs: '(0.0)' });
  const [winningCaption, setWinningCaption] = useState(''); // To store the winning difference caption
  const [firstInningsOutCount, setFirstInningsOutCount] = useState('');
  

  // --- End of UPDATED NEW STATES ---


  const [activeTab, setActiveTab] = useState('Fixture Generator');
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('scorecard');
  const [generatedFixtures, setGeneratedFixtures] = useState([]);
  const [showFixtures, setShowFixtures] = useState(false);
  const navigate = useNavigate();
  const [matchResultWinner, setMatchResultWinner] = useState(null); // State to store the winner
  

  const location = useLocation();
  const teamsFromTournament = location.state?.selectedTeams || [];
  console.log(teamsFromTournament);

  const [cameFromSidebar, setCameFromSidebar] = useState(false);
   useEffect(() => {
        if (location.state) {
            // Check if there's a state and if it contains activeTab and winner
            if (location.state.activeTab) {
                setActiveTab(location.state.activeTab);
            }
            if (location.state.winner) {
                setMatchResultWinner(location.state.winner);
                setWinningCaption(location.state.winningDifference); // Set the winning difference here
            }
            // If we have a completed match, mark the fixture as completed
        if (location.state.completedFixtureId) {
          markFixtureAsCompleted(location.state.completedFixtureId);
        }

            // If navigating with team data for live score (e.g. from Startmatch after game ends)
            if (location.state.teamA && location.state.teamB) {
                setLiveTeamA({
                    name: location.state.teamA.name,
                    flag: location.state.teamA.flagUrl || placeholderFlag, // Use passed flagUrl
                    score: `${location.state.teamA.score}/${location.state.teamA.wickets}`,
                    overs: location.state.teamA.balls ? `(${Math.floor(location.state.teamA.balls / 6)}.${location.state.teamA.balls % 6} overs)` : '(0.0 overs)' // Calculate overs from balls
                });
                setLiveTeamB({
                    name: location.state.teamB.name,
                    flag: location.state.teamB.flagUrl || placeholderFlag, // Use passed flagUrl
                    score: `${location.state.teamB.score}/${location.state.teamB.wickets}`,
                    overs: location.state.teamB.balls ? `(${Math.floor(location.state.teamB.balls / 6)}.${location.state.teamB.balls % 6} overs)` : '(0.0 overs)'
                });
            } else if (location.state.teamA) { // Fallback if only teamA is passed
                setLiveTeamA(prevState => ({
                    ...prevState,
                    name: location.state.teamA.name,
                    flag: location.state.teamA.flagUrl || placeholderFlag,
                }));
            } else if (location.state.teamB) { // Fallback if only teamB is passed
                setLiveTeamB(prevState => ({
                    ...prevState,
                    name: location.state.teamB.name,
                    flag: location.state.teamB.flagUrl || placeholderFlag,
                }));
            }
        }
    }, [location.state]); // Re-run effect when location.state changes

        // Handler to update team data received from StartmatchPlayers
    const handleTeamsSelected = (teamAData, teamBData) => {
        setLiveTeamA({
            name: teamAData.name,
            flag: teamAData.flagUrl, // Ensure Startmatch passes flagUrl
            score: teamAData.score || '0/0', // Default if not passed
            overs: teamAData.overs || '(0.0)' // Default if not passed
        });
        setLiveTeamB({
            name: teamBData.name,
            flag: teamBData.flagUrl, // Ensure Startmatch passes flagUrl
            score: teamBData.score || '0/0',
            overs: teamBData.overs || '(0.0)'
        });
        // You might want to automatically switch to the Live Score tab here
        // setActiveTab('Live Score');
    };

  // Default list of teams if none are passed from TournamentPage
  const defaultTeams = ['India', 'Australia', 'England', 'Pakistan', 'New Zealand', 'Netherlands', 'South Africa'];

  // Determine which team list to use
  const availableTeams = teamsFromTournament.length > 0 ? teamsFromTournament : defaultTeams;
  console.log(availableTeams);


  // Sample data for charts
  const runsComparisonData = [
    { over: 1, teamA: 5, teamB: 6 },
    { over: 2, teamA: 15, teamB: 10 },
    { over: 3, teamA: 25, teamB: 20 },
    { over: 4, teamA: 35, teamB: 30 },
  ];

  const wagonWheelData = [
    { distance: 3, angle: 45 },
    { distance: 5, angle: 90 },
    { distance: 7, angle: 135 },
  ];

  const batsmanHeatmapData = [
    { x: 1, y: 2, intensity: 50 },
    { x: 2, y: 3, intensity: 80 },
    { x: 3, y: 1, intensity: 30 },
  ];

  const bowlerHeatmapData = [
    { x: 1, y: 4, intensity: 70 },
    { x: 2, y: 3, intensity: 60 },
    { x: 3, y: 2, intensity: 40 },
  ];

const [completedFixtures, setCompletedFixtures] = useState([]);


  const generateFixtures = () => {
    if (!selectedTeamA || !selectedTeamB) {
      alert('Please select both teams');
      return;
    }
    // Check if selected teams are the same
    if (selectedTeamA === selectedTeamB) {
      alert('Please select different teams for the fixture');
      return;
    }

    const fixtureExists = generatedFixtures.some(
      fixture => 
        (fixture.teamA === selectedTeamA && fixture.teamB === selectedTeamB) ||
        (fixture.teamA === selectedTeamB && fixture.teamB === selectedTeamA)
    );

    if (fixtureExists) {
      alert('This fixture already exists!');
      return;
    }

    const newFixture = {
      id: Date.now(),
      teamA: selectedTeamA,
      teamB: selectedTeamB,
      date: new Date().toISOString()
    };

    setGeneratedFixtures([...generatedFixtures, newFixture]);
    setShowFixtures(true);
  };

  const markFixtureAsCompleted = (fixtureId) => {
    const fixture = generatedFixtures.find(f => f.id === fixtureId);
    if (fixture) {
      setCompletedFixtures([...completedFixtures, fixtureId]);
    }
  };

  const handleFixtureNextClick = () => { // Renamed to be specific
    // Switch the tab to show the Startmatch component
    setActiveTab('Start Match');
  };

  // Handler for the Back button - Modified logic
  const handleBack = () => {
    // If the initial navigation was from the sidebar, go back in browser history
    if (cameFromSidebar) {
      navigate(-1); // This will navigate to the previous page (your homepage)
    } else {
      // If not from sidebar, use the original tab cycling logic
      switch (activeTab) {
        case 'Fixture Generator':
          navigate('/TournamentPage'); // Go back to Tournament page from Fixture Generator
          break;
        case 'Start Match':
          // If came to Start Match from Fixture Generator, go back to Fixture Generator tab
          setActiveTab('Fixture Generator');
          break;
        case 'Live Score':
          setActiveTab('Start Match');
          break;
        case 'Match Results':
          setActiveTab('Live Score');
          break;
        case 'Highlights':
          setActiveTab('Match Results');
          break;
        case 'Match Analytics':
          setActiveTab('Highlights');
          break;
        default:
          navigate(-1); // Fallback to history if tab is unexpected
          break;
      }
    }
  };

  // This grouping logic seems for display, keeping it for now
  const groupedFixtures = generatedFixtures.reduce((acc, fixture) => {
    // Assuming you might add a 'round' property later if doing multi-round tournaments
    const round = fixture.round || 'Round 1'; // Default to Round 1 if no round property
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(fixture);
    return acc;
  }, {});


  const allTabs = ['Fixture Generator', 'Start Match', 'Live Score', 'Match Results', 'Highlights', 'Match Analytics'];
  const tabsExceptFixtureGenerator = cameFromSidebar && (activeTab === 'Start Match' || activeTab === 'Live Score' || activeTab === 'Match Results' || activeTab === 'Highlights' || activeTab === 'Match Analytics')
  ? ['Start Match', 'Live Score', 'Match Results', 'Highlights', 'Match Analytics']
  : allTabs;

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-blue-200 overflow-x-hidden">
      {/* Header */}
      <header className="w-screen shadow-md">
        {/* Added mx-auto here */}
        <div className="w-full max-w-7xl py-4 flex justify-between items-center">
          {/* Left side: Logo, Title, and Back Button */}
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center">
              <motion.img
                src={logo}
                alt="Cricklytics Logo"
                    className="w-20 h-20 sm:w-25 sm:h-25 object-cover select-none"
                whileHover={{ scale: 1.05 }}
              />
              <h1 className="text-2xl font-bold text-gray-800 pl-3">Cricklytics</h1>
            </div>
            <img
              src={nav} // Assuming 'nav' here is the back arrow icon variable
              alt="Back"
              loading="lazy"
              className="w-10 h-10 -scale-x-100 cursor-pointer mt-[5px] ml-[5px]"
              onClick={handleBack}
            />
          </div>

          {/* Right side: Navigation Tabs */}
          <div className="flex items-center overflow-x-auto mt-8 md:mt-8 -ml-20 md:-ml-20">
          <ul className="flex gap-x-2 sm:gap-x-3 md:gap-x-4 lg:gap-x-5">
              {/* Render tabs based on whether we came from the sidebar to Start Match */}
              {cameFromSidebar && activeTab === 'Start Match' ? (
                 // If came from sidebar AND active tab is Start Match, show all except Fixture Generator
                 tabsExceptFixtureGenerator.map((tab) => (
                   <li key={tab} className="flex-shrink-0"> {/* flex-shrink-0 prevents tabs from shrinking */}
                     <button
                       className={`py-2 px-3 rounded-lg transition whitespace-nowrap text-sm sm:text-base ${
                         activeTab === tab
                           ? 'bg-blue-600 text-white font-semibold shadow-md'
                           : 'bg-gray-100 text-black hover:bg-gray-200'
                       }`}
                       onClick={() => setActiveTab(tab)}
                     >
                       {tab}
                     </button>
                   </li>
                 ))
              ) : (
                 // In all other cases, show ALL tabs
                 allTabs.map((tab) => (
                   <li key={tab} className="flex-shrink-0"> {/* flex-shrink-0 prevents tabs from shrinking */}
                     <button
                       className={`py-2 px-3 rounded-lg transition whitespace-nowrap text-sm sm:text-base ${
                         activeTab === tab
                           ? 'bg-blue-600 text-white font-semibold shadow-md'
                           : 'bg-gray-100 text-black hover:bg-gray-200'
                       }`}
                       onClick={() => setActiveTab(tab)}
                     >
                       {tab}
                     </button>
                   </li>
                 ))
              )}
            </ul>
          </div>
        </div>
      </header>

      {/* Main Content */}
    {activeTab === 'Start Match' ? (
  <Startmatch
    initialTeamA={selectedTeamA}
    initialTeamB={selectedTeamB}
    origin="/match-start"
    onTeamsSelectedForLiveScore={handleTeamsSelected}
    setActiveTab={setActiveTab}
    fixtures={generatedFixtures}
    completedFixtures={completedFixtures} // Pass completed fixtures
    markFixtureAsCompleted={markFixtureAsCompleted} // Pass the completion function
  />
) : (
      <main className="w-full max-w-7xl px-4 sm:px-8 py-8 mx-auto">
        {activeTab === 'Fixture Generator' && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="w-full"
  >
    <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">Fixture Generator</h2>

    <div className="w-full flex flex-col md:flex-row gap-4 sm:gap-6 mb-8 sm:mb-10">
      <div className="flex-1 min-w-0">
        <label className="block text-gray-700 mb-2 font-medium">Select Team</label>
        <select
          className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
          value={selectedTeamA}
          onChange={(e) => setSelectedTeamA(e.target.value)}
        >
          <option value="">Select Team</option>
          {availableTeams.map(teamName => (
            <option key={`teamA-${teamName}`} value={teamName}>{teamName}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-0">
        <label className="block text-gray-700 mb-2 font-medium">Opponent Team</label>
        <select
          className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
          value={selectedTeamB}
          onChange={(e) => setSelectedTeamB(e.target.value)}
        >
          <option value="">Select Team</option>
          {availableTeams.filter(t => t !== selectedTeamA).map(teamName => (
            <option key={`teamB-${teamName}`} value={teamName}>{teamName}</option>
          ))}
        </select>
      </div>

      <div className="flex items-end">
        <motion.button
          className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition-all"
          onClick={generateFixtures}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!selectedTeamA || !selectedTeamB || selectedTeamA === selectedTeamB}
        >
          Add Fixture
        </motion.button>
      </div>
    </div>
 {generatedFixtures.length > 0 && (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full bg-white rounded-xl shadow-lg p-4 sm:p-6 overflow-x-auto"
    >
      <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2">Tournament Fixtures</h3>
      
      <div className="space-y-4">
        {generatedFixtures.map((fixture, index) => (
          <motion.div
            key={fixture.id}
            className={`flex items-center justify-between rounded-lg p-4 shadow-sm ${
              completedFixtures.includes(fixture.id) 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200'
            }`}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center">
              <span className="font-medium text-gray-800 mr-2">{index + 1}.</span>
              <div className="flex items-center">
                <span className="font-medium text-gray-800">{fixture.teamA}</span>
                <span className="mx-2 text-gray-500">vs</span>
                <span className="font-medium text-gray-800">{fixture.teamB}</span>
              </div>
              {completedFixtures.includes(fixture.id) && (
                <span className="ml-2 text-green-600">✓ Completed</span>
              )}
            </div>
            {!completedFixtures.includes(fixture.id) && (
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => {
                  setGeneratedFixtures(generatedFixtures.filter((f) => f.id !== fixture.id));
                }}
              >
                Remove
              </button>
            )}
          </motion.div>
        ))}
      </div>
      
      <div className="w-full flex justify-end mt-8">
        <motion.button
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-teal-600 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFixtureNextClick}
          disabled={generatedFixtures.length === 0}
        >

            Next
          </motion.button>
        </div>
      </motion.div>
    )}
  </motion.div>
)}

        {activeTab === 'Live Score' && (
            <div className="w-full">
                <motion.div
                    className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl mx-auto mt-10"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6">
                        <h3 className="text-2xl font-bold">ICC Cricket World Cup</h3>
                        <p className="text-sm opacity-90 mt-1">Today • 10:30 AM • Wankhede Stadium, Mumbai</p>
                    </div>

                    <div className="p-6 bg-gray-50">
                        <div className="flex justify-around items-center mb-6">
                             <motion.div
                                className="text-center"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <div className="w-20 h-20 mx-auto mb-2 bg-gray-200 rounded-full overflow-hidden shadow-md">
                                    <img
                                        src={liveTeamA.flag || placeholderFlag} // Use liveTeamB.flag
                                        alt={`${liveTeamA.name || 'Team A'} Flag`}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <h4 className="font-bold text-xl text-gray-800">{liveTeamA.name || 'Team A'}</h4>
                                <p className="text-3xl font-extrabold text-green-700 mt-1">{liveTeamA.score || '178/3'}</p>
                                <p className="text-sm text-gray-600">{liveTeamA.overs || '(15.2 overs)'}</p>
                            </motion.div>

                            <div className="text-3xl font-bold text-gray-600 px-6">vs</div>

                            <motion.div
                                className="text-center"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <div className="w-20 h-20 mx-auto mb-2 bg-gray-200 rounded-full overflow-hidden shadow-md">
                                    <img
                                        src={liveTeamB.flag || placeholderFlag} // Use liveTeamB.flag
                                        alt={`${liveTeamB.name || 'Team B'} Flag`}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <h4 className="font-bold text-xl text-gray-800">{liveTeamB.name || 'Team B'}</h4>
                                <p className="text-3xl font-extrabold text-green-700 mt-1">{liveTeamB.score || '178/3'}</p>
                                <p className="text-sm text-gray-600">{liveTeamB.overs || '(15.2 overs)'}</p>
                            </motion.div>
                        </div>

                        <motion.div
                            className="bg-white p-5 rounded-xl shadow-inner"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-gray-700 font-medium">Match Status: {matchResultWinner} won by </span>
                                {winningCaption ? (
                                    <motion.span
                                        className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-semibold"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                    >
                                        {winningCaption}
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        className="bg-green-400 text-black px-4 py-1 rounded-full text-sm font-semibold"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                    >
                                        Live
                                    </motion.span>
                                )}
                            </div>
                            {/* <div className="text-center">
                                <p className="font-semibold text-gray-800 text-lg">
                                    South Africa need <span className="text-red-500 font-bold">21 runs</span> from <span className="text-red-500 font-bold">34 balls</span>
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Current RR: <span className="font-semibold">11.60</span> • Required RR: <span className="font-semibold">3.70</span>
                                </p>
                            </div> */}
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        )}

        {activeTab === 'Match Results' && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-full min-h-[60vh] rounded-xl shadow-lg flex flex-col bg-white items-center justify-center overflow-hidden"
                style={{
                    background: 'linear-gradient(to bottom right, #ffe4e6, #ffc1cc)'
                }}
            >
                <FireworksCanvas />
                <div className="absolute top-4 right-4 z-30">
                    <motion.button
                        onClick={() => setActiveTab('Start Match')}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full shadow-md transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Next
                    </motion.button>
                </div>
                <div className="relative z-20 text-center p-8">
                    {/* Display winning team's flag here if available */}
                    {matchResultWinner && matchResultWinner !== 'Tie' && (
                        <div className="mb-4">
                            {liveTeamA.name === matchResultWinner && liveTeamA.flag && (
                                <img
                                    src={liveTeamA.flag}
                                    alt={`${liveTeamA.name} Flag`}
                                    className="w-24 h-24 mx-auto object-cover shadow-lg"
                                />
                            )}
                            {liveTeamB.name === matchResultWinner && liveTeamB.flag && (
                                <img
                                    src={liveTeamB.flag}
                                    alt={`${liveTeamB.name} Flag`}
                                    className="w-24 h-24 mx-auto object-cover shadow-lg"
                                />
                            )}
                        </div>
                    )}
                    <img
                        src={trophy}
                        alt="Trophy"
                        className="w-[300px] h-auto mb-8 drop-shadow-lg mx-auto"
                    />
                    {matchResultWinner && matchResultWinner !== 'Tie' && (
                        <h1 className="text-4xl text-green-400 font-bold drop-shadow-[0_0_10px_#22c55e]">{matchResultWinner} won the match!</h1>
                    )}
                    {matchResultWinner === 'Tie' && (
                        <h1 className="text-xl text-green-400 font-bold drop-shadow-[0_0_10px_#22c55e]">The match was a Tie!</h1>
                    )}
                    {!matchResultWinner && (
                        <p>No match results available yet.</p>
                    )}
                </div>
            </motion.div>
        )}


        {activeTab === 'Highlights' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <IPLCards setActiveTab={setActiveTab} />
          </motion.div>
        )}

        {activeTab === 'Match Analytics' && (
          <div className=" rounded-lg p-6 text-white">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700 mb-6">
              <button 
                className={`py-2 px-4 mr-2 ${activeAnalyticsTab === 'scorecard' ? 'border-b-2 border-yellow-500 font-semibold' : 'text-black'}`}
                onClick={() => setActiveAnalyticsTab('scorecard')}
              >
                Scorecard
              </button>
              <button 
                className={`py-2 px-4 mr-2 ${activeAnalyticsTab === 'wagonwheel' ? 'border-b-2 border-yellow-500 font-semibold' : 'text-black'}`}
                onClick={() => setActiveAnalyticsTab('wagonwheel')}
              >
                Wagon Wheel & Heat Map
              </button>
              <button 
                className={`py-2 px-4 ${activeAnalyticsTab === 'fallofwickets' ? 'border-b-2 border-yellow-500 font-semibold' : 'text-black'}`}
                onClick={() => setActiveAnalyticsTab('fallofwickets')}
              >
                Fall of Wickets
              </button>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeAnalyticsTab === 'scorecard' && (
                <>
                  {/* Worm Graph */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Worm Graph</h3>
                    <WormGraph />
                  </div>

                  {/* Bowling Economy */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Bowling Economy</h3>
                    <div className="h-48 bg-gray-600 rounded flex items-end justify-around p-4">
                      <div className="bg-teal-500 h-1/3 w-1/5 rounded-t-md"></div>
                      <div className="bg-teal-500 h-2/3 w-1/5 rounded-t-md"></div>
                      <div className="bg-teal-500 h-1/2 w-1/5 rounded-t-md"></div>
                      <div className="bg-teal-500 h-full w-1/5 rounded-t-md"></div>
                    </div>
                  </div>

                  {/* Runs Comparison */}
                  <div className="bg-gray-700 rounded-lg p-4 md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Runs Comparison</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={runsComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                        <XAxis dataKey="over" stroke="#cbd5e0" />
                        <YAxis stroke="#cbd5e0" />
                        <Tooltip contentStyle={{ backgroundColor: "#374151", color: "#fff" }} />
                        <Legend wrapperStyle={{ color: "#fff" }} />
                        <Line type="monotone" dataKey="teamA" stroke="#ffc658" strokeWidth={2} />
                        <Line type="monotone" dataKey="teamB" stroke="#a4add3" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {activeAnalyticsTab === 'wagonwheel' && (
                <>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Wagon Wheel</h3>
                    <WagonWheelChart data={wagonWheelData} />
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Batsman Heatmap</h3>
                    <BatsmanHeatmapChart data={batsmanHeatmapData} />
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Bowler Heatmap</h3>
                    <BowlerHeatmapChart data={bowlerHeatmapData} />
                  </div>
                </>
              )}

              {activeAnalyticsTab === 'fallofwickets' && (
                <>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Fall of Wickets Chart</h3>
                    <FallOfWicketsChart />
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Fall of Wickets Details</h3>
                    <FallOfWicketsDetails />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
      )}
    </div>
  );
};

export default FixtureGenerator;