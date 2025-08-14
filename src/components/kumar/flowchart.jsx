import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
//hello
const TournamentSplitter = {
  getOptimalGroups(teamCount) {
    if (teamCount === 4) return { groupCount: 1, size: 4 };
    if (teamCount === 7) return { groupCount: 2, size: 3, removed: 1 };
    if (teamCount === 9) return { groupCount: 3, size: 3 };
    if (teamCount === 10) return { groupCount: 2, size: 5 };
    if (teamCount === 15) return { groupCount: 3, size: 5 };
    if (teamCount === 8) return { groupCount: 2, size: 4 };
    if (teamCount === 12) return { groupCount: 3, size: 4 };
    if (teamCount < 10) {
      const groupCount = teamCount <= 6 ? 2 : 3;
      const size = Math.ceil(teamCount / groupCount);
      return { groupCount, size };
    }

    const idealSizes = [15, 12, 10, 5, 4];
    const preferredGroupCounts = [3, 2];

    for (const groupCount of preferredGroupCounts) {
      for (const size of idealSizes) {
        if (teamCount === groupCount * size) {
          return { groupCount, size };
        }
      }
    }

    if (teamCount > 60) {
      for (let count = 3; count <= 6; count++) {
        const size = Math.ceil(teamCount / count);
        if (size <= 15 && teamCount / count === size) {
          return { groupCount: count, size };
        }
      }
    }

    for (let count = 2; count <= 3; count++) {
      const size = teamCount / count;
      if (Number.isInteger(size) && size >= 4 && size <= 15) {
        return { groupCount: count, size };
      }
    }

    if (((teamCount - 1) % 2 === 0 || (teamCount - 1) % 3 === 0)) {
      const remainingTeams = teamCount - 1;
      for (const count of [2, 3]) {
        const size = remainingTeams / count;
        if (Number.isInteger(size) && size >= 3 && size <= 15) {
          return { groupCount: count, size, removed: 1 };
        }
      }
    }

    const baseSize = Math.floor(teamCount / 3);
    const remainder = teamCount % 3;
    const groups = Array(3).fill(baseSize);
    for (let i = 0; i < remainder; i++) groups[i]++;
    return { groupCount: 3, groups };
  }
};

const RoundRobinScheduler = {
  generateRoundRobin(teams) {
    const numTeams = teams.length;
    const rounds = [];
    const teamIndices = Array.from({ length: numTeams }, (_, i) => i);
    
    if (numTeams % 2 === 1) {
      teamIndices.push(-1);
    }
    
    const n = teamIndices.length;
    const totalRounds = numTeams % 2 === 0 ? numTeams - 1 : numTeams;
    const playedMatches = new Set();

    for (let round = 0; round < totalRounds; round++) {
      const matches = [];
      for (let i = 0; i < n / 2; i++) {
        const t1 = teamIndices[i];
        const t2 = teamIndices[n - 1 - i];
        const matchKey = [Math.min(t1, t2), Math.max(t1, t2)].join('-');
        if (t1 !== -1 && t2 !== -1 && !playedMatches.has(matchKey)) {
          matches.push([teams[t1], teams[t2]]);
          playedMatches.add(matchKey);
        }
      }
      
      if (matches.length > 0) {
        rounds.push({
          round: round + 1,
          matches,
          bye: numTeams % 2 === 1 ? teams[teamIndices.findIndex(i => !matches.flat().map(t => t.id).includes(teams[i]?.id))] : null
        });
      }
      
      const first = teamIndices[1];
      for (let i = 1; i < n - 1; i++) {
        teamIndices[i] = teamIndices[i + 1];
      }
      teamIndices[n - 1] = first;
    }
    
    return rounds;
  }
};

