import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '../../firebase'; // Adjust the path to your Firebase config
import { doc, getDoc } from 'firebase/firestore';

const Selection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [format, setFormat] = useState(null);
  const [rounds, setRounds] = useState([]); // Store rounds from Firebase
  const [currentPhase, setCurrentPhase] = useState(null);
  const [tournamentWinner, setTournamentWinner] = useState(null);
  const [tournamentId, setTournamentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tournament data from Firebase using tournamentId
  useEffect(() => {
    const fetchTournamentData = async () => {
      const { tournamentId: stateTournamentId, format: stateFormat } = location.state || {};

      if (!stateTournamentId) {
        setError('No tournament ID provided.');
        setLoading(false);
        return;
      }

      try {
        const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', stateTournamentId);
        const tournamentDoc = await getDoc(tournamentDocRef);
        if (tournamentDoc.exists()) {
          const data = tournamentDoc.data();
          console.log('Fetched tournament data from Firebase:', data);
          setTeams(data.teams || []);
          setFormat(data.format || stateFormat);
          setRounds(data.rounds || []);
          setCurrentPhase(data.currentPhase || null);
          setTournamentWinner(data.tournamentWinner || null);
          setTournamentId(stateTournamentId);
        } else {
          setError('Tournament not found in database.');
        }
      } catch (err) {
        console.error('Error fetching tournament data from Firebase:', err);
        setError('Failed to load tournament data.');
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, [location.state]);

  const getTournamentStructure = () => {
    const teamCount = teams.length;
    const structure = [];

    if (format === 'championship') {
      structure.push({ phase: 'final', roundName: 'Final', matchCount: 1 });
    } else if (format === 'eliminatorElite') {
      structure.push({ phase: 'eliminatorElite', roundName: 'Semifinals', matchCount: 2 });
      structure.push({ phase: 'final', roundName: 'Final', matchCount: 1 });
      structure.push({ phase: 'thirdPlace', roundName: 'Third Place', matchCount: 1 });
    } else if (format === 'playOff') {
      structure.push({ phase: 'quarter', roundName: 'Quarterfinals', matchCount: 4 });
      structure.push({ phase: 'semi', roundName: 'Semifinals', matchCount: 2 });
      structure.push({ phase: 'final', roundName: 'Final', matchCount: 1 });
    } else if (format === 'knockout') {
      structure.push({ phase: 'preQuarter', roundName: 'Pre-Quarterfinals', matchCount: 2 });
      structure.push({ phase: 'quarter', roundName: 'Quarterfinals', matchCount: 4 });
      structure.push({ phase: 'semi', roundName: 'Semifinals', matchCount: 2 });
      structure.push({ phase: 'final', roundName: 'Final', matchCount: 1 });
    } else if (format === 'superKnockout') {
      const byeCount = teamCount >= 16 ? 4 : teamCount === 15 ? 1 : teamCount > 10 ? teamCount - 10 : teamCount > 8 ? teamCount - 8 : 0;
      const competingTeams = teamCount - byeCount;
      if (teamCount >= 10) {
        structure.push({ phase: 'superKnockout', roundName: `Round of ${competingTeams}`, matchCount: Math.floor(competingTeams / 2) });
        if (teamCount >= 13) {
          structure.push({ phase: 'preQuarter', roundName: 'Pre-Quarterfinals', matchCount: 3 });
          structure.push({ phase: 'quarter', roundName: 'Quarterfinals', matchCount: 4 });
        } else {
          structure.push({ phase: 'quarter', roundName: 'Quarterfinals', matchCount: 4 });
        }
        structure.push({ phase: 'semi', roundName: 'Semifinals', matchCount: 2 });
        structure.push({ phase: 'final', roundName: 'Final', matchCount: 1 });
      } else if (teamCount >= 4) {
        structure.push({ phase: 'superKnockout', roundName: `Round of ${competingTeams}`, matchCount: Math.floor(competingTeams / 2) });
        structure.push({ phase: 'semi', roundName: 'Semifinals', matchCount: 2 });
        structure.push({ phase: 'final', roundName: 'Final', matchCount: 1 });
      } else {
        structure.push({ phase: 'superKnockout', roundName: 'Final', matchCount: 1 });
      }
    }

    return structure;
  };

  const getPhaseName = (phase, teamCount = teams.length) => {
    if (phase === 'superKnockout') {
      const byeCount = teamCount >= 16 ? 4 : teamCount === 15 ? 1 : teamCount > 10 ? teamCount - 10 : teamCount > 8 ? teamCount - 8 : 0;
      const competingTeams = teamCount - byeCount;
      return teamCount <= 2 ? 'Final' : `Round of ${competingTeams}`;
    }
    switch (phase) {
      case 'preQuarter': return 'Pre-Quarterfinals';
      case 'quarter': return 'Quarterfinals';
      case 'playOff': return 'Quarterfinals';
      case 'semi': return 'Semifinals';
      case 'eliminatorElite': return 'Semifinals';
      case 'final': return 'Final';
      case 'championship': return 'Final';
      case 'thirdPlace': return 'Third Place';
      default: return phase.charAt(0).toUpperCase() + phase.slice(1);
    }
  };

  const renderMatch = (match) => {
    const isCompleted = match.played;
    const hasBye = match.team1?.isBye || match.team2?.isBye;

    return (
      <motion.div
        key={match.id}
        className={`p-3 rounded-lg border-2 ${
          hasBye ? 'border-gray-400 bg-gray-100' :
          isCompleted ? 'border-green-600 bg-green-100' :
          'border-blue-400 bg-blue-100'
        } w-64`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center">
          <div className={`w-full p-2 mb-1 rounded ${
            match.winner === match.team1?.name ? 'font-bold text-green-700' :
            match.winner && match.winner !== match.team1?.name ? 'text-red-600' :
            'text-gray-800'
          }`}>
            {match.team1?.isBye ? 'BYE' : match.team1?.name || 'TBD'}
          </div>
          <div className="text-center font-bold">vs</div>
          <div className={`w-full p-2 mt-1 rounded ${
            match.winner === match.team2?.name ? 'font-bold text-green-700' :
            match.winner && match.winner !== match.team2?.name ? 'text-red-600' :
            'text-gray-800'
          }`}>
            {match.team2?.isBye ? 'BYE' : match.team2?.name || 'TBD'}
          </div>
          {isCompleted && match.winner && (
            <div className="mt-2 text-sm font-semibold text-center text-green-700">
              Winner: {match.winner}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderKnockoutTree = () => {
    if (!format || !teams.length || !rounds.length) {
      return (
        <div className="text-center p-4 text-red-600">
          Error: Unable to render tournament structure
        </div>
      );
    }

    const structure = getTournamentStructure();
    const getPhaseColor = (phase, isCurrent) => {
      const baseColor = (() => {
        switch (phase) {
          case 'final':
          case 'championship':
            return 'border-green-200 text-green-600';
          case 'semi':
          case 'eliminatorElite':
            return 'border-purple-200 text-purple-600';
          case 'quarter':
          case 'playOff':
            return 'border-yellow-200 text-yellow-600';
          case 'superKnockout':
          case 'preQuarter':
            return 'border-blue-200 text-blue-600';
          default:
            return 'border-gray-200 text-gray-600';
        }
      })();
      return isCurrent ? baseColor.replace('200', '400') : baseColor;
    };

    const getFutureMatches = (phase, index) => {
      const prevPhaseMatches = index === 0 ? [] : rounds.find((r) => r.stage === structure[index - 1].phase)?.matches || [];
      let matches = [];
      const matchCount = structure[index].matchCount;

      if (phase === 'preQuarter' && format === 'knockout') {
        matches = [
          { id: 'pre-quarter-1', team1: teams[8], team2: teams[11], round: 0, phase: 'preQuarter', winner: null, played: false },
          { id: 'pre-quarter-2', team1: teams[9], team2: teams[10], round: 0, phase: 'preQuarter', winner: null, played: false },
        ];
      } else if (phase === 'quarter' && format === 'knockout') {
        const preQuarterWinners = prevPhaseMatches.filter((m) => m.winner).map((m) => ({ name: m.winner }));
        matches = [
          { id: 'quarter-1', team1: teams[0], team2: preQuarterWinners[0] || { name: 'TBD' }, round: 1, phase: 'quarter', winner: null, played: false },
          { id: 'quarter-2', team1: teams[1], team2: preQuarterWinners[1] || { name: 'TBD' }, round: 1, phase: 'quarter', winner: null, played: false },
          { id: 'quarter-3', team1: teams[2], team2: teams[5], round: 1, phase: 'quarter', winner: null, played: false },
          { id: 'quarter-4', team1: teams[3], team2: teams[4], round: 1, phase: 'quarter', winner: null, played: false },
        ];
      } else if (phase === 'quarter' && format === 'superKnockout') {
        const prevWinners = prevPhaseMatches.filter((m) => m.winner).map((m) => ({ name: m.winner }));
        const byeTeams = teams.slice(0, teams.length >= 16 ? 4 : teams.length === 15 ? 1 : teams.length > 10 ? teams.length - 10 : teams.length - 8);
        const nextTeams = [...prevWinners, ...byeTeams].sort((a, b) => (a.seed || 0) - (b.seed || 0));
        matches = [
          { id: 'quarter-1', team1: nextTeams[0] || { name: 'TBD' }, team2: nextTeams[7] || { name: 'TBD' }, round: 1, phase: 'quarter', winner: null, played: false },
          { id: 'quarter-2', team1: nextTeams[1] || { name: 'TBD' }, team2: nextTeams[6] || { name: 'TBD' }, round: 1, phase: 'quarter', winner: null, played: false },
          { id: 'quarter-3', team1: nextTeams[2] || { name: 'TBD' }, team2: nextTeams[5] || { name: 'TBD' }, round: 1, phase: 'quarter', winner: null, played: false },
          { id: 'quarter-4', team1: nextTeams[3] || { name: 'TBD' }, team2: nextTeams[4] || { name: 'TBD' }, round: 1, phase: 'quarter', winner: null, played: false },
        ];
      } else if (phase === 'semi') {
        const prevWinners = prevPhaseMatches.filter((m) => m.winner).map((m) => ({ name: m.winner }));
        matches = [
          { id: 'semi-1', team1: prevWinners[0] || { name: 'Winner of Q1' }, team2: prevWinners[3] || { name: 'Winner of Q4' }, round: index, phase: 'semi', winner: null, played: false },
          { id: 'semi-2', team1: prevWinners[1] || { name: 'Winner of Q2' }, team2: prevWinners[2] || { name: 'Winner of Q3' }, round: index, phase: 'semi', winner: null, played: false },
        ];
      } else if (phase === 'final') {
        const prevWinners = prevPhaseMatches.filter((m) => m.winner).map((m) => ({ name: m.winner }));
        matches = [
          { id: 'final', team1: prevWinners[0] || { name: 'Winner of S1' }, team2: prevWinners[1] || { name: 'Winner of S2' }, round: index, phase: 'final', winner: null, played: false },
        ];
      } else if (phase === 'thirdPlace') {
        const prevLosers = prevPhaseMatches
          .filter((m) => m.winner && m.phase === 'eliminatorElite')
          .map((m) => (m.team1.name === m.winner ? m.team2 : m.team1));
        matches = [
          { id: 'third-place', team1: prevLosers[0] || { name: 'Loser of S1' }, team2: prevLosers[1] || { name: 'Loser of S2' }, round: index, phase: 'thirdPlace', winner: null, played: false },
        ];
      } else if (phase === 'championship') {
        matches = [
          { id: 'championship', team1: teams[0] || { name: 'TBD' }, team2: teams[1] || { name: 'TBD' }, round: index, phase: 'championship', winner: null, played: false },
        ];
      } else {
        for (let i = 0; i < matchCount; i++) {
          matches.push({
            id: `${phase}-${i + 1}`,
            team1: { name: 'TBD' },
            team2: { name: 'TBD' },
            round: index,
            phase,
            winner: null,
            played: false,
          });
        }
      }
      return matches;
    };

    return (
      <div className="w-full max-w-6xl mx-auto space-y-12">
        {structure.map((stage, index) => {
          const isCurrent = stage.phase === currentPhase;
          // For championship format, fetch matches from 'championship' stage when phase is 'final'
          const phaseMatches = format === 'championship' && stage.phase === 'final'
            ? rounds.find((r) => r.stage === 'championship')?.matches || []
            : rounds.find((r) => r.stage === stage.phase)?.matches || [];
          const hasPlayedMatches = phaseMatches.some((m) => m.played);
          const isFuture = !hasPlayedMatches && !isCurrent;
          const actualMatches = phaseMatches.length > 0 ? phaseMatches : getFutureMatches(stage.phase, index);

          return (
            <div
              key={stage.phase}
              className={`bg-white p-6 rounded-xl shadow-lg border-2 ${getPhaseColor(stage.phase, isCurrent)} ${
                isFuture ? 'opacity-50' : ''
              } relative`}
            >
              <h3 className={`text-2xl font-bold mb-4 ${getPhaseColor(stage.phase, isCurrent).split(' ')[1]}`}>
                {stage.roundName} {isCurrent && !tournamentWinner ? '(Current)' : ''}
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {actualMatches.map((match) => renderMatch(match))}
              </div>
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Fixtures</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-gray-800">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="p-3">Match ID</th>
                        <th className="p-3">Team 1</th>
                        <th className="p-3">Team 2</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Winner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actualMatches.map((match) => (
                        <tr key={match.id} className="border-b border-gray-300">
                          <td className="p-3">{match.id}</td>
                          <td className="p-3">{match.team1?.name || 'TBD'}</td>
                          <td className="p-3">{match.team2?.name || 'TBD'}</td>
                          <td className="p-3">
                            {match.played ? 'Played' : 'Scheduled'}
                          </td>
                          <td className="p-3">
                            {match.winner || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 text-gray-100 p-8 text-center">Loading tournament flowchart...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-8 text-center">
        <p>{error}</p>
        <button
          onClick={() => navigate('/TournamentPage')}
          className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-800">
          {format ? `${format.charAt(0).toUpperCase() + format.slice(1)} Flowchart` : 'Tournament Flowchart'}
        </h1>

        {tournamentWinner && (
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="bg-gradient-to-r from-yellow-400 to-white border-4 border-yellow-600 rounded-lg p-4 shadow-lg">
                <span className="text-2xl font-bold text-gray-800">
                  🏆 Champion: {tournamentWinner} 🏆
                </span>
              </div>
              <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-3xl">
                👑
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center">
          {renderKnockoutTree()}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/TournamentPage')}
            className="px-6 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Tournament Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default Selection;