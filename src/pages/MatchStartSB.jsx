import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import FireworksCanvas from '../components/sophita/HomePage/FireworksCanvas';
import { FaChevronDown, FaChevronUp, FaTrophy, FaHeart, FaCommentDots, FaShareAlt } from 'react-icons/fa';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Scatter } from 'recharts';
import logo from '../assets/sophita/HomePage/Picture3_2.png';
import trophy from '../assets/sophita/HomePage/trophy.png';
import advertisement1 from '../assets/sophita/HomePage/Advertisement1.webp';
import { useNavigate, useLocation } from 'react-router-dom';
import Startmatch from './StartmatchSB';
import nav from '../assets/kumar/right-chevron.png';
import placeholderFlag from '../assets/sophita/HomePage/flag.png';
import { db, storage, auth } from '../firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const IPLCards = ({ setActiveTab }) => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) {
          setError('Please log in to view highlights.');
          setLoading(false);
          return;
        }
        const userId = user.uid;
        const highlightsRef = query(collection(db, 'match_highlights'), where('userId', '==', userId));
        const snapshot = await getDocs(highlightsRef);
        const fetchedHighlights = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        fetchedHighlights.sort((a, b) => b.uploadedAt?.seconds - a.uploadedAt?.seconds);
        setHighlights(fetchedHighlights);
      } catch (err) {
        console.error('Error fetching highlights:', err);
        setError('Failed to load highlights.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePhotoUploadClick = () => {
    photoInputRef.current.click();
  };

  const handleVideoUploadClick = () => {
    videoInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (files.length === 0) {
      alert('No file selected.');
      return;
    }

    const file = files[0];
    const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
    if (!fileType) {
      alert('Unsupported file type. Please upload an image or video.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in to upload highlights.');
        return;
      }
      const userId = user.uid;

      const storagePath = `match_highlights/${userId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const highlightsRef = collection(db, 'match_highlights');
      await addDoc(highlightsRef, {
        url: downloadURL,
        type: fileType,
        title: file.name,
        uploadedAt: serverTimestamp(),
        userId: userId,
      });

      setHighlights(prev => [
        {
          url: downloadURL,
          type: fileType,
          title: file.name,
          uploadedAt: { seconds: Math.floor(Date.now() / 1000) },
          userId: userId,
        },
        ...prev,
      ]);

      alert(`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} uploaded successfully!`);
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload file.');
    }

    event.target.value = null;
  };

  const handleNextClick = () => {
    setActiveTab('Match Analytics');
  };

  if (loading) {
    return <div className="text-center text-white">Loading highlights...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 py-0">
      <div className="flex justify-center gap-6 mb-6 w-full max-w-md">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg"
          onClick={handlePhotoUploadClick}
        >
          Upload Photo
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg"
          onClick={handleVideoUploadClick}
        >
          Upload Video
        </button>
        <motion.button
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm sm:text-base flex-1"
          onClick={handleNextClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Next
        </motion.button>
        <input
          type="file"
          accept="image/*"
          ref={photoInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          type="file"
          accept="video/*"
          ref={videoInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-6 mb-12">
        {highlights.length === 0 ? (
          <p className="text-white text-lg">No highlights available for this tournament.</p>
        ) : (
          highlights.map((highlight, index) => (
            <motion.div
              key={highlight.id}
              className="bg-white rounded-2xl overflow-hidden shadow-md flex flex-col items-center"
              whileHover={{ scale: 1.05 }}
            >
              {highlight.type === 'image' ? (
                <img
                  src={highlight.url}
                  alt={highlight.title}
                  className="w-[300px] h-[220px] object-cover"
                />
              ) : (
                <video
                  src={highlight.url}
                  controls
                  className="w-[300px] h-[220px] object-cover"
                />
              )}
              <div className="flex justify-around items-center w-full py-3">
                <FaHeart className="text-red-500 text-2xl cursor-pointer" />
                <FaCommentDots className="text-black text-2xl cursor-pointer" />
                <FaShareAlt className="text-black text-2xl cursor-pointer" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const WormGraph = ({ matchData }) => {
  if (!matchData || !matchData.firstInnings || !matchData.secondInnings) {
    return <p className="text-white text-center">No match data available.</p>;
  }

  const { firstInnings, secondInnings } = matchData;

  const parseOvers = (overs) => {
    if (!overs) return 0;
    const [whole, decimal] = overs.split('.');
    return parseFloat(`${whole}.${decimal || 0}`);
  };

  const teamAData = [];
  const teamBData = [];
  const teamAWickets = [];
  const teamBWickets = [];

  const teamAOvers = parseOvers(firstInnings.overs);
  const teamBOvers = parseOvers(secondInnings.overs);

  const runsPerOverA = firstInnings.totalScore / (teamAOvers || 1);
  const runsPerOverB = secondInnings.totalScore / (teamBOvers || 1);

  for (let over = 0.1; over <= teamAOvers; over += 0.1) {
    const runs = Math.round(runsPerOverA * over);
    teamAData.push({
      over: parseFloat(over.toFixed(1)),
      runs: runs > firstInnings.totalScore ? firstInnings.totalScore : runs
    });
  }

  for (let over = 0.1; over <= teamBOvers; over += 0.1) {
    const runs = Math.round(runsPerOverB * over);
    teamBData.push({
      over: parseFloat(over.toFixed(1)),
      runs: runs > secondInnings.totalScore ? secondInnings.totalScore : runs
    });
  }

  firstInnings.playerStats.forEach(player => {
    if (player.wicketOver) {
      const over = parseOvers(player.wicketOver);
      const runsAtWicket = Math.round(runsPerOverA * over);
      teamAWickets.push({
        over: parseFloat(over.toFixed(1)),
        runs: runsAtWicket > firstInnings.totalScore ? firstInnings.totalScore : runsAtWicket,
        name: player.name
      });
    }
  });

  secondInnings.playerStats.forEach(player => {
    if (player.wicketOver) {
      const over = parseOvers(player.wicketOver);
      const runsAtWicket = Math.round(runsPerOverB * over);
      teamBWickets.push({
        over: parseFloat(over.toFixed(1)),
        runs: runsAtWicket > secondInnings.totalScore ? secondInnings.totalScore : runsAtWicket,
        name: player.name
      });
    }
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
        <XAxis
          dataKey="over"
          type="number"
          domain={[0.1, Math.max(teamAOvers, teamBOvers)]}
          stroke="#cbd5e0"
          label={{ value: 'Over', position: 'bottom', fill: '#fff' }}
          tickFormatter={(value) => value.toFixed(1)}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#cbd5e0"
          label={{ value: 'Runs', position: 'insideLeft', angle: -90, fill: '#fff' }}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#374151', color: '#fff' }}
          formatter={(value, name, props) => {
            if (name.includes('Wickets')) {
              return [`${props.payload.name} out`, null];
            }
            return [value, name];
          }}
        />
        <Legend
          wrapperStyle={{ color: '#fff', marginBottom: '20px' }}
        />
        <Line
          type="monotone"
          dataKey="runs"
          data={teamAData}
          name={firstInnings.teamName}
          stroke="#3B82F6"
          strokeWidth={2}
          dot={false}
        />
        <Scatter
          data={teamAWickets}
          name={`${firstInnings.teamName} Wickets`}
          fill="#FF0000"
          shape="cross"
          size={8}
        />
        <Line
          type="monotone"
          dataKey="runs"
          data={teamBData}
          name={secondInnings.teamName}
          stroke="#F97316"
          strokeWidth={2}
          dot={false}
        />
        <Scatter
          data={teamBWickets}
          name={`${secondInnings.teamName} Wickets`}
          fill="#FF0000"
          shape="cross"
          size={8}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const Scorecard = ({ matchData }) => {
  if (!matchData || !matchData.firstInnings || !matchData.secondInnings) {
    return <p className="text-white text-center">No match data available.</p>;
  }

  const { firstInnings, secondInnings, teamA, teamB } = matchData;
  const [activeTeam, setActiveTeam] = useState('teamA');

  const getTeamScorecard = (team, innings, opponentInnings) => {
    const playedPlayers = innings.playerStats.filter(
      player => player.runs > 0 || player.balls > 0 || player.wicketOver
    );

    const unplayedPlayers = innings.playerStats
      .filter(player => player.runs === 0 && player.balls === 0 && !player.wicketOver)
      .map(player => player.name)
      .join(', ');

    const bowlers = opponentInnings.bowlerStats.filter(bowler => bowler.oversBowled !== '0.0');

    const getFifties = (runs) => (runs >= 50 && runs < 100 ? 1 : 0);
    const getHundreds = (runs) => (runs >= 100 ? 1 : 0);

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-4 text-white">{team.name} Innings</h3>
        <table className="min-w-full divide-y divide-gray-700 mb-4">
          <thead>
            <tr className="bg-gray-800">
              <th className="px-4 py-2 text-left text-white">Batsman</th>
              <th className="px-4 py-2 text-right text-white">Runs</th>
              <th className="px-4 py-2 text-right text-white">Balls</th>
              <th className="px-4 py-2 text-right text-white">4s</th>
              <th className="px-4 py-2 text-right text-white">6s</th>
              <th className="px-4 py-2 text-right text-white">50s</th>
              <th className="px-4 py-2 text-right text-white">100s</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {playedPlayers.map((player, index) => (
              <tr key={player.index || index} className={index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-600'}>
                <td className="px-4 py-2 text-white">{player.name}{player.wicketOver ? ' (out)' : ''}</td>
                <td className="px-4 py-2 text-right text-white">{player.runs}</td>
                <td className="px-4 py-2 text-right text-white">{player.balls}</td>
                <td className="px-4 py-2 text-right text-white">{player.fours}</td>
                <td className="px-4 py-2 text-right text-white">{player.sixes}</td>
                <td className="px-4 py-2 text-right text-white">{getFifties(player.runs)}</td>
                <td className="px-4 py-2 text-right text-white">{getHundreds(player.runs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {unplayedPlayers && (
          <p className="text-white mb-4">
            <span className="font-semibold">Next to Bat: </span>{unplayedPlayers}
          </p>
        )}
        <h4 className="text-md font-semibold mb-2 text-white">Bowling ({innings.teamName})</h4>
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr className="bg-gray-800">
              <th className="px-4 py-2 text-left text-white">Bowler</th>
              <th className="px-4 py-2 text-right text-white">Overs</th>
              <th className="px-4 py-2 text-right text-white">Runs</th>
              <th className="px-4 py-2 text-right text-white">Wickets</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {bowlers.length > 0 ? (
              bowlers.map((bowler, index) => (
                <tr key={bowler.index || index} className={index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-600'}>
                  <td className="px-4 py-2 text-white">{bowler.name}</td>
                  <td className="px-4 py-2 text-right text-white">{bowler.oversBowled}</td>
                  <td className="px-4 py-2 text-right text-white">{bowler.runsConceded}</td>
                  <td className="px-4 py-2 text-right text-white">{bowler.wickets}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-2 text-center text-white">No bowling data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex border-b border-gray-700 mb-4">
        <button
          className={`flex-1 py-2 text-white font-semibold ${activeTeam === 'teamA' ? 'bg-gray-800' : 'bg-gray-600'}`}
          onClick={() => setActiveTeam('teamA')}
        >
          {teamA.name}
        </button>
        <button
          className={`flex-1 py-2 text-white font-semibold ${activeTeam === 'teamB' ? 'bg-gray-800' : 'bg-gray-600'}`}
          onClick={() => setActiveTeam('teamB')}
        >
          {teamB.name}
        </button>
      </div>
      {activeTeam === 'teamA' && getTeamScorecard(teamA, firstInnings, secondInnings)}
      {activeTeam === 'teamB' && getTeamScorecard(teamB, secondInnings, firstInnings)}
    </div>
  );
};

const FixtureGenerator = () => {
  const [selectedTeamA, setSelectedTeamA] = useState('');
  const [selectedTeamB, setSelectedTeamB] = useState('');
  const [liveTeamA, setLiveTeamA] = useState({ name: 'Team A', flag: placeholderFlag, score: '0/0', overs: '(0.0)' });
  const [liveTeamB, setLiveTeamB] = useState({ name: 'Team B', flag: placeholderFlag, score: '0/0', overs: '(0.0)' });
  const [winningCaption, setWinningCaption] = useState('');
  const [activeTab, setActiveTab] = useState('Start Match');
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('scorecard');
  const [generatedFixtures, setGeneratedFixtures] = useState([]);
  const [showFixtures, setShowFixtures] = useState(false);
  const [matchResultWinner, setMatchResultWinner] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [matchDateTime, setMatchDateTime] = useState('');
  const [hasViewedResults, setHasViewedResults] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { tournamentName } = location.state || {};
  console.log(tournamentName);

  // Reset states for new sessions on mount
  useEffect(() => {
    setMatchData(null);
    setLiveTeamA({ name: 'Team A', flag: placeholderFlag, score: '0/0', overs: '(0.0)' });
    setLiveTeamB({ name: 'Team B', flag: placeholderFlag, score: '0/0', overs: '(0.0)' });
    setWinningCaption('');
    setMatchDateTime('');
    setMatchResultWinner(null);
    setHasViewedResults(false);

    // Clean up on unmount
    return () => {
      setMatchData(null);
      setLiveTeamA({ name: 'Team A', flag: placeholderFlag, score: '0/0', overs: '(0.0)' });
      setLiveTeamB({ name: 'Team B', flag: placeholderFlag, score: '0/0', overs: '(0.0)' });
      setWinningCaption('');
      setMatchDateTime('');
      setMatchResultWinner(null);
      setHasViewedResults(false);
    };
  }, []);

  // Fetch Firestore data only after viewing Match Results tab and with relevant location.state
  useEffect(() => {
    if (activeTab === 'Match Results') {
      setHasViewedResults(true);
    }

    if (!hasViewedResults || !location.state || (!location.state.teamA && !location.state.teamB && !location.state.winner)) {
      return;
    }

    const q = query(collection(db, 'scoringpage'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latestMatch = snapshot.docs[0].data();
        if (latestMatch.matchResult) {
          setMatchData(latestMatch);

          setLiveTeamA({
            name: latestMatch.teamA.name,
            flag: latestMatch.teamA.flagUrl || placeholderFlag,
            score: `${latestMatch.teamA.totalScore}/${latestMatch.teamA.wickets}`,
            overs: `(${latestMatch.teamA.overs} overs)`,
          });
          setLiveTeamB({
            name: latestMatch.teamB.name,
            flag: latestMatch.teamB.flagUrl || placeholderFlag,
            score: `${latestMatch.teamB.totalScore}/${latestMatch.teamB.wickets}`,
            overs: `(${latestMatch.teamB.overs} overs)`,
          });

          if (latestMatch.createdAt) {
            const date = latestMatch.createdAt.toDate();
            setMatchDateTime(
              date.toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            );
          }

          if (latestMatch.matchResult) {
            if (latestMatch.matchResult === 'Tie') {
              setWinningCaption('Match Tied');
              setMatchResultWinner('Tie');
            } else if (latestMatch.teamA.result === 'Win') {
              const runDiff = latestMatch.teamA.totalScore - latestMatch.teamB.totalScore;
              if (runDiff > 0) {
                setWinningCaption(`${latestMatch.teamA.name} won by ${runDiff} runs`);
                setMatchResultWinner(latestMatch.teamA.name);
              }
            } else if (latestMatch.teamB.result === 'Win') {
              const wicketsRemaining = 10 - latestMatch.teamB.wickets;
              if (latestMatch.teamB.totalScore >= latestMatch.teamA.totalScore) {
                setWinningCaption(`${latestMatch.teamB.name} won by ${wicketsRemaining} wickets`);
                setMatchResultWinner(latestMatch.teamB.name);
              }
            }
          } else {
            setWinningCaption('Live');
            setMatchResultWinner(null);
          }
        }
      }
    }, (error) => {
      console.error('Error fetching match data:', error);
    });

    return () => unsubscribe();
  }, [hasViewedResults, activeTab, location.state]);

  // Handle navigation state for team selection and other data
  useEffect(() => {
    if (location.state) {
      if (location.state.activeTab) {
        setActiveTab(location.state.activeTab);
      }
      if (location.state.winner && hasViewedResults) {
        setMatchResultWinner(location.state.winner);
        setWinningCaption(location.state.winningDifference || '');
      }
      if (location.state.teamA && location.state.teamB) {
        setLiveTeamA({
          name: location.state.teamA.name,
          flag: location.state.teamA.flagUrl || placeholderFlag,
          score: hasViewedResults ? `${location.state.teamA.score || 0}/${location.state.teamA.wickets || 0}` : '0/0',
          overs: hasViewedResults
            ? location.state.teamA.balls
              ? `(${Math.floor(location.state.teamA.balls / 6)}.${location.state.teamA.balls % 6} overs)`
              : `(${location.state.teamA.overs || '0.0'} overs)`
            : '(0.0)',
        });
        setLiveTeamB({
          name: location.state.teamB.name,
          flag: location.state.teamB.flagUrl || placeholderFlag,
          score: hasViewedResults ? `${location.state.teamB.score || 0}/${location.state.teamB.wickets || 0}` : '0/0',
          overs: hasViewedResults
            ? location.state.teamB.balls
              ? `(${Math.floor(location.state.teamB.balls / 6)}.${location.state.teamB.balls % 6} overs)`
              : `(${location.state.teamB.overs || '0.0'} overs)`
            : '(0.0)',
        });
      } else if (location.state.teamA) {
        setLiveTeamA(prevState => ({
          ...prevState,
          name: location.state.teamA.name,
          flag: location.state.teamA.flagUrl || placeholderFlag,
        }));
      } else if (location.state.teamB) {
        setLiveTeamB(prevState => ({
          ...prevState,
          name: location.state.teamB.name,
          flag: location.state.teamB.flagUrl || placeholderFlag,
        }));
      }
    }
  }, [location.state, hasViewedResults]);

  const handleTeamsSelected = (teamAData, teamBData) => {
    setLiveTeamA({
      name: teamAData.name,
      flag: teamAData.flagUrl || placeholderFlag,
      score: teamAData.score || '0/0',
      overs: teamAData.overs || '(0.0)'
    });
    setLiveTeamB({
      name: teamBData.name,
      flag: teamBData.flagUrl || placeholderFlag,
      score: teamBData.score || '0/0',
      overs: teamBData.overs || '(0.0)'
    });
  };

  const teamsFromTournament = location.state?.selectedTeams || [];
  const defaultTeams = ['India', 'Australia', 'England', 'Pakistan', 'New Zealand', 'Netherlands', 'South Africa'];

  const generateFixtures = () => {
    if (!selectedTeamA || !selectedTeamB) {
      alert('Please select both teams');
      return;
    }
    if (selectedTeamA === selectedTeamB) {
      alert('Please select different teams for the fixture');
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

  const handleFixtureNextClick = () => {
    setActiveTab('Start Match');
  };

  const handleBack = () => {
    switch (activeTab) {
      case 'Start Match':
        navigate('/landingpage');
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
        navigate(-1);
        break;
    }
  };

  const groupedFixtures = generatedFixtures.reduce((acc, fixture) => {
    const round = fixture.round || 'Round 1';
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(fixture);
    return acc;
  }, {});

  const allTabs = ['Start Match', 'Live Score', 'Match Results', 'Highlights', 'Match Analytics'];

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-blue-200 overflow-x-hidden">
      <header className="w-screen shadow-md">
        <div className="w-full max-w-6xl py-4 flex justify-between items-center">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center">
              <motion.img
                src={logo}
                alt="Cricklytics Logo"
                className="h-7 w-7 md:h-10 object-contain block select-none"
                whileHover={{ scale: 1.05 }}
              />
              <h1 className="text-2xl font-bold text-gray-800 pl-3">Cricklytics</h1>
            </div>
            <img
              src={nav}
              alt="Back"
              loading="lazy"
              className="w-10 h-10 -scale-x-100 cursor-pointer mt-[5px] ml-[5px]"
              onClick={handleBack}
            />
          </div>
          <div className="flex items-center overflow-x-auto mt-8 md:mt-8 -ml-20 md:-ml-20">
            <ul className="flex gap-x-2 sm:gap-x-3 md:gap-x-4 lg:gap-x-5">
              {allTabs.map((tab) => (
                <li key={tab} className="flex-shrink-0">
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
              ))}
            </ul>
          </div>
        </div>
      </header>

      {activeTab === 'Start Match' ? (
        <Startmatch
          initialTeamA={selectedTeamA}
          initialTeamB={selectedTeamB}
          origin="/match-start-sb"
          onTeamsSelectedForLiveScore={handleTeamsSelected}
          setActiveTab={setActiveTab}
          tournamentName={tournamentName}
        />
      ) : (
        <main className="w-full max-w-7xl px-4 sm:px-8 py-8 mx-auto">
          {activeTab === 'Live Score' && (
            <div className="w-full">
              {(liveTeamA.name !== 'Team A' || liveTeamB.name !== 'Team B') ? (
                <motion.div
                  className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl mx-auto mt-10"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6">
                    <h3 className="text-2xl font-bold">{liveTeamA.name} vs {liveTeamB.name}</h3>
                    <p className="text-sm opacity-90 mt-1">{matchDateTime || 'No date available'}</p>
                  </div>
                  <div className="p-6 bg-gray-50">
                    <div className="flex justify-around items-center mb-6">
                      <motion.div
                        className="text-center"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="w-20 h-20 mx-auto mb-2 rounded-full flex items-center justify-center shadow-md overflow-hidden">
                          {liveTeamA.flag ? (
                            <img
                              src={liveTeamA.flag}
                              alt={`${liveTeamA.name} Flag`}
                              className="w-full h-full object-cover"
                              onError={(e) => (e.target.src = placeholderFlag)}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600">No Flag</span>
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-xl text-gray-800">{liveTeamA.name}</h4>
                        <p className="text-3xl font-extrabold text-blue-700 mt-1">{liveTeamA.score}</p>
                        <p className="text-sm text-gray-600">{liveTeamA.overs}</p>
                      </motion.div>
                      <div className="text-3xl font-bold text-gray-600 px-6">vs</div>
                      <motion.div
                        className="text-center"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="w-20 h-20 mx-auto mb-2 rounded-full flex items-center justify-center shadow-md overflow-hidden">
                          {liveTeamB.flag ? (
                            <img
                              src={liveTeamB.flag}
                              alt={`${liveTeamB.name} Flag`}
                              className="w-full h-full object-cover"
                              onError={(e) => (e.target.src = placeholderFlag)}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600">No Flag</span>
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-xl text-gray-800">{liveTeamB.name}</h4>
                        <p className="text-3xl font-extrabold text-green-700 mt-1">{liveTeamB.score}</p>
                        <p className="text-sm text-gray-600">{liveTeamB.overs}</p>
                      </motion.div>
                    </div>
                    <motion.div
                      className="bg-white p-5 rounded-xl shadow-inner"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-700 font-medium">Match Status:</span>
                        <motion.span
                          className={`px-4 py-1 rounded-full text-sm font-semibold ${
                            winningCaption === 'Live'
                              ? 'bg-green-600 text-white'
                              : 'bg-yellow-400 text-black'
                          }`}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          {winningCaption || 'Live'}
                        </motion.span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center text-white text-lg">
                  No live match data available. Please start a match to view live scores.
                </div>
              )}
            </div>
          )}

          {activeTab === 'Match Results' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-full min-h-[60vh] rounded-xl shadow-lg flex flex-col bg-white items-center overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom right, #ffe4e6, #ffc1cc)',
              }}
            >
              <FireworksCanvas />
              <div className="relative z-20 text-center p-8 flex flex-col items-center justify-between h-full w-full">
                <div>
                  {/* {matchData && matchData.matchResult && matchData.matchResult !== 'Tie' && (
                    <div className="mb-4">
                      {liveTeamA.name === matchData.matchResult ? (
                        <div className="w-24 h-24 mx-auto flex items-center justify-center rounded-full shadow-lg overflow-hidden">
                          <img
                            src={liveTeamA.flag}
                            alt={`${liveTeamA.name} Flag`}
                            className="w-full h-full object-cover"
                            onError={(e) => (e.target.src = placeholderFlag)}
                          />
                        </div>
                      ) : liveTeamB.name === matchData.matchResult ? (
                        <div className="w-24 h-24 mx-auto flex items-center justify-center rounded-full shadow-lg overflow-hidden">
                          <img
                            src={liveTeamB.flag}
                            alt={`${liveTeamB.name} Flag`}
                            className="w-full h-full object-cover"
                            onError={(e) => (e.target.src = placeholderFlag)}
                          />
                        </div>
                      ) : null}
                    </div>
                  )} */}
                  <img
                    src={trophy}
                    alt="Trophy"
                    className="w-[300px] h-auto mb-8 drop-shadow-lg mx-auto"
                  />
                  {matchData && matchData.matchResult && matchData.matchResult !== 'Tie' && (
                    <h1 className="text-4xl text-green-400 font-bold drop-shadow-[0_0_10px_#22c55e]">
                      <span className="inline-flex items-center">
                        <img
                          src={liveTeamA.name === matchData.matchResult ? liveTeamA.flag : liveTeamB.flag}
                          alt={`${matchData.matchResult} Flag`}
                          className="w-10 h-10 mr-2 object-cover rounded-full aspect-square"
                          onError={(e) => (e.target.src = placeholderFlag)}
                        />
                        {matchData.matchResult} won the match!
                      </span>
                    </h1>
                  )}
                  {matchData && matchData.matchResult === 'Tie' && (
                    <h1 className="text-xl text-green-400 font-bold drop-shadow-[0_0_10px_#22c55e]">
                      The match was a Tie!
                    </h1>
                  )}
                  {!matchData && (
                    <p>No match results available yet.</p>
                  )}
                </div>
                <div className="self-end">
                  <motion.button
                    onClick={() => setActiveTab('Highlights')}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full shadow-md transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next
                  </motion.button>
                </div>
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
            <div className="rounded-lg p-6 text-white">
              <div className="flex border-b border-gray-700 mb-6">
                <button
                  className={`py-2 px-4 mr-2 ${
                    activeAnalyticsTab === 'scorecard'
                      ? 'border-b-2 border-blue-600 font-semibold'
                      : 'text-blue-400'
                  }`}
                  onClick={() => setActiveAnalyticsTab('scorecard')}
                >
                  Scorecard
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeAnalyticsTab === 'scorecard' && (
                  <>
                    <div className="bg-gray-700 rounded-lg p-4 md:col-span-2">
                      <h3 className="text-lg font-semibold mb-4">Worm Graph</h3>
                      <WormGraph matchData={matchData} />
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4 md:col-span-2">
                      <h3 className="text-lg font-semibold mb-4">Scorecard</h3>
                      <Scorecard matchData={matchData} />
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