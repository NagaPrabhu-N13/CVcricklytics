import React, { useState, useEffect, Component } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-4 text-red-600">
          <h2>Error: Something went wrong</h2>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Selection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [format, setFormat] = useState(null);
  const [matches, setMatches] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [currentStage, setCurrentStage] = useState(null);
  const [currentGroupRound, setCurrentGroupRound] = useState(0);
  const [tournamentWinner, setTournamentWinner] = useState(null);
  const [groupStageResults, setGroupStageResults] = useState({});
  const [groups, setGroups] = useState([]);
  const [teamStats, setTeamStats] = useState({});
  const [roundWinners, setRoundWinners] = useState({});
  const { tournamentName } = location.state || {};
  console.log(tournamentName);

  // Automatically select Knockout format on component mount
  useEffect(() => {
    if (teams.length >= 2 && !format) {
      handleFormatSelection('knockout');
    }
  }, [teams, format]);
useEffect(() => {
  console.log('useEffect: location.state', location.state);
  if (location.state) {
    if (location.state.teams) {
      const initialTeams = Array.isArray(location.state.teams)
        ? location.state.teams.map(team => typeof team === 'string' ? { name: team } : team)
        : [];
      console.log('Initial teams:', initialTeams);
      setTeams(initialTeams);
      const initialResults = {};
      const initialStats = {};
      initialTeams.forEach(team => {
        initialResults[team.name] = 0;
        initialStats[team.name] = { wins: 0, losses: 0, points: 0 };
      });
      setGroupStageResults(initialResults);
      setTeamStats(initialStats);
    }
    if (location.state.matches) {
      setMatches(location.state.matches);
      const newGroupStageResults = { ...groupStageResults };
      const newRoundWinners = {};
      const newTeamStats = { ...teamStats };
      rounds.forEach(round => {
        if (round.stage === 'League Stage') {
          newRoundWinners[round.name] = [];
        }
      });
      location.state.matches.forEach(match => {
        if (match.stage === 'League Stage' && match.winner && !match.team1?.isBye && !match.team2?.isBye) {
          newGroupStageResults[match.winner] = (newGroupStageResults[match.winner] || 0) + 1;
          newTeamStats[match.winner] = {
            ...newTeamStats[match.winner],
            wins: (newTeamStats[match.winner]?.wins || 0) + 1,
            points: (newTeamStats[match.winner]?.points || 0) + 2
          };
          const loser = match.team1.name === match.winner ? match.team2.name : match.team1.name;
          newTeamStats[loser] = {
            ...newTeamStats[loser],
            losses: (newTeamStats[loser]?.losses || 0) + 1,
            points: newTeamStats[loser]?.points || 0
          };
          const round = rounds.find(r => r.matches.includes(match.id));
          if (round && round.stage === 'League Stage') {
            newRoundWinners[round.name] = newRoundWinners[round.name] || [];
            if (!newRoundWinners[round.name].includes(match.winner)) {
              newRoundWinners[round.name].push(match.winner);
            }
          }
        }
      });
      setGroupStageResults(newGroupStageResults);
      setRoundWinners(newRoundWinners);
      setTeamStats(newTeamStats);
    }
    if (location.state.rounds) setRounds(location.state.rounds);
    if (location.state.currentStage) setCurrentStage(location.state.currentStage);
    if (location.state.currentGroupRound) setCurrentGroupRound(location.state.currentGroupRound);
    if (location.state.tournamentWinner) setTournamentWinner(location.state.tournamentWinner);
    if (location.state.format) setFormat(location.state.format);
    if (location.state.groupStageResults) setGroupStageResults(location.state.groupStageResults);
    if (location.state.groups) setGroups(location.state.groups);
    if (location.state.teamStats) setTeamStats(location.state.teamStats);
    if (location.state.roundWinners) setRoundWinners(location.state.roundWinners);
    // if (location.state.tournamentName) setTournamentName(location.state.tournamentName); // Add this line
  } else {
    console.warn('No location.state provided');
  }
}, [location.state]);

  const initializeBracket = (teams, selectedFormat) => {
    console.log('initializeBracket: teams', teams, 'format', selectedFormat);
    if (!teams || teams.length < 2) {
      console.error('Invalid teams array');
      return;
    }

    const shuffled = [...teams].sort(() => 0.5 - Math.random());
    const newMatches = [];
    const newRounds = [];
    const newGroups = [];
    const initialStats = {};
    shuffled.forEach(team => {
      initialStats[team.name] = { wins: 0, losses: 0, points: 0 };
    });
    setTeamStats(initialStats);

    if (selectedFormat === 'roundRobin') {
      const n = teams.length;
      let groupConfig, superStage, totalRounds;

      if (n >= 15) {
        groupConfig = divideIntoGroups(shuffled, 5);
        totalRounds = 5 % 2 === 0 ? 5 - 1 : 5;
        superStage = n >= 15 ? 'Super Eight' : 'Super Ten';
      } else if (n >= 11) {
        const groupSize = Math.ceil(n / 2);
        groupConfig = divideIntoGroups(shuffled, groupSize);
        totalRounds = groupSize % 2 === 0 ? groupSize - 1 : groupSize;
        superStage = 'Super Six';
      } else if (n >= 9) {
        groupConfig = [{ id: 'Group 1', teams: shuffled }];
        totalRounds = n % 2 === 0 ? n - 1 : n;
        superStage = 'Playoffs';
      } else {
        groupConfig = [{ id: 'Group 1', teams: shuffled }];
        totalRounds = n % 2 === 0 ? n - 1 : n;
        superStage = n <= 12 ? 'Super Four' : 'Super Three';
      }

      setGroups(groupConfig);

      groupConfig.forEach((group, groupIndex) => {
        let teamList = [...group.teams];
        if (teamList.length % 2 !== 0) {
          teamList.push({ name: 'BYE', isBye: true });
        }
        const numMatchesPerRound = teamList.length / 2;

        for (let round = 0; round < totalRounds; round++) {
          const roundMatches = [];
          for (let i = 0; i < numMatchesPerRound; i++) {
            const team1 = teamList[i];
            const team2 = teamList[teamList.length - 1 - i];
            if (!team1.isBye && !team2.isBye) {
              const match = {
                id: `league-g${groupIndex}-r${round}-${i}`,
                round,
                team1,
                team2,
                winner: null,
                stage: 'League Stage',
                groupId: group.id
              };
              roundMatches.push(match);
              newMatches.push(match);
            }
          }
          newRounds.push({
            name: `${group.id} Round ${round + 1}`,
            matches: roundMatches.map(m => m.id),
            roundNumber: round,
            stage: 'League Stage',
            groupId: group.id
          });
          teamList = [teamList[0], teamList[teamList.length - 1], ...teamList.slice(1, -1)];
        }
      });

      const playoffMatches = [
        { id: 'qualifier1', round: totalRounds, team1: null, team2: null, winner: null, stage: 'Qualifier 1' },
        { id: 'eliminator', round: totalRounds, team1: null, team2: null, winner: null, stage: 'Eliminator' },
        { id: 'qualifier2', round: totalRounds + 1, team1: null, team2: null, winner: null, stage: 'Qualifier 2' },
        { id: 'final', round: totalRounds + 2, team1: null, team2: null, winner: null, stage: 'Final' }
      ];
      newMatches.push(...playoffMatches);
      newRounds.push(
        { name: 'Qualifier 1', matches: ['qualifier1'], roundNumber: totalRounds, stage: 'Qualifier 1' },
        { name: 'Eliminator', matches: ['eliminator'], roundNumber: totalRounds, stage: 'Eliminator' },
        { name: 'Qualifier 2', matches: ['qualifier2'], roundNumber: totalRounds + 1, stage: 'Qualifier 2' },
        { name: 'Final', matches: ['final'], roundNumber: totalRounds + 2, stage: 'Final' }
      );

      if (n === 9) {
        const preQuarterMatch = {
          id: 'pqf-0',
          round: totalRounds,
          team1: shuffled[7],
          team2: shuffled[8],
          winner: null,
          stage: 'Pre-Quarter Finals'
        };
        newMatches.push(preQuarterMatch);
        newRounds.push({
          name: 'Pre-Quarter Finals',
          matches: ['pqf-0'],
          roundNumber: totalRounds,
          stage: 'Pre-Quarter Finals'
        });
      }

      console.log('Round-robin rounds:', newRounds, 'matches:', newMatches, 'groups:', groupConfig);
      setMatches(newMatches);
      setRounds(newRounds);
      setCurrentStage('League Stage');
      setCurrentGroupRound(0);
      setTournamentWinner(null);
      setRoundWinners({});
    } else {
      let currentTeams = [...shuffled];
      let roundNumber = 0;
      while (currentTeams.length >= 2) {
        const roundMatches = [];
        const roundLabel = getRoundLabel(currentTeams.length, roundNumber);
        for (let i = 0; i < currentTeams.length; i += 2) {
          const match = {
            id: `r${roundNumber}-${i/2}`,
            round: roundNumber,
            team1: currentTeams[i],
            team2: currentTeams[i + 1] || { name: 'BYE', isBye: true },
            winner: null,
            stage: roundLabel
          };
          roundMatches.push(match);
        }
        newMatches.push(...roundMatches);
        newRounds.push({
          name: roundLabel,
          matches: roundMatches.map(m => m.id),
          roundNumber: roundNumber,
          stage: roundLabel
        });
        if (roundMatches.length === 1) break;
        currentTeams = roundMatches.map(() => null);
        roundNumber++;
      }
      console.log('Knockout rounds:', newRounds, 'matches:', newMatches);
      setMatches(newMatches);
      setRounds(newRounds);
      setCurrentStage(newRounds[0]?.stage || 'Round of 16');
      setCurrentGroupRound(0);
      setTournamentWinner(null);
      setGroups([]);
      setTeamStats({});
      setRoundWinners({});
    }
  };

  const divideIntoGroups = (teams, groupSize) => {
    const groups = [];
    for (let i = 0; i < teams.length; i += groupSize) {
      groups.push({
        id: `Group ${groups.length + 1}`,
        teams: teams.slice(i, i + groupSize)
      });
    }
    return groups;
  };

  const getRoundLabel = (teamCount, roundNumber) => {
    if (teamCount <= 2) return 'Final';
    if (teamCount <= 4) return 'Semifinals';
    if (teamCount <= 8) return 'Quarterfinals';
    if (teamCount <= 16) return 'Round of 16';
    return `Round of ${teamCount}`;
  };

  const handleFormatSelection = (selectedFormat) => {
    console.log('handleFormatSelection:', selectedFormat);
    setFormat(selectedFormat);
    initializeBracket(teams, selectedFormat);
  };

  const handleNextGroupRound = () => {
    if (currentGroupRound < rounds.filter(r => r.stage === currentStage).length - 1) {
      setCurrentGroupRound(prev => prev + 1);
    }
  };

  const handlePrevGroupRound = () => {
    if (currentGroupRound > 0) {
      setCurrentGroupRound(prev => prev - 1);
    }
  };

  const handleNext = () => {
    navigate('/match-start-ko', {
      state: {
        teams,
        // format,
        matches,
        rounds,
        currentStage,
        currentGroupRound,
        tournamentWinner,
        groupStageResults,
        groups,
        teamStats,
        roundWinners,
        tournamentName, // Add this line
        format: 'knockout',
        origin: 'selection',
        activeTab: 'Knockout Brackets'
      }
    });
  };

  const rankTeams = (teamStats, groupId = null) => {
    const filteredStats = groupId
      ? Object.entries(teamStats).filter(([name]) => groups.find(g => g.id === groupId)?.teams.some(t => t.name === name))
      : Object.entries(teamStats);
    return filteredStats
      .map(([name, stats]) => ({
        name,
        ...stats,
        groupId
      }))
      .sort((a, b) => b.points - a.points || b.wins - a.wins)
      .map(r => teams.find(t => t.name === r.name));
  };

  const getBestThirdPlaceTeams = (rankedTeams, groups, count) => {
    const thirdPlaceTeams = groups.map(group => {
      const groupTeams = rankedTeams.filter(t => t.groupId === group.id);
      return groupTeams[2] || null;
    }).filter(t => t);
    return thirdPlaceTeams
      .sort((a, b) => teamStats[b.name].points - teamStats[a.name].points)
      .slice(0, count);
  };

  const getBestFourthPlaceTeam = (rankedTeams, groups) => {
    const fourthPlaceTeams = groups.map(group => {
      const groupTeams = rankedTeams.filter(t => t.groupId === group.id);
      return groupTeams[3] || null;
    }).filter(t => t);
    return fourthPlaceTeams
      .sort((a, b) => teamStats[b.name].points - teamStats[a.name].points)[0] || null;
  };

  const initializeSuperStage = (teams, stage, prevRoundNumber) => {
    const newMatches = [];
    const newRounds = [];
    let totalRounds;

    if (stage === 'Super Eight' || stage === 'Super Six' || stage === 'Super Ten') {
      totalRounds = teams.length % 2 === 0 ? teams.length - 1 : teams.length;
      let teamList = [...teams];
      if (teamList.length % 2 !== 0) {
        teamList.push({ name: 'BYE', isBye: true });
      }
      const numMatchesPerRound = teamList.length / 2;

      for (let round = 0; round < totalRounds; round++) {
        const roundMatches = [];
        for (let i = 0; i < numMatchesPerRound; i++) {
          const team1 = teamList[i];
          const team2 = teamList[teamList.length - 1 - i];
          if (!team1.isBye && !team2.isBye) {
            const match = {
              id: `${stage.toLowerCase().replace(' ', '-')}-r${round}-${i}`,
              round: prevRoundNumber + round + 1,
              team1,
              team2,
              winner: null,
              stage
            };
            roundMatches.push(match);
            newMatches.push(match);
          }
        }
        newRounds.push({
          name: `${stage} Round ${round + 1}`,
          matches: roundMatches.map(m => m.id),
          roundNumber: prevRoundNumber + round + 1,
          stage
        });
        teamList = [teamList[0], teamList[teamList.length - 1], ...teamList.slice(1, -1)];
      }
    } else if (stage === 'Super Four') {
      totalRounds = 3;
      const teamList = [...teams];
      const matchups = [
        [0, 1], [2, 3],
        [0, 2], [1, 3],
        [0, 3], [1, 2]
      ];

      matchups.forEach((roundMatches, round) => {
        const matches = roundMatches.map(([i, j], idx) => ({
          id: `super-four-r${round}-${idx}`,
          round: prevRoundNumber + round + 1,
          team1: teamList[i],
          team2: teamList[j],
          winner: null,
          stage
        }));
        newMatches.push(...matches);
        newRounds.push({
          name: `${stage} Round ${round + 1}`,
          matches: matches.map(m => m.id),
          roundNumber: prevRoundNumber + round + 1,
          stage
        });
      });
    } else if (stage === 'Super Three') {
      totalRounds = 3;
      const teamList = [...teams];
      const matches = [
        { id: 'super-three-0', team1: teamList[0], team2: teamList[1], winner: null, stage, round: prevRoundNumber + 1 },
        { id: 'super-three-1', team1: teamList[1], team2: teamList[2], winner: null, stage, round: prevRoundNumber + 1 },
        { id: 'super-three-2', team1: teamList[0], team2: teamList[2], winner: null, stage, round: prevRoundNumber + 1 }
      ];
      newMatches.push(...matches);
      newRounds.push({
        name: stage,
        matches: matches.map(m => m.id),
        roundNumber: prevRoundNumber + 1,
        stage
      });
    }

    const playoffMatches = [
      { id: 'qualifier1', round: prevRoundNumber + totalRounds + 1, team1: null, team2: null, winner: null, stage: 'Qualifier 1' },
      { id: 'eliminator', round: prevRoundNumber + totalRounds + 1, team1: null, team2: null, winner: null, stage: 'Eliminator' },
      { id: 'qualifier2', round: prevRoundNumber + totalRounds + 2, team1: null, team2: null, winner: null, stage: 'Qualifier 2' },
      { id: 'final', round: prevRoundNumber + totalRounds + 3, team1: null, team2: null, winner: null, stage: 'Final' }
    ];
    newMatches.push(...playoffMatches);
    newRounds.push(
      { name: 'Qualifier 1', matches: ['qualifier1'], roundNumber: prevRoundNumber + totalRounds + 1, stage: 'Qualifier 1' },
      { name: 'Eliminator', matches: ['eliminator'], roundNumber: prevRoundNumber + totalRounds + 1, stage: 'Eliminator' },
      { name: 'Qualifier 2', matches: ['qualifier2'], roundNumber: prevRoundNumber + totalRounds + 2, stage: 'Qualifier 2' },
      { name: 'Final', matches: ['final'], roundNumber: prevRoundNumber + totalRounds + 3, stage: 'Final' }
    );

    setMatches(newMatches);
    setRounds(newRounds);
    setCurrentStage(stage);
    setCurrentGroupRound(0);
  };

  const initializePlayoffs = (teams, prevRoundNumber) => {
    const newMatches = [
      { id: 'qualifier1', round: prevRoundNumber + 1, team1: teams[0], team2: teams[1], winner: null, stage: 'Qualifier 1' },
      { id: 'eliminator', round: prevRoundNumber + 1, team1: teams[2], team2: teams[3], winner: null, stage: 'Eliminator' },
      { id: 'qualifier2', round: prevRoundNumber + 2, team1: null, team2: null, winner: null, stage: 'Qualifier 2' },
      { id: 'final', round: prevRoundNumber + 3, team1: null, team2: null, winner: null, stage: 'Final' }
    ];
    const newRounds = [
      { name: 'Qualifier 1', matches: ['qualifier1'], roundNumber: prevRoundNumber + 1, stage: 'Qualifier 1' },
      { name: 'Eliminator', matches: ['eliminator'], roundNumber: prevRoundNumber + 1, stage: 'Eliminator' },
      { name: 'Qualifier 2', matches: ['qualifier2'], roundNumber: prevRoundNumber + 2, stage: 'Qualifier 2' },
      { name: 'Final', matches: ['final'], roundNumber: prevRoundNumber + 3, stage: 'Final' }
    ];

    setMatches(newMatches);
    setRounds(newRounds);
    setCurrentStage('Qualifier 1');
    setCurrentGroupRound(0);
  };

  const handleMatchResult = (matchId, winner) => {
    if (tournamentWinner) return;

    console.log('handleMatchResult: matchId', matchId, 'winner', winner);
    let updatedMatches = matches.map(match => {
      if (match.id === matchId && !match.team1?.isBye && !match.team2?.isBye) {
        return { ...match, winner };
      }
      return match;
    });

    if (format === 'roundRobin') {
      const teamWins = { ...groupStageResults };
      const newRoundWinners = { ...roundWinners };
      const newTeamStats = { ...teamStats };
      if (winner) {
        teamWins[winner] = (teamWins[winner] || 0) + 1;
        newTeamStats[winner] = {
          ...newTeamStats[winner],
          wins: (newTeamStats[winner]?.wins || 0) + 1,
          points: (newTeamStats[winner]?.points || 0) + 2
        };
        const loser = matches.find(m => m.id === matchId).team1.name === winner
          ? matches.find(m => m.id === matchId).team2.name
          : matches.find(m => m.id === matchId).team1.name;
        newTeamStats[loser] = {
          ...newTeamStats[loser],
          losses: (newTeamStats[loser]?.losses || 0) + 1,
          points: newTeamStats[loser]?.points || 0
        };
        const round = rounds.find(r => r.matches.includes(matchId));
        if (round && round.stage === 'League Stage') {
          newRoundWinners[round.name] = newRoundWinners[round.name] || [];
          if (!newRoundWinners[round.name].includes(winner)) {
            newRoundWinners[round.name].push(winner);
          }
        }
      }
      setGroupStageResults(teamWins);
      setRoundWinners(newRoundWinners);
      setTeamStats(newTeamStats);

      const currentStageMatches = updatedMatches.filter(m => m.stage === currentStage);
      const allCompleted = currentStageMatches.every(m => m.winner !== null || m.team1?.isBye || m.team2?.isBye);

      if (allCompleted) {
        if (currentStage === 'League Stage' && currentGroupRound === rounds.filter(r => r.stage === 'League Stage').length - 1) {
          const rankedTeams = rankTeams(teamStats);
          let advancingTeams = [];
          const n = teams.length;

          if (n >= 15) {
            const groupRankings = groups.map(g => rankTeams(teamStats, g.id));
            advancingTeams = groupRankings.flatMap(g => g.slice(0, 2));
            const thirdPlaceTeams = getBestThirdPlaceTeams(rankedTeams, groups, 2);
            advancingTeams = [...advancingTeams, ...thirdPlaceTeams];
            initializeSuperStage(advancingTeams, 'Super Eight', rounds.filter(r => r.stage === 'League Stage').length);
          } else if (n >= 11) {
            advancingTeams = rankedTeams.slice(0, 6);
            initializeSuperStage(advancingTeams, 'Super Six', rounds.filter(r => r.stage === 'League Stage').length);
          } else if (n === 9) {
            if (updatedMatches.some(m => m.id === 'pqf-0' && m.winner)) {
              const preQuarterWinner = updatedMatches.find(m => m.id === 'pqf-0').winner;
              advancingTeams = rankedTeams.slice(0, 7).concat(teams.find(t => t.name === preQuarterWinner));
              initializePlayoffs(advancingTeams.slice(0, 4), rounds.filter(r => r.stage === 'Pre-Quarter Finals').length);
            }
          } else if (n <= 12) {
            advancingTeams = rankedTeams.slice(0, n <= 12 ? 4 : 3);
            initializeSuperStage(advancingTeams, n <= 12 ? 'Super Four' : 'Super Three', rounds.filter(r => r.stage === 'League Stage').length);
          }
        } else if (['Super Eight', 'Super Six', 'Super Four'].includes(currentStage)) {
          const rankedTeams = rankTeams(teamStats);
          const advancingTeams = rankedTeams.slice(0, 4);
          initializePlayoffs(advancingTeams, rounds.find(r => r.stage === currentStage).roundNumber);
        } else if (currentStage === 'Super Three') {
          const rankedTeams = rankTeams(teamStats);
          const advancingTeams = rankedTeams.slice(0, 2);
          const finalMatch = {
            id: 'final',
            round: rounds.find(r => r.stage === currentStage).roundNumber + 1,
            team1: advancingTeams[0],
            team2: advancingTeams[1],
            winner: null,
            stage: 'Final'
          };
          setMatches([finalMatch]);
          setRounds([{
            name: 'Final',
            matches: ['final'],
            roundNumber: rounds.find(r => r.stage === currentStage).roundNumber + 1,
            stage: 'Final'
          }]);
          setCurrentStage('Final');
          setCurrentGroupRound(0);
        } else if (currentStage === 'Pre-Quarter Finals') {
          const rankedTeams = rankTeams(teamStats);
          const preQuarterWinner = updatedMatches.find(m => m.id === 'pqf-0').winner;
          const advancingTeams = rankedTeams.slice(0, 7).concat(teams.find(t => t.name === preQuarterWinner));
          initializePlayoffs(advancingTeams.slice(0, 4), rounds.find(r => r.stage === currentStage).roundNumber);
        } else if (currentStage === 'Qualifier 1') {
          const q1Match = updatedMatches.find(m => m.id === 'qualifier1');
          const elimMatch = updatedMatches.find(m => m.id === 'eliminator');
          if (q1Match.winner && elimMatch.winner) {
            const q2Match = updatedMatches.find(m => m.id === 'qualifier2');
            updatedMatches = updatedMatches.map(m => {
              if (m.id === 'qualifier2') {
                return {
                  ...m,
                  team1: q1Match.team1.name === q1Match.winner ? q1Match.team2 : q1Match.team1,
                  team2: elimMatch.winner
                };
              }
              return m;
            });
            setMatches(updatedMatches);
            setCurrentStage('Qualifier 2');
            setCurrentGroupRound(rounds.find(r => r.stage === 'Qualifier 2').roundNumber);
          }
        } else if (currentStage === 'Eliminator') {
        } else if (currentStage === 'Qualifier 2') {
          const q2Match = updatedMatches.find(m => m.id === 'qualifier2');
          if (q2Match.winner) {
            const finalMatch = updatedMatches.find(m => m.id === 'final');
            updatedMatches = updatedMatches.map(m => {
              if (m.id === 'final') {
                return {
                  ...m,
                  team1: updatedMatches.find(m => m.id === 'qualifier1').winner,
                  team2: q2Match.winner
                };
              }
              return m;
            });
            setMatches(updatedMatches);
            setCurrentStage('Final');
            setCurrentGroupRound(rounds.find(r => r.stage === 'Final').roundNumber);
          }
        } else if (currentStage === 'Final') {
          setTournamentWinner(winner);
        } else {
          handleNextGroupRound();
        }
      }
    } else {
      const currentRoundIndex = rounds.findIndex(r => r.stage === currentStage);
      const currentRoundMatches = updatedMatches.filter(m => m.stage === currentStage);
      const allCompleted = currentRoundMatches.every(m => m.winner !== null || m.team1?.isBye || m.team2?.isBye);

      if (allCompleted) {
        const winners = currentRoundMatches
          .map(m => {
            if (m.team1?.isBye) return m.team2?.name;
            if (m.team2?.isBye) return m.team1?.name;
            return m.winner;
          })
          .filter(w => w !== null);

        if (winners.length === 1) {
          setTournamentWinner(winners[0]);
          return;
        }

        const nextRoundNumber = currentRoundIndex + 1;
        const nextStageLabel = getRoundLabel(winners.length, nextRoundNumber);

        let nextRoundMatches = updatedMatches.filter(m => m.stage === nextStageLabel);
        if (nextRoundMatches.length === 0 && winners.length >= 2) {
          nextRoundMatches = [];
          for (let i = 0; i < winners.length; i += 2) {
            const match = {
              id: `r${nextRoundNumber}-${i/2}`,
              round: nextRoundNumber,
              team1: winners[i] ? { name: winners[i] } : { name: 'BYE', isBye: true },
              team2: winners[i + 1] ? { name: winners[i + 1] } : { name: 'BYE', isBye: true },
              winner: null,
              stage: nextStageLabel
            };
            nextRoundMatches.push(match);
          }

          const newRounds = [...rounds];
          if (!newRounds[nextRoundNumber]) {
            newRounds.push({
              name: nextStageLabel,
              matches: nextRoundMatches.map(m => m.id),
              roundNumber: nextRoundNumber,
              stage: nextStageLabel
            });
          }
          updatedMatches = [...updatedMatches.filter(m => m.stage !== nextStageLabel), ...nextRoundMatches];
          setRounds(newRounds);
        }

        const currentMatchIndex = updatedMatches
          .filter(m => m.stage === currentStage)
          .findIndex(m => m.id === matchId);

        const nextMatchIndex = Math.floor(currentMatchIndex / 2);
        const nextMatch = nextRoundMatches[nextMatchIndex];
        if (nextMatch) {
          updatedMatches = updatedMatches.map(m => {
            if (m.id === nextMatch.id) {
              const isFirstTeam = currentMatchIndex % 2 === 0;
              return {
                ...m,
                team1: isFirstTeam ? { name: winner } : m.team1 || { name: 'BYE', isBye: true },
                team2: !isFirstTeam ? { name: winner } : m.team2 || { name: 'BYE', isBye: true },
                winner: null
              };
            }
            return m;
          });
        }

        setCurrentStage(nextStageLabel);
      }
    }

    setMatches(updatedMatches);
  };

  const getRoundColor = (stage) => {
    switch (stage) {
      case 'Final':
        return 'bg-green-100 border-green-400';
      case 'Qualifier 1':
      case 'Qualifier 2':
      case 'Eliminator':
        return 'bg-purple-100 border-purple-400';
      case 'Super Six':
      case 'Super Eight':
      case 'Super Ten':
      case 'Super Four':
      case 'Super Three':
        return 'bg-yellow-50 border-yellow-400';
      default:
        return 'bg-blue-100 border-blue-400';
    }
  };

  const renderMatch = (match, stage) => {
    const actualMatch = matches.find(m => m.id === match.id);
    if (!actualMatch) {
      console.warn('Match not found:', match.id);
      return null;
    }
    const isFinalRound = stage === 'Final';
    const isCurrentRound = actualMatch?.stage === currentStage && !tournamentWinner && !isFinalRound;
    const isCompleted = actualMatch?.winner !== null;
    const hasBye = actualMatch?.team1?.isBye || actualMatch?.team2?.isBye;

    return (
      <motion.div
        key={match.id}
        className={`p-3 rounded-lg border-2 ${
          hasBye ? 'border-gray-400 bg-gray-100' :
          isFinalRound ? getRoundColor(stage) :
          isCurrentRound ? 'border-yellow-400 bg-yellow-50' :
          isCompleted ? `${getRoundColor(stage).replace('100', '200')} border-green-400` :
          getRoundColor(stage)
        } w-48`}
        whileHover={{ scale: (isCurrentRound || isFinalRound || format === 'roundRobin') && !hasBye && !isCompleted ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="flex flex-col items-center">
          <button
            // onClick={() => {
            //   if (!hasBye && (format === 'roundRobin' || isCurrentRound || isFinalRound) && !isCompleted) {
            //     handleMatchResult(match.id, actualMatch.team1?.name);
            //   }
            // }}
            className={`w-full p-2 mb-1 rounded ${
              ((format === 'roundRobin' || isCurrentRound || isFinalRound) && !isCompleted && !hasBye) ?
                'hover:bg-green-100 cursor-pointer' : 'cursor-default'
            } ${
              actualMatch.winner === actualMatch.team1?.name
                ? 'font-bold text-green-700 text-lg'
                : 'text-gray-800'
            }`}
          >
            {actualMatch?.team1?.isBye ? 'BYE' : actualMatch?.team1?.name || 'TBD'}
          </button>

          <div className="text-center">vs</div>

          <button
            // onClick={() => {
            //   if (!hasBye && (format === 'roundRobin' || isCurrentRound || isFinalRound) && !isCompleted) {
            //     handleMatchResult(match.id, actualMatch.team2?.name);
            //   }
            // }}
            className={`w-full p-2 mt-1 rounded ${
              ((format === 'roundRobin' || isCurrentRound || isFinalRound) && !isCompleted && !hasBye) ?
                'hover:bg-green-100 cursor-pointer' : 'cursor-default'
            } ${
              actualMatch.winner === actualMatch.team2?.name
                ? 'font-bold text-green-700 text-lg'
                : 'text-gray-800'
            }`}
          >
            {actualMatch?.team2?.isBye ? 'BYE' : actualMatch?.team2?.name || 'TBD'}
          </button>

          {isCompleted && (
            <div className="mt-2 text-sm font-semibold text-center text-green-700">
              Winner: {actualMatch.winner}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderWinCounter = () => {
    if (format !== 'roundRobin') return null;

    return (
      <div className="mr-8 bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-bold mb-2">Team Standings</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Team</th>
              <th className="text-right">Wins</th>
              <th className="text-right">Losses</th>
              <th className="text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(teamStats)
              .sort((a, b) => b[1].points - a[1].points || b[1].wins - a[1].wins)
              .map(([team, stats]) => (
                <tr key={team} className="border-t">
                  <td className="py-1">{team}</td>
                  <td className="py-1 text-right">{stats.wins}</td>
                  <td className="py-1 text-right">{stats.losses}</td>
                  <td className="py-1 text-right">{stats.points}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderRoundWinners = () => {
    if (format !== 'roundRobin') return null;

    return (
      <div className="mr-8 bg-white p-4 rounded-lg shadow-md mt-4">
        <h3 className="text-lg font-bold mb-2">Round Winners</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Round</th>
              <th className="text-left">Winners</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(roundWinners)
              .sort((a, b) => {
                const roundA = parseInt(a[0].match(/Round (\d+)/)?.[1] || 0);
                const roundB = parseInt(b[0].match(/Round (\d+)/)?.[1] || 0);
                return roundA - roundB;
              })
              .map(([round, winners]) => (
                <tr key={round} className="border-t">
                  <td className="py-1">{round}</td>
                  <td className="py-1">
                    {winners.length > 0 ? winners.join(', ') : 'Not Played Yet'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderKnockoutTree = () => {
    if (!rounds || !matches || !Array.isArray(matches)) {
      return (
        <div className="text-center p-4 text-red-600">
          Error: Unable to render tournament structure
        </div>
      );
    }

    const getStageColor = (stage) => {
      switch (stage) {
        case 'Final':
          return 'border-green-200 text-green-600';
        case 'Qualifier 1':
        case 'Qualifier 2':
        case 'Eliminator':
          return 'border-purple-200 text-purple-600';
        case 'Super Six':
        case 'Super Eight':
        case 'Super Ten':
        case 'Super Four':
        case 'Super Three':
          return 'border-yellow-300 text-yellow-600';
        default:
          return 'border-blue-200 text-blue-600';
      }
    };

    return (
      <div className="w-full max-w-4xl mx-auto space-y-12">
        {rounds
          .slice()
          .sort((a, b) => {
            const stageOrder = {
              'Final': 0,
              'Qualifier 2': 1,
              'Qualifier 1': 2,
              'Eliminator': 2,
              'Super Six': 3,
              'Super Eight': 3,
              'Super Ten': 3,
              'Super Four': 3,
              'Super Three': 3,
              'Pre-Quarter Finals': 4,
              'League Stage': 5
            };
            return stageOrder[a.stage] - stageOrder[b.stage];
          })
          .map((round, index) => (
            <div key={index} className={`bg-white p-6 rounded-xl shadow-lg border-2 ${getStageColor(round.stage)}`}>
              <h3 className={`text-2xl font-bold mb-4 ${getStageColor(round.stage).split(' ')[1]}`}>
                {round.name} {round.stage === currentStage && !tournamentWinner ? '(Current)' : ''}
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {round.matches.map(matchId => {
                  const match = matches.find(m => m.id === matchId);
                  return match ? renderMatch(match, round.stage) : (
                    <div key={matchId} className="p-4 rounded-lg bg-gray-50 border-2 border-gray-300">
                      <div className="flex items-center justify-between opacity-50">
                        <span className="text-gray-600">TBD</span>
                        <span className="text-gray-400 mx-4">vs</span>
                        <span className="text-gray-600">TBD</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    );
  };

  const renderRoundRobinTree = (round) => {
    if (!round || !matches || !Array.isArray(matches)) {
      return (
        <div className="text-center p-4 text-red-600">
          Error: Unable to render tournament structure
        </div>
      );
    }

    const matchesInRound = matches.filter(m => m.round === round.roundNumber && m.stage === round.stage && m.groupId === round.groupId) || [];
    const finalMatch = matches.find(m => m.stage === 'Final') || null;
    const qualifier1Match = matches.find(m => m.stage === 'Qualifier 1') || null;
    const eliminatorMatch = matches.find(m => m.stage === 'Eliminator') || null;
    const qualifier2Match = matches.find(m => m.stage === 'Qualifier 2') || null;

    const getStageColor = (stage) => {
      switch (stage) {
        case 'Final':
          return 'border-green-200 text-green-600';
        case 'Qualifier 1':
        case 'Qualifier 2':
        case 'Eliminator':
          return 'border-purple-200 text-purple-600';
        case 'Super Six':
        case 'Super Eight':
        case 'Super Ten':
        case 'Super Four':
        case 'Super Three':
          return 'border-yellow-300 text-yellow-600';
        default:
          return 'border-blue-200 text-blue-600';
      }
    };

    return (
      <div className="w-full max-w-4xl mx-auto space-y-12">
        <div className={`bg-white p-6 rounded-xl shadow-lg border-2 ${getStageColor('Final')}`}>
          <h3 className={`text-2xl font-bold mb-4 ${getStageColor('Final').split(' ')[1]}`}>
            Final {currentStage === 'Final' && !tournamentWinner ? '(Current)' : ''}
          </h3>
          <div className="flex justify-center">
            {finalMatch && currentStage === 'Final' ? (
              renderMatch(finalMatch, 'Final')
            ) : (
              <div className="p-4 rounded-lg bg-gray-50 border-2 border-gray-300">
                <div className="flex items-center justify-between opacity-50">
                  <span className="text-gray-600">TBD</span>
                  <span className="text-gray-400 mx-4">vs</span>
                  <span className="text-gray-600">TBD</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`bg-white p-6 rounded-xl shadow-lg border-2 ${getStageColor('Qualifier 2')}`}>
          <h3 className={`text-2xl font-bold mb-4 ${getStageColor('Qualifier 2').split(' ')[1]}`}>
            Qualifier 2 {currentStage === 'Qualifier 2' && !tournamentWinner ? '(Current)' : ''}
          </h3>
          <div className="flex justify-center">
            {qualifier2Match && currentStage === 'Qualifier 2' ? (
              renderMatch(qualifier2Match, 'Qualifier 2')
            ) : (
              <div className="p-4 rounded-lg bg-gray-50 border-2 border-gray-300">
                <div className="flex items-center justify-between opacity-50">
                  <span className="text-gray-600">TBD</span>
                  <span className="text-gray-400 mx-4">vs</span>
                  <span className="text-gray-600">TBD</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`bg-white p-6 rounded-xl shadow-lg border-2 ${getStageColor('Qualifier 1')}`}>
          <h3 className={`text-2xl font-bold mb-4 ${getStageColor('Qualifier 1').split(' ')[1]}`}>
            Qualifier 1 {currentStage === 'Qualifier 1' && !tournamentWinner ? '(Current)' : ''}
          </h3>
          <div className="flex justify-center">
            {qualifier1Match && ['Qualifier 1', 'Eliminator'].includes(currentStage) ? (
              renderMatch(qualifier1Match, 'Qualifier 1')
            ) : (
              <div className="p-4 rounded-lg bg-gray-50 border-2 border-gray-300">
                <div className="flex items-center justify-between opacity-50">
                  <span className="text-gray-600">TBD</span>
                  <span className="text-gray-400 mx-4">vs</span>
                  <span className="text-gray-600">TBD</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`bg-white p-6 rounded-xl shadow-lg border-2 ${getStageColor('Eliminator')}`}>
          <h3 className={`text-2xl font-bold mb-4 ${getStageColor('Eliminator').split(' ')[1]}`}>
            Eliminator {currentStage === 'Eliminator' && !tournamentWinner ? '(Current)' : ''}
          </h3>
          <div className="flex justify-center">
            {eliminatorMatch && ['Qualifier 1', 'Eliminator'].includes(currentStage) ? (
              renderMatch(eliminatorMatch, 'Eliminator')
            ) : (
              <div className="p-4 rounded-lg bg-gray-50 border-2 border-gray-300">
                <div className="flex items-center justify-between opacity-50">
                  <span className="text-gray-600">TBD</span>
                  <span className="text-gray-400 mx-4">vs</span>
                  <span className="text-gray-600">TBD</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`bg-white p-6 rounded-xl shadow-lg border-2 ${getStageColor(round.stage)}`}>
          <h3 className={`text-2xl font-bold mb-4 ${getStageColor(round.stage).split(' ')[1]}`}>
            {round.name} {['League Stage', 'Super Six', 'Super Eight', 'Super Ten', 'Super Four', 'Super Three'].includes(currentStage) && !tournamentWinner ? '(Current)' : ''}
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {matchesInRound.map(match => renderMatch(match, round.stage))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              Select Tournament Format
            </h2>
            <div className="flex justify-center space-x-4">
              {/* <button
                onClick={() => handleFormatSelection('roundRobin')}
                className={`px-6 py-3 rounded-lg text-white ${
                  format === 'roundRobin' ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Round Robin
              </button> */}
              <button
                onClick={() => handleFormatSelection('knockout')}
                className={`px-6 py-3 rounded-lg text-white ${
                  format === 'knockout' ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                Knockout
              </button>
            </div>
          </div>

          {format && (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-800">
                Tournament Flowchart ({format === 'roundRobin' ? 'Round Robin' : 'Knockout'})
              </h1>

              {tournamentWinner && (
                <div className="text-center mb-8">
                  <div className="relative inline-block">
                    <div className="bg-gradient-to-r from-yellow-400 to-white border-4 border-yellow-600 rounded-lg p-4 shadow-lg">
                      <span className="text-2xl font-bold text-gray-800">
                        🏆 {tournamentWinner} 🏆
                      </span>
                    </div>
                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-3xl">
                      👑
                    </span>
                  </div>
                </div>
              )}

              {format === 'roundRobin' ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={handlePrevGroupRound}
                      disabled={currentGroupRound === 0}
                      className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
                    >
                      Previous Round
                    </button>
                    <span className="text-xl font-bold">
                      {rounds[currentGroupRound]?.name || 'Round'} ({currentStage})
                    </span>
                    <button
                      onClick={handleNextGroupRound}
                      disabled={currentGroupRound === rounds.filter(r => r.stage === currentStage).length - 1}
                      className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
                    >
                      Next Round
                    </button>
                  </div>

                  <div className="mb-8 w-full flex">
                    <div className="flex flex-col">
                      {renderWinCounter()}
                      {renderRoundWinners()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-4 text-center">
                        {rounds[currentGroupRound]?.name || 'Round'} (Current)
                      </h3>
                      <div className="min-h-[600px] overflow-x-auto">
                        {rounds[currentGroupRound] ? (
                          renderRoundRobinTree(rounds[currentGroupRound])
                        ) : (
                          <div className="text-center p-4 text-red-600">
                            Error: No round data available.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {renderKnockoutTree()}
                </div>
              )}

              <div className="mt-8 text-center">
                <button
                  onClick={handleNext}
                  className="px-6 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Flowchart
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Selection;