const Flowchart = ({ teams, groups, currentPhase, matches, groupResults, tournamentWinner, oddTeam, phaseHistory }) => {
  const navigate = useNavigate();

  const getGroupStandings = (groupIndex, phase = 'league') => {
    if (!groups[groupIndex]) return [];
    return groups[groupIndex]
      .map(team => ({
        ...team,
        ...groupResults[phase]?.[team.id] || {}
      }))
      .sort((a, b) => (b.points || 0) - (a.points || 0) || (b.netRunRate || 0) - (a.netRunRate || 0) || (b.wins || 0) - (a.wins || 0));
  };

  const getExpectedTeamCount = (phase) => {
    if (phase === 'league') {
      return teams.length;
    } else if (phase === 'quarter') {
      if (teams.length === 7) {
        const splitResult = TournamentSplitter.getOptimalGroups(teams.length);
        const groupCount = splitResult.groups ? splitResult.groups.length : splitResult.groupCount;
        return groupCount * 2 + (splitResult.removed ? 1 : 0);
      }
      const splitResult = TournamentSplitter.getOptimalGroups(teams.length);
      const groupCount = splitResult.groups ? splitResult.groups.length : splitResult.groupCount;
      const teamsPerGroup = teams.length === 9 ? 2 : 3;
      return groupCount * teamsPerGroup + (splitResult.removed ? 1 : 0);
    } else if (phase === 'super') {
      const splitResult = TournamentSplitter.getOptimalGroups(teams.length);
      const groupCount = splitResult.groups ? splitResult.groups.length : splitResult.groupCount;
      const teamsPerGroup = teams.length === 9 ? 2 : 3;
      return groupCount * teamsPerGroup + (splitResult.removed ? 1 : 0);
    } else if (phase === 'semi') {
      return teams.length === 7 ? 4 : getExpectedTeamCount('quarter') > 4 ? 4 : 0;
    } else if (phase === 'final') {
      return 2;
    } else if (phase === 'winner') {
      return 1;
    }
    return 0;
  };

  const getQualifiedTeams = (phase) => {
    if (phase === 'league') {
      return teams.map(team => ({ ...team, name: team.name }));
    } else if (phase === 'quarter' && teams.length === 7) {
      if (currentPhase !== 'league') {
        return groups[0]?.map(team => ({ ...team, name: team.name })) || [];
      }
      const quarterTeamCount = getExpectedTeamCount('quarter');
      return Array(quarterTeamCount).fill().map((_, i) => ({
        id: `placeholder-quarter-${i}`,
        name: oddTeam && i === quarterTeamCount - 1 ? oddTeam.name : 'Team'
      }));
    } else if (phase === 'super') {
      if (currentPhase !== 'league') {
        return groups[0]?.map(team => ({ ...team, name: team.name })) || [];
      }
      const superTeamCount = getExpectedTeamCount('super');
      return Array(superTeamCount).fill().map((_, i) => ({
        id: `placeholder-super-${i}`,
        name: oddTeam && i === superTeamCount - 1 ? oddTeam.name : 'Team'
      }));
    } else if (phase === 'semi') {
      if (currentPhase === 'semi' || currentPhase === 'final') {
        return getGroupStandings(0, teams.length === 7 ? 'quarter' : 'super').slice(0, 4).map(team => ({ ...team, name: team.name }));
      }
      return getExpectedTeamCount('semi') > 0
        ? Array(4).fill().map((_, i) => ({ id: `placeholder-semi-${i}`, name: 'Team' }))
        : [];
    } else if (phase === 'final') {
      if (currentPhase === 'final') {
        if (phaseHistory.includes('semi')) {
          return matches
            .filter(m => m.phase === 'semi' && m.winner)
            .map(m => teams.find(t => t.id === m.winner))
            .map(team => ({ ...team, name: team.name }));
        } else {
          return getGroupStandings(0, phaseHistory.includes('super') ? 'super' : 'league')
            .slice(0, 2)
            .map(team => ({ ...team, name: team.name }));
        }
      }
      return Array(2).fill().map((_, i) => ({ id: `placeholder-final-${i}`, name: 'Team' }));
    } else if (phase === 'winner') {
      if (tournamentWinner) {
        return [{ ...teams.find(t => t.id === tournamentWinner), name: teams.find(t => t.id === tournamentWinner).name }];
      }
      return [{ id: 'placeholder-winner', name: 'Team' }];
    }
    return [];
  };

  const getPhaseName = (phase) => {
    if (phase === 'league') return 'Group Stage';
    if (phase === 'super') return `Super ${getExpectedTeamCount('super') || 'X'}`;
    if (phase === 'quarter') return 'Quarter-Final';
    if (phase === 'semi') return 'Semi-Final';
    if (phase === 'final') return 'Final';
    if (phase === 'winner') return 'Winner';
    return phase;
  };

  const renderTreeNode = (team, level, index, isOddTeam = false) => (
    <motion.div
      key={`${level}-${index}`}
      className={`p-3 m-2 rounded-lg text-center text-white ${
        isOddTeam ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
        level === 'league' ? 'bg-gradient-to-r from-blue-700 to-blue-500' :
        level === 'super' ? 'bg-gradient-to-r from-green-700 to-green-500' :
        level === 'quarter' ? 'bg-gradient-to-r from-teal-700 to-teal-500' :
        level === 'semi' ? 'bg-gradient-to-r from-orange-700 to-orange-500' :
        level === 'final' ? 'bg-gradient-to-r from-purple-700 to-purple-500' :
        level === 'winner' ? 'bg-gradient-to-r from-red-700 to-red-500' :
        'bg-gradient-to-r from-gray-700 to-gray-500'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {team ? team.name : 'TBD'}
    </motion.div>
  );

  const renderTreeLevel = (teams, levelName, level, matchesInfo = null) => (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-purple-400 mb-2">{levelName}</h3>
      <div className="flex flex-wrap justify-center">
        {teams.length > 0 ? 
          teams.map((team, index) => renderTreeNode(team, level, index, team?.id === oddTeam?.id)) : 
          <div className="text-gray-400">TBD</div>
        }
      </div>
      {matchesInfo && (
        <div className="mt-2 text-sm text-gray-300 text-center">
          {matchesInfo}
        </div>
      )}
    </div>
  );

  const phases = (teams.length === 7 ? ['league', 'quarter', 'semi', 'final', 'winner'] : ['league', 'super', 'quarter', 'semi', 'final', 'winner']).filter(phase => 
    phase !== 'semi' || getExpectedTeamCount(teams.length === 7 ? 'quarter' : 'super') > 4
  );
  const levels = phases.map(phase => ({
    teams: getQualifiedTeams(phase),
    name: getPhaseName(phase),
    key: phase,
    matchesInfo: phase === 'league' ? `Groups: ${(groups || []).map((_, i) => `Group ${i + 1} (${getGroupStandings(i).length} teams)`).join(', ')}${oddTeam ? ', Odd Team advances to Quarter-Final' : ''}` :
                 phase === 'super' ? `${getExpectedTeamCount('super')} teams${oddTeam ? ' (including Odd Team)' : ''}` :
                 phase === 'quarter' ? teams.length === 7 ? 'Top 4 teams from League + Odd Team' : 'Top 4 teams from Super stage' :
                 phase === 'semi' ? teams.length === 7 ? 'Top 4 teams from Quarter-Final' : 'Top 4 teams from Super stage' :
                 phase === 'final' ? getExpectedTeamCount(teams.length === 7 ? 'quarter' : 'super') > 4 ? 'Winners from Semi-Final' : 'Top 2 teams from Super stage' :
                 phase === 'winner' ? 'Tournament Champion' : ''
  }));

  const handleStartMatch = () => {
    navigate('/match-start-rr', {
      state: {
        teams,
        groups,
        matches,
        currentPhase,
        currentGroupIndex,
        origin: '/tournament-bracket',
        targetTab: 'Fixture Generator'
      }
    });
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-xl">
      <h2 className="text-2xl font-bold text-center mb-6 text-purple-400">Tournament Flowchart</h2>
      <button
        onClick={handleStartMatch}
        className="mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
      >
        Start Match
      </button>
      {levels.length > 0 ? levels.map(level => renderTreeLevel(level.teams, level.name, level.key, level.matchesInfo)) : (
        <div className="text-gray-400 text-center">No rounds played yet</div>
      )}
    </div>
  );
};

const TournamentBracket = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [format, setFormat] = useState(null);
  const [matches, setMatches] = useState([]);
  const [currentPhase, setCurrentPhase] = useState('league');
  const [groupResults, setGroupResults] = useState({});
  const [tournamentWinner, setTournamentWinner] = useState(null);
  const [groups, setGroups] = useState([]);
  const [oddTeam, setOddTeam] = useState(null);
  const [activeTab, setActiveTab] = useState('standings');
  const [phaseHistory, setPhaseHistory] = useState([]);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [historicalGroupResults, setHistoricalGroupResults] = useState({});
  const [selectedStandingsPhase, setSelectedStandingsPhase] = useState('league');
  const [tournamentName, setTournamentName] = useState(null); // Add this at the top with other useState declarations

  useEffect(() => {
    if (location.state?.teams) {
      const initialTeams = location.state.teams.map((t, i) => ({
        ...t,
        id: t.id || generateUUID(),
        seed: t.seed || i + 1
      }));
      setTeams(initialTeams);
      initializeGroupResults(initialTeams);
    }
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    if (location.state?.winner) {
      handleMatchResultFromStartMatch(location.state.winner);
    }
    if (location.state?.tournamentName) {
      setTournamentName(location.state.tournamentName); // Add this line
      console.log(tournamentName);
    }
  }, [location.state]);

  useEffect(() => {
    if (phaseHistory.length && !phaseHistory.includes(currentPhase)) {
      setCurrentPhase(phaseHistory[phaseHistory.length - 1]);
    }
  }, [phaseHistory, currentPhase]);

  const initializeGroupResults = (teams) => {
    const initialResults = {};
    teams.forEach(team => {
      initialResults[team.id] = {
        points: 0,
        wins: 0,
        losses: 0,
        runsFor: 0,
        runsAgainst: 0,
        netRunRate: 0,
        matchesPlayed: 0
      };
    });
    setGroupResults(initialResults);
    setHistoricalGroupResults({ league: { ...initialResults } });
  };

  const calculateNetRunRate = (runsFor, runsAgainst) => {
    return runsFor / (runsAgainst || 1);
  };

  const generateGroupMatches = (groupTeams, groupIndex, phase) => {
    const rounds = RoundRobinScheduler.generateRoundRobin(groupTeams);
    return rounds.flatMap((round, roundIndex) =>
      round.matches.map((match, matchIndex) => ({
        id: `${phase}-g${groupIndex}-r${roundIndex}-m${matchIndex}`,
        team1: match[0],
        team2: match[1],
        round: roundIndex,
        group: groupIndex,
        phase,
        winner: null,
        played: false
      }))
    );
  };

  const initializeTournament = (formatType) => {
    if (!teams.length) {
      alert("No teams provided.");
      return;
    }
    setFormat(formatType);
    const teamCount = teams.length;
    let newGroups = [];
    let newMatches = [];
    let newOddTeam = null;

    if (formatType === 'roundRobin') {
      const splitResult = TournamentSplitter.getOptimalGroups(teamCount);
      
      if (splitResult.groups) {
        let start = 0;
        newGroups = splitResult.groups.map(size => {
          const group = teams.slice(start, start + size);
          start += size;
          return group;
        });
      } else {
        const { groupCount, size, removed } = splitResult;
        if (removed) {
          newOddTeam = teams[teamCount - 1];
          const actualTeams = teams.slice(0, teamCount - removed);
          newGroups = Array.from({ length: groupCount }, (_, i) =>
            actualTeams.slice(i * size, (i + 1) * size)
          );
        } else {
          newGroups = Array.from({ length: groupCount }, (_, i) =>
            teams.slice(i * size, (i + 1) * size)
          );
        }
      }

      newMatches.push(...generateGroupMatches(newGroups[0], 0, 'league'));
      setGroups(newGroups);
      setOddTeam(newOddTeam);
      setCurrentPhase('league');
      setCurrentGroupIndex(0);
    } else if (formatType === 'knockout') {
      // Pass the entire location.state to match-start-ko
      navigate('/match-start-ko', {
        state: {
          ...location.state,
          format: 'knockout',
          origin: 'flowchart',
          activeTab: 'Knockout Brackets',
          tournamentName // Add this line
        }
      });
    } else if (formatType === 'test') {
      if (teamCount === 2) {
        newMatches = Array.from({ length: 5 }, (_, i) => ({
          id: `test-${i + 1}`,
          team1: teams[0],
          team2: teams[1],
          round: i,
          phase: 'test',
          winner: null,
          played: false
        }));
      } else if (teamCount === 3) {
        newMatches = [
          ...Array.from({ length: 3 }, (_, i) => ({
            id: `test-ind-aus-${i + 1}`,
            team1: teams[0],
            team2: teams[1],
            round: i,
            phase: 'test',
            winner: null,
            played: false
          })),
          ...Array.from({ length: 3 }, (_, i) => ({
            id: `test-ind-eng-${i + 1}`,
            team1: teams[0],
            team2: teams[2],
            round: i + 3,
            phase: 'test',
            winner: null,
            played: false
          })),
          ...Array.from({ length: 3 }, (_, i) => ({
            id: `test-aus-eng-${i + 1}`,
            team1: teams[1],
            team2: teams[2],
            round: i + 6,
            phase: 'test',
            winner: null,
            played: false
          }))
        ];
      }
      setCurrentPhase('test');
    }

    setMatches(newMatches);
  };

  const handleMatchResultFromStartMatch = (winnerId) => {
    const currentMatch = matches.find(m => m.group === currentGroupIndex && m.phase === currentPhase && !m.played);
    if (!currentMatch) return;

    if (!teams.find(t => t.id === winnerId) && winnerId !== 'Tie') return;

    setMatches(prevMatches => {
      const updatedMatches = prevMatches.map(match => {
        if (match.id === currentMatch.id) {
          const updated = { ...match, winner: winnerId, played: true };
          
          if (['league', 'quarter', 'super'].includes(match.phase) && winnerId !== 'Tie') {
            setGroupResults(prev => {
              const newStats = { ...prev };
              const team1Stats = { ...newStats[match.team1.id] };
              const team2Stats = { ...newStats[match.team2.id] };
              
              if (winnerId === match.team1.id) {
                team1Stats.wins += 1;
                team2Stats.losses += 1;
                team1Stats.points += 2;
              } else if (winnerId === match.team2.id) {
                team2Stats.wins += 1;
                team1Stats.losses += 1;
                team2Stats.points += 2;
              } else {
                team1Stats.points += 1;
                team2Stats.points += 1;
              }
              
              team1Stats.runsFor += 200;
              team1Stats.runsAgainst += 180;
              team2Stats.runsFor += 180;
              team2Stats.runsAgainst += 200;
              team1Stats.matchesPlayed += 1;
              team2Stats.matchesPlayed += 1;
              
              team1Stats.netRunRate = calculateNetRunRate(team1Stats.runsFor, team1Stats.runsAgainst);
              team2Stats.netRunRate = calculateNetRunRate(team2Stats.runsFor, team2Stats.runsAgainst);
              
              const updatedStats = { ...newStats, [match.team1.id]: team1Stats, [match.team2.id]: team2Stats };
              
              setHistoricalGroupResults(prevHistorical => ({
                ...prevHistorical,
                [match.phase]: { ...updatedStats }
              }));
              
              return updatedStats;
            });
          }
          
          return updated;
        }
        return match;
      });

      const currentGroupMatches = updatedMatches.filter(m => m.group === currentGroupIndex && m.phase === currentPhase);
      if (currentGroupMatches.every(m => m.played) && ['league', 'quarter', 'super'].includes(currentPhase)) {
        if (currentGroupIndex < groups.length - 1 && currentPhase === 'league') {
          const nextGroupIndex = currentGroupIndex + 1;
          setMatches(prev => [
            ...prev.filter(m => m.group !== nextGroupIndex || m.phase !== currentPhase),
            ...generateGroupMatches(groups[nextGroupIndex], nextGroupIndex, currentPhase)
          ]);
          setCurrentGroupIndex(nextGroupIndex);
        } else {
          if (currentPhase === 'league') {
            if (teams.length === 7) {
              const qualifiedTeams = groups.flatMap((group, groupIndex) => {
                const sorted = getGroupStandings(groupIndex);
                return sorted.slice(0, 2);
              });
              const quarterTeams = oddTeam ? [...qualifiedTeams, oddTeam] : qualifiedTeams;
              advanceToQuarterFinal([quarterTeams], 'quarter');
            } else {
              const teamsPerGroup = teams.length === 9 ? 2 : 3;
              const qualifiedTeams = groups.flatMap((group, groupIndex) => {
                const sorted = getGroupStandings(groupIndex);
                return sorted.slice(0, teamsPerGroup);
              });
              const superTeams = oddTeam ? [...qualifiedTeams, oddTeam] : qualifiedTeams;
              advanceToSuperStage([superTeams], 'super');
            }
          } else if (currentPhase === 'super') {
            const superTeams = groups[0];
            if (superTeams.length <= 4) {
              initializeFinal();
            } else {
              initializeSemiFinals();
            }
          } else if (currentPhase === 'quarter' && teams.length === 7) {
            initializeSemiFinals();
          }
        }
      } else if (currentPhase === 'semi') {
        if (updatedMatches.filter(m => m.phase === 'semi').every(m => m.played)) {
          initializeFinal();
        }
      } else if (currentPhase === 'final') {
        if (updatedMatches.filter(m => m.phase === 'final').every(m => m.played)) {
          setTournamentWinner(updatedMatches.find(m => m.phase === 'final').winner);
        }
      } else if (currentPhase === 'test') {
        if (updatedMatches.filter(m => m.phase === 'test').every(m => m.played)) {
          const winner = determineTestSeriesWinner();
          if (winner) {
            setTournamentWinner(winner.id);
          }
        }
      }

      return updatedMatches;
    });
  };

  const getGroupStandings = (groupIndex, phase = 'league') => {
    if (!groups[groupIndex]) return [];
    return groups[groupIndex]
      .map(team => ({
        ...team,
        ...historicalGroupResults[phase]?.[team.id] || groupResults[team.id] || {}
      }))
      .sort((a, b) => (b.points || 0) - (a.points || 0) || (b.netRunRate || 0) - (a.netRunRate || 0) || (b.wins || 0) - (a.wins || 0));
  };

  const getOverallStandings = (phase = 'league') => {
    return teams
      .map(team => ({
        ...team,
        ...historicalGroupResults[phase]?.[team.id] || groupResults[team.id] || {}
      }))
      .sort((a, b) => (b.points || 0) - (a.points || 0) || (b.netRunRate || 0) - (a.netRunRate || 0) || (b.wins || 0) - (a.wins || 0));
  };

  const advanceToSuperStage = (superGroups, phase) => {
    const superMatches = superGroups.flatMap((group, index) =>
      generateGroupMatches(group, index, phase)
    );
    
    setGroups(superGroups);
    setMatches(superMatches);
    setCurrentPhase(phase);
    setPhaseHistory(prev => [...prev, 'league']);
    setCurrentGroupIndex(0);
  };

  const advanceToQuarterFinal = (quarterGroups, phase) => {
    const quarterMatches = quarterGroups.flatMap((group, index) =>
      generateGroupMatches(group, index, phase)
    );
    
    setGroups(quarterGroups);
    setMatches(quarterMatches);
    setCurrentPhase(phase);
    setPhaseHistory(prev => [...prev, 'league']);
    setCurrentGroupIndex(0);
  };

  const initializeSemiFinals = () => {
    const qualifiedTeams = getGroupStandings(0, teams.length === 7 ? 'quarter' : 'super').slice(0, 4);
    
    const semiMatches = [];
    for (let i = 0; i < qualifiedTeams.length / 2; i++) {
      semiMatches.push({
        id: `semi-${i + 1}`,
        team1: qualifiedTeams[i],
        team2: qualifiedTeams[qualifiedTeams.length - 1 - i],
        round: 0,
        phase: 'semi',
        winner: null,
        played: false
      });
    }
    
    setMatches(semiMatches);
    setCurrentPhase('semi');
    setPhaseHistory(prev => [...prev, teams.length === 7 ? 'quarter' : 'super']);
  };

  const initializeFinal = () => {
    let finalTeams;
    if (phaseHistory.includes('semi')) {
      finalTeams = matches
        .filter(m => m.phase === 'semi' && m.winner)
        .map(m => teams.find(t => t.id === m.winner));
    } else {
      finalTeams = getGroupStandings(0, currentPhase === 'league' ? 'league' : 'super').slice(0, 2);
    }
    
    const finalMatch = [{
      id: 'final',
      team1: finalTeams[0],
      team2: finalTeams[1],
      round: 0,
      phase: 'final',
      winner: null,
      played: false
    }];
    
    setMatches(finalMatch);
    setCurrentPhase('final');
    setPhaseHistory(prev => [...prev, phaseHistory.includes('semi') ? 'semi' : teams.length === 7 ? 'quarter' : 'super']);
  };

  const determineTestSeriesWinner = () => {
    const teamWins = {};
    teams.forEach(team => {
      teamWins[team.id] = matches.filter(m => m.winner === team.id).length;
    });
    
    const maxWins = Math.max(...Object.values(teamWins));
    const winners = Object.entries(teamWins).filter(([_, wins]) => wins === maxWins);
    
    return winners.length === 1 ? teams.find(t => t.id === winners[0][0]) : null;
  };

  const renderGroupDetails = (groupIndex, phase = 'league') => {
    const standings = getGroupStandings(groupIndex, phase);
    const groupMatches = matches.filter(m => m.group === groupIndex && m.phase === phase);
    const teamsToAdvance = phase === 'league' ? (teams.length === 7 || teams.length === 9 ? 2 : 3) : phase === 'quarter' && teams.length === 7 ? 4 : phase === 'super' && standings.length > 4 ? 4 : 2;

    return (
      <div className="bg-gray-800 p-6 rounded-xl mt-4">
        <button
          onClick={() => setSelectedGroup(null)}
          className="mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
        >
          Back to Standings
        </button>
        <h3 className="text-xl font-bold text-purple-400 mb-4">{phase === 'league' ? `Group ${groupIndex + 1}` : phase === 'quarter' ? 'Quarter-Final' : 'Super Stage'} Details ({phase.charAt(0).toUpperCase() + phase.slice(1)})</h3>
        <h4 className="text-lg font-semibold text-gray-200 mb-2">Teams ({standings.length})</h4>
        <div className="mb-4">
          {standings.map((team, i) => (
            <div
              key={team.id}
              className={`p-2 rounded ${i < teamsToAdvance ? 'bg-purple-900' : 'bg-gray-700'} mb-2 ${team.id === oddTeam?.id ? 'border-2 border-yellow-400' : ''}`}
            >
              {team.name} (Points: {team.points || 0}, Wins: {team.wins || 0}, Losses: {team.losses || 0}, Matches Played: {team.matchesPlayed || 0}, NRR: {(team.netRunRate || 0).toFixed(3)})
              {i < teamsToAdvance && <span className="ml-2 text-green-400">✓ Advances</span>}
              {team.id === oddTeam?.id && phase === 'league' && <span className="ml-2 text-yellow-400">✓ Advances to Quarter-Final</span>}
            </div>
          ))}
        </div>
        <h4 className="text-lg font-semibold text-gray-200 mb-2">Matches</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupMatches.map(match => (
            <div key={match.id} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className={match.winner === match.team1?.id ? 'text-green-400 font-bold' : 'text-gray-300'}>
                  {match.team1?.name || 'TBD'}
                </span>
                <span className="mx-2 text-purple-400">vs</span>
                <span className={match.winner === match.team2?.id ? 'text-green-400 font-bold' : 'text-gray-300'}>
                  {match.team2?.name || 'TBD'}
                </span>
              </div>
              {match.winner && (
                <div className="text-center mt-2 text-sm text-green-400">
                  Winner: {teams.find(t => t.id === match.winner)?.name || 'Tie'}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-gray-200">
          Advancing: Top {teamsToAdvance} team{teamsToAdvance > 1 ? 's' : ''} from this {phase === 'league' ? 'group' : 'stage'}${oddTeam && phase === 'league' ? ' + Odd Team to Quarter-Final' : ''}
        </p>
      </div>
    );
  };

  const renderPhaseStandings = (phase) => {
    if (phase === 'semi' || phase === 'final') {
      const phaseMatches = matches.filter(m => m.phase === phase);
      return (
        <div className="bg-gray-800 p-6 rounded-xl mt-4">
          <h3 className="text-xl font-bold text-purple-400 mb-4">{phase === 'semi' ? 'Semi-Final' : 'Final'} Matches</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {phaseMatches.map(match => (
              <div key={match.id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className={match.winner === match.team1?.id ? 'text-green-400 font-bold' : 'text-gray-300'}>
                    {match.team1?.name || 'TBD'}
                  </span>
                  <span className="mx-2 text-purple-400">vs</span>
                  <span className={match.winner === match.team2?.id ? 'text-green-400 font-bold' : 'text-gray-300'}>
                    {match.team2?.name || 'TBD'}
                  </span>
                </div>
                {match.winner && (
                  <div className="text-center mt-2 text-sm text-green-400">
                    Winner: {teams.find(t => t.id === match.winner)?.name || 'Tie'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-800 p-6 rounded-xl mt-4">
        <h3 className="text-xl font-bold text-purple-400 mb-4">{phase.charAt(0).toUpperCase() + phase.slice(1)} Standings</h3>
        <table className="w-full bg-gray-800 rounded-xl shadow-xl mb-4">
          <thead>
            <tr className="text-left border-b border-purple-600">
              <th className="p-4">Team</th>
              <th className="p-4">Points</th>
              <th className="p-4">W/L</th>
              <th className="p-4">Matches Played</th>
              <th className="p-4">NRR</th>
            </tr>
          </thead>
          <tbody>
            {(phase === 'league' && oddTeam ? teams.filter(t => t.id !== oddTeam.id) : getOverallStandings(phase)).map(team => (
              <tr key={`${phase}-${team.id}`} className="border-b border-gray-700">
                <td className="p-4">{team.name}{team.id === oddTeam?.id ? ' (Odd Team)' : ''}</td>
                <td className="p-4">{team.points || 0}</td>
                <td className="p-4">{team.wins || 0}-{team.losses || 0}</td>
                <td className="p-4">{team.matchesPlayed || 0}</td>
                <td className="p-4">{(team.netRunRate || 0).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {phase === 'league' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groups.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedGroup(i)}
                className={`p-4 font-bold rounded-lg ${i === currentGroupIndex ? 'bg-purple-800' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                Group {i + 1} ({groups[i]?.length || 0} Teams)
              </button>
            ))}
            {oddTeam && (
              <div className="p-4 bg-yellow-600 rounded-lg text-white font-bold text-center">
                Odd Team: {oddTeam.name} (Advances to Quarter-Final)
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setSelectedGroup(0)}
              className={`p-4 font-bold rounded-lg ${currentGroupIndex === 0 ? 'bg-purple-800' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {phase === 'quarter' ? 'Quarter-Final' : 'Super Stage'} ({groups[0]?.length || 0} Teams)
            </button>
          </div>
        )}
        <button
          onClick={() => navigate('/match-start-rr', {
            state: {
              teams,
              groups,
              matches,
              currentPhase,
              currentGroupIndex,
              origin: '/tournament-bracket',
              activeTab: 'Start Match'
            }
          })}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
        >
          Start Match
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {!format ? (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-8 text-purple-400">Select Tournament Format</h1>
            <div className="flex justify-center gap-6">
              {/* <button
                onClick={() => initializeTournament('roundRobin')}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl text-xl transform transition-all duration-300 hover:scale-110"
              >
                Round Robin League
              </button> */}
              <button
                onClick={() => initializeTournament('knockout')}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl text-xl transform transition-all duration-300 hover:scale-110"
              >
                Knockout Bracket
              </button>
              {/* <button
                onClick={() => initializeTournament('test')}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl text-xl transform transition-all duration-300 hover:scale-110"
              >
                Test Series
              </button> */}
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-purple-400">
                {currentPhase === 'league' ? `League Stage (Group ${currentGroupIndex + 1} of ${groups.length})` :
                 currentPhase === 'super' ? `Super ${groups[0]?.length || 'Stage'}` :
                 currentPhase === 'quarter' ? 'Quarter-Final' :
                 currentPhase === 'pre-quarter' ? 'Pre-Quarter Finals' :
                 currentPhase === 'semi' ? 'Semi-Final' :
                 currentPhase === 'final' ? 'Final' :
                 currentPhase === 'test' ? 'Test Series' : 'Tournament'}
              </h1>
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('standings')}
                  className={`px-4 py-2 ${activeTab === 'standings' ? 'bg-purple-600' : 'bg-gray-700'} rounded-lg`}
                >
                  Standings
                </button>
                <button
                  onClick={() => setShowFlowchart(!showFlowchart)}
                  className={`px-4 py-2 ${showFlowchart ? 'bg-purple-600' : 'bg-gray-700'} rounded-lg`}
                >
                  Flowchart
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  Back
                </button>
              </div>
            </div>

            {showFlowchart && (
              <div className="mb-8">
                <button
                  onClick={() => setShowFlowchart(false)}
                  className="mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
                >
                  Back
                </button>
                <Flowchart 
                  teams={teams} 
                  groups={groups} 
                  currentPhase={currentPhase} 
                  matches={matches} 
                  groupResults={historicalGroupResults} 
                  tournamentWinner={tournamentWinner}
                  oddTeam={oddTeam}
                  phaseHistory={phaseHistory}
                />
              </div>
            )}

            {!showFlowchart && activeTab === 'standings' && (
              <div className="mb-8">
                <button
                  onClick={() => navigate(-1)}
                  className="mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
                >
                  Back
                </button>
                {selectedGroup === null ? (
                  <div>
                    <h2 className="text-2xl font-bold text-purple-400 mb-4">Tournament Standings</h2>
                    <div className="flex gap-4 mb-4">
                      {['league', 'super', 'quarter', 'semi', 'final'].map(phase => (
                        phaseHistory.includes(phase) && (
                          <button
                            key={phase}
                            onClick={() => setSelectedStandingsPhase(phase)}
                            className={`px-4 py-2 ${selectedStandingsPhase === phase ? 'bg-purple-600' : 'bg-gray-700'} hover:bg-purple-700 rounded-lg`}
                          >
                            {phase === 'league' ? 'League' : phase === 'super' ? 'Super Stage' : phase === 'quarter' ? 'Quarter-Final' : phase === 'semi' ? 'Semi-Final' : 'Final'}
                          </button>
                        )
                      ))}
                    </div>
                    {renderPhaseStandings(selectedStandingsPhase)}
                  </div>
                ) : (
                  renderGroupDetails(selectedGroup, selectedStandingsPhase)
                )}
              </div>
            )}
            
            {tournamentWinner && (
              <div className="text-center mt-8">
                <div className="bg-purple-600 p-8 rounded-xl inline-block shadow-2xl">
                  <h2 className="text-4xl font-bold text-white animate-pulse">
                    🏆 Champion: {teams.find(t => t.id === tournamentWinner)?.name} 🏆
                  </h2>
                </div>
              </div>
            )}
          </>
        )} 
      </div>
    </div>
  );
};

export default TournamentBracket;