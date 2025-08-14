import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '../../firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { collection, query, where, getDocs, updateDoc, limit } from 'firebase/firestore';


const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const TournamentBracket = ({ tournamentName,User }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [format, setFormat] = useState(null);
  const [matches, setMatches] = useState([]);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [tournamentWinner, setTournamentWinner] = useState(null);
  const [phaseHistory, setPhaseHistory] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [tournamentId, setTournamentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canAdvanceToNextRound, setCanAdvanceToNextRound] = useState(false);
  const [finalRankings, setFinalRankings] = useState(null);
  const [tournamentStartDate, setTournamentStartDate] = useState(null);


  // console.log(tournamentName);
  console.log(User);

  // Add these states inside the TournamentBracket component
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [editedDate, setEditedDate] = useState('');
  const [editedTime, setEditedTime] = useState('');

// Helper to update Firestore with scheduled dates/times in simple format
const saveTimetableToFirestore = async (allMatches, timeSlots) => {
  try {
    const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
    const tournamentDoc = await getDoc(tournamentDocRef);
    if (!tournamentDoc.exists()) {
      console.error('Tournament document not found.');
      return;
    }

    const data = tournamentDoc.data();
    const updatedRounds = data.rounds.map((round) => {
      const updatedMatches = round.matches.map((match) => {
        // Find the index of this match in the flattened list
        const matchIndex = allMatches.findIndex((m) => m.id === match.id);
        if (matchIndex !== -1 && matchIndex < timeSlots.length) {
          const slotTime = timeSlots[matchIndex];
          return {
            ...match,
            scheduledDate: slotTime.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),  // e.g., "Aug 01, 2025"
            scheduledTime: slotTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })   // e.g., "10:00 AM"
          };
        }
        return match;  // No change if no slot available
      });
      return { ...round, matches: updatedMatches };
    });

    // Update the document with the new rounds
    await setDoc(tournamentDocRef, { rounds: updatedRounds }, { merge: true });
    console.log('Timetable saved to Firestore in simple format successfully.');
  } catch (err) {
    console.error('Error saving timetable to Firestore:', err);
  }
};


    // NEW: State for toggling timetable visibility
  const [showTimetable, setShowTimetable] = useState(false);
  const [timetableData, setTimetableData] = useState([]);

const fetchTimetable = async () => {
  if (!tournamentId) return;
  try {
    const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
    const tournamentDoc = await getDoc(tournamentDocRef);
    if (!tournamentDoc.exists()) return;

    const data = tournamentDoc.data();
    const allMatches = data.rounds.flatMap(round => round.matches);

    // Set timetableData using existing scheduledDate and scheduledTime
    const generatedTimetable = allMatches.map((match) => ({
      id: match.id,
      phase: match.phase,
      team1: match.team1?.name || 'TBD',
      team2: match.team2?.name || 'TBD',
      time: match.scheduledDate && match.scheduledTime 
        ? `${match.scheduledDate}, ${match.scheduledTime}` 
        : 'Not Scheduled',
    }));

    setTimetableData(generatedTimetable);
  } catch (err) {
    console.error('Error fetching timetable:', err);
  }
};

const regenerateTimetable = async () => {
  try {
    const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
    const tournamentDoc = await getDoc(tournamentDocRef);
    if (!tournamentDoc.exists()) return;

    const data = tournamentDoc.data();
    const allMatches = data.rounds.flatMap(round => round.matches);

    // -- 1. Get tournament boundaries (as before)
    let startDate, endDate;
    const tournamentsQuery = query(
      collection(db, 'tournament'),
      where('name', '==', tournamentName),
      limit(1)
    );
    const querySnapshot = await getDocs(tournamentsQuery);

    if (!querySnapshot.empty) {
      const tournamentData = querySnapshot.docs[0].data();
      startDate = new Date(`${tournamentData.startDate}T00:00:00+05:30`);
      endDate = new Date(`${tournamentData.endDate}T23:59:59+05:30`);
    } else {
      startDate = new Date('2025-08-04T00:00:00+05:30');
      endDate = new Date('2025-08-06T23:59:59+05:30');
    }

    // -- 2. Gather all slots (3 per day) from start to end, in order
    const dailyTimes = [
      { hours: 10, minutes: 0 },
      { hours: 16, minutes: 0 },
      { hours: 20, minutes: 0 }
    ];
    let curDay = new Date(startDate);
    const allSlots = [];
    while (curDay <= endDate) {
      for (const t of dailyTimes) {
        const dt = new Date(curDay);
        dt.setHours(t.hours, t.minutes, 0, 0);
        if (dt <= endDate) allSlots.push(new Date(dt)); // clone
      }
      curDay.setDate(curDay.getDate() + 1);
    }

    // -- 3. Find latest PLAYED match slot (if any)
    let latestPlayedTime = null;
    allMatches.forEach(m => {
      if (m.played && m.scheduledDate && m.scheduledTime) {
        // Parse m.scheduledDate (e.g., "Jul 15, 2025") and m.scheduledTime ("10:00 AM")
        let matchDate = new Date(`${m.scheduledDate} ${m.scheduledTime}`);
        if (!isNaN(matchDate)) {
          if (!latestPlayedTime || matchDate > latestPlayedTime) {
            latestPlayedTime = matchDate;
          }
        }
      }
    });

    // -- 4. Build a map: for each match, if it's played, reserve its slot
    const reservedSlotTimes = new Set();
    allMatches.forEach(m => {
      if (m.scheduledDate && m.scheduledTime) {
        reservedSlotTimes.add(`${m.scheduledDate},${m.scheduledTime}`);
      }
    });

    // -- 5. Assign new slots to unplayed/unassigned matches, starting after latest played time
    let slotIdx = 0;

    // If latestPlayedTime exists, advance slotIdx to the earliest slot strictly after it
    if (latestPlayedTime) {
      while (slotIdx < allSlots.length && allSlots[slotIdx] <= latestPlayedTime) slotIdx++;
    }

    // Unplayed/unassigned in order
    const assignableMatches = allMatches.filter(m => !m.played);

    // -- So we can handle assignment by phase, but order here is order in allMatches
    let assignedSlotsMap = {}; // matchId: {date, time}
    assignableMatches.forEach(m => {
      // Find next slot not reserved
      while (
        slotIdx < allSlots.length &&
        reservedSlotTimes.has(`${allSlots[slotIdx].toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })},${allSlots[slotIdx].toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`)
      ) {
        slotIdx++;
      }
      if (slotIdx >= allSlots.length) return; // no more slots available

      const dt = allSlots[slotIdx++];
      assignedSlotsMap[m.id] = {
        scheduledDate: dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        scheduledTime: dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      };
      reservedSlotTimes.add(`${assignedSlotsMap[m.id].scheduledDate},${assignedSlotsMap[m.id].scheduledTime}`);
    });

    // -- 6. Build updatedRounds: for played matches, keep their time; for assigned, update; for others, clear
    const updatedRounds = data.rounds.map(round => {
      const updatedMatches = round.matches.map(match => {
        if (match.played) return match; // Don't change played matches!
        if (assignedSlotsMap[match.id]) {
          return {
            ...match,
            scheduledDate: assignedSlotsMap[match.id].scheduledDate,
            scheduledTime: assignedSlotsMap[match.id].scheduledTime
          };
        }
        return {
          ...match,
          scheduledDate: null,
          scheduledTime: null
        };
      });
      return { ...round, matches: updatedMatches };
    });

    await updateDoc(tournamentDocRef, { rounds: updatedRounds });
    fetchTimetable();
    console.log('Smart dynamic timetable regenerated!');

  } catch (err) {
    console.error('Error in smart regenerateTimetable:', err);
  }
};


    // NEW: Fetch timetable when button is toggled on
  useEffect(() => {
    if (showTimetable) {
      fetchTimetable();
    }
  }, [showTimetable]);


  
// Add this function to update a single match's timetable in Firestore
const updateMatchTimetable = async (matchId, newDate, newTime) => {
  try {
    const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
    const tournamentDoc = await getDoc(tournamentDocRef);
    if (!tournamentDoc.exists()) {
      console.error('Tournament document not found.');
      return;
    }

    const data = tournamentDoc.data();
    const updatedRounds = data.rounds.map((round) => {
      const updatedMatches = round.matches.map((match) => {
        if (match.id === matchId) {
          return {
            ...match,
            scheduledDate: newDate || null,  // Set to null if deleting
            scheduledTime: newTime || null   // Set to null if deleting
          };
        }
        return match;
      });
      return { ...round, matches: updatedMatches };
    });

    await updateDoc(tournamentDocRef, { rounds: updatedRounds });
    console.log(`Match ${matchId} timetable updated in Firestore.`);
    // Refetch timetable after update
    fetchTimetable();
  } catch (err) {
    console.error('Error updating match timetable in Firestore:', err);
  }
};


  useEffect(() => {
    console.log('TournamentBracket received state:', location.state);

    const fetchTournament = async () => {
      const { tournamentId: stateTournamentId, currentPhase: stateCurrentPhase, teams: stateTeams, format: stateFormat } = location.state || {};
        // NEW: If no stateTournamentId, query for existing doc by tournamentName
        if (!stateTournamentId) {
          try {
            const matchesQuery = query(
              collection(db, 'KnockoutTournamentMatches'),
              where('tournamentName', '==', tournamentName),
              limit(1)  // Assume one match; adjust if multiples possible
            );
            const querySnapshot = await getDocs(matchesQuery);

            if (!querySnapshot.empty) {
              // Found existing doc: Load its data
              const existingDoc = querySnapshot.docs[0];
              const data = existingDoc.data();
              console.log(`Found existing tournament for ${tournamentName}:`, data);

              setTeams(data.teams || []);
              setTournamentId(existingDoc.id);  // Use the existing document ID
              setCurrentPhase(data.currentPhase || null);
              setTournamentWinner(data.tournamentWinner || null);
              setFormat(data.format || null);
              setFinalRankings(data.finalRankings || null);

              const currentRound = data.rounds?.find((r) => r.stage === data.currentPhase);
              if (currentRound) {
                setMatches(currentRound.matches || []);
                setMatchHistory(currentRound.matches || []);
                setCanAdvanceToNextRound(currentRound.matches.every((m) => m.played));
              }

              setLoading(false);  // Exit early after loading
              return;  // Prevent falling through to new creation
            } else {
              console.log(`No existing tournament found for ${tournamentName}. Proceeding to create new.`);
            }
          } catch (error) {
            console.error('Error querying for existing tournament:', error);
            setError('Failed to check for existing tournament. Please try again.');
            setLoading(false);
            return;
          }
        }

      if (stateTeams && !stateTournamentId) {
        const initialTeams = stateTeams.map((t, i) => ({
          ...t,
          id: t.id || generateUUID(),
          name: t.name || `Team ${i + 1}`,
          seed: t.seed || i + 1,
          flagUrl: t.flagUrl || '',
        }));
        setTeams(initialTeams);
        setTournamentId(null);
        setCurrentPhase(null);
        setTournamentWinner(null);
        setMatches([]);
        setPhaseHistory([]);
        setMatchHistory([]);
        setFormat(null);
        setFinalRankings(null);
      } else if (stateTournamentId) {
        try {
          const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', stateTournamentId);
          const tournamentDoc = await getDoc(tournamentDocRef);
          if (tournamentDoc.exists()) {
            const data = tournamentDoc.data();
            console.log('Fetched tournament data:', data);
            setTeams(data.teams || []);
            setTournamentId(stateTournamentId);
            setCurrentPhase(stateCurrentPhase || data.currentPhase);
            setTournamentWinner(data.tournamentWinner || null);
            setFormat(data.format || stateFormat);
            setFinalRankings(data.finalRankings || null);
            const currentRound = data.rounds.find((r) => r.stage === (stateCurrentPhase || data.currentPhase));
            if (currentRound) {
              setMatches(currentRound.matches || []);
              setMatchHistory(currentRound.matches || []);
              setCanAdvanceToNextRound(currentRound.matches.every((m) => m.played));
            }
          } else {
            setError('Tournament not found in database.');
            navigate('/TournamentPage');
            return;
          }
        } catch (err) {
          console.error('Error fetching tournament:', err);
          setError('Failed to load tournament data.');
        }
      } else {
        console.error('No teams or tournamentId provided in location state.');
        alert('Please select teams or provide a valid tournament ID.');
        navigate('/TournamentPage');
        return;
      }
      // Fetch startDate from 'tournament' collection
      try {
        const tournamentsQuery = query(
          collection(db, 'tournament'),
          where('name', '==', tournamentName),
          limit(1)
        );
        const querySnapshot = await getDocs(tournamentsQuery);

        if (!querySnapshot.empty) {
          const tournamentData = querySnapshot.docs[0].data();
          setTournamentStartDate(tournamentData.startDate);  // Assuming it's a string like "2025-08-15"
        } else {
          console.error(`No matching tournament found for name: ${tournamentName}`);
          // Optional: Set a default or handle error
          setTournamentStartDate(null);
        }
      } catch (error) {
        console.error('Error fetching tournament startDate:', error);
        setTournamentStartDate(null);
      }

      setLoading(false);
    };

    fetchTournament();
  }, [location.state, navigate]);

  const getNearestLowerPowerOfTwo = (n) => {
    return Math.pow(2, Math.floor(Math.log2(n)));
  };

  const initializeTournament = async (formatType) => {
    setFormat(formatType);
    const teamCount = teams.length;
    const seededTeams = [...teams].sort((a, b) => a.seed - b.seed);

    if (tournamentId) {
      try {
        const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
        const tournamentDoc = await getDoc(tournamentDocRef);
        if (tournamentDoc.exists()) {
          const data = tournamentDoc.data();
          const currentRound = data.rounds.find((r) => r.stage === currentPhase);
          if (currentRound && currentRound.matches.length > 0) {
            console.log('Matches already exist for this tournament. Skipping reinitialization.');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking existing matches in Firebase:', error);
      }
    }

    const newTournamentId = tournamentId || generateUUID();
    setTournamentId(newTournamentId);

    // NEW: Update the 'tournament' collection with tournamentId and currentStage
if (!tournamentId) {  // Only for new tournaments
  try {
    const tournamentsQuery = query(
      collection(db, 'tournament'),
      where('name', '==', tournamentName),
      limit(1)
    );
    const querySnapshot = await getDocs(tournamentsQuery);
    
    if (!querySnapshot.empty) {
      const tournamentDocRef = querySnapshot.docs[0].ref;  // Get the document reference
      await updateDoc(tournamentDocRef, {
        tournamentId: newTournamentId,  // Store the unique ID
        currentStage: 'Knockout'        // Set currentStage to "Knockout"
      });
      console.log(`Updated tournament collection with tournamentId: ${newTournamentId} and currentStage: "Knockout"`);
    } else {
      console.error(`No matching tournament found for name: ${tournamentName}`);
      // Optional: If you want to create a new document here, add setDoc logic
    }
  } catch (error) {
    console.error('Error updating tournament collection:', error);
    // Optional: Alert or handle error
  }
}


    if (formatType === 'superKnockout') {
      if (teamCount < 3) {
        console.error(`Super Knockout requires at least 3 teams, received ${teamCount}.`);
        alert('Super Knockout requires at least 3 teams.');
        window.location.reload();
        return;
      }

      const targetTeams = getNearestLowerPowerOfTwo(teamCount);
      const byeCount = targetTeams - (teamCount - targetTeams);
      const competingTeamCount = teamCount - byeCount;

      if (byeCount < 0 || competingTeamCount % 2 !== 0) {
        console.error(`Invalid configuration: byeCount=${byeCount}, competingTeamCount=${competingTeamCount}`);
        alert('Invalid number of teams for Super Knockout. Please adjust team count.');
        window.location.reload();
        return;
      }

      const competingTeams = seededTeams.slice(byeCount);
      const superKnockoutMatches = [];

      for (let i = 0; i < competingTeams.length - 1; i += 2) {
        superKnockoutMatches.push({
          id: `super-knockout-${i / 2}`,
          team1: {
            id: competingTeams[i].id,
            name: competingTeams[i].name,
            seed: competingTeams[i].seed,
            flagUrl: competingTeams[i].flagUrl || '',
          },
          team2: {
            id: competingTeams[i + 1].id,
            name: competingTeams[i + 1].name,
            seed: competingTeams[i + 1].seed,
            flagUrl: competingTeams[i + 1].flagUrl || '',
          },
          round: 0,
          phase: 'superKnockout',
          winner: null,
          played: false,
        });
      }

      const rounds = [
        { name: `Round of ${competingTeamCount}`, matches: superKnockoutMatches, roundNumber: 0, stage: 'superKnockout' },
        { name: 'Quarterfinals', matches: [], roundNumber: 1, stage: 'quarter' },
        { name: 'Semifinals', matches: [], roundNumber: 2, stage: 'semi' },
        { name: 'Final', matches: [], roundNumber: 3, stage: 'final' },
      ];

      if (targetTeams <= 4) {
        rounds.splice(1, 1);
        rounds[1].roundNumber = 1;
        rounds[2].roundNumber = 2;
      }
      if (targetTeams <= 2) {
        rounds.splice(1, 1);
        rounds[1].roundNumber = 1;
      }

      try {
        await setDoc(doc(db, 'KnockoutTournamentMatches', newTournamentId), {
          tournamentId: newTournamentId,
          format: 'superKnockout',
          teams: seededTeams,
          rounds,
          currentPhase: 'superKnockout',
          tournamentWinner: null,
          finalRankings: null,
          tournamentName: tournamentName,
        });
        console.log('Super Knockout tournament initialized in Firebase');
      } catch (error) {
        console.error('Error initializing Super Knockout in Firebase:', error);
        alert('Failed to initialize tournament. Please try again.');
        window.location.reload();
        return;
      }

      setMatches(superKnockoutMatches);
      setMatchHistory(superKnockoutMatches);
      setCurrentPhase('superKnockout');
      setPhaseHistory(['superKnockout']);
    } else if (formatType === 'knockout') {
      if (teamCount !== 12) {
        console.error(`Knockout format requires exactly 12 teams, received ${teamCount}.`);
        alert('Knockout requires exactly 12 teams.');
        window.location.reload();
        return;
      }
      const preQuarterMatches = [
        {
          id: 'pre-quarter-1',
          team1: seededTeams[8],
          team2: seededTeams[11],
          round: 0,
          phase: 'preQuarter',
          winner: null,
          played: false,
        },
        {
          id: 'pre-quarter-2',
          team1: seededTeams[9],
          team2: seededTeams[10],
          round: 0,
          phase: 'preQuarter',
          winner: null,
          played: false,
        },
      ];
      const rounds = [
        { name: 'Pre-Quarterfinals', matches: preQuarterMatches, roundNumber: 0, stage: 'preQuarter' },
        { name: 'Quarterfinals', matches: [], roundNumber: 1, stage: 'quarter' },
        { name: 'Semifinals', matches: [], roundNumber: 2, stage: 'semi' },
        { name: 'Final', matches: [], roundNumber: 3, stage: 'final' },
      ];

      try {
        await setDoc(doc(db, 'KnockoutTournamentMatches', newTournamentId), {
          tournamentId: newTournamentId,
          format: 'knockout',
          teams: seededTeams,
          rounds,
          currentPhase: 'preQuarter',
          tournamentWinner: null,
          finalRankings: null,
          tournamentName: tournamentName,
        });
        console.log('Knockout tournament initialized in Firebase');
      } catch (error) {
        console.error('Error initializing Knockout in Firebase:', error);
        alert('Failed to initialize tournament. Please try again.');
        window.location.reload();
        return;
      }

      setMatches(preQuarterMatches);
      setMatchHistory(preQuarterMatches);
      setCurrentPhase('preQuarter');
      setPhaseHistory(['preQuarter']);
    } else if (formatType === 'playOff') {
      if (teamCount !== 8) {
        console.error(`PlayOff format requires exactly 8 teams, received ${teamCount}.`);
        alert('Play Off format requires exactly 8 teams.');
        window.location.reload();
        return;
      }
      const quarterMatches = [
        { id: 'r0-0', team1: seededTeams[0], team2: seededTeams[7], round: 0, phase: 'quarter', winner: null, played: false },
        { id: 'r0-1', team1: seededTeams[1], team2: seededTeams[6], round: 0, phase: 'quarter', winner: null, played: false },
        { id: 'r0-2', team1: seededTeams[2], team2: seededTeams[5], round: 0, phase: 'quarter', winner: null, played: false },
        { id: 'r0-3', team1: seededTeams[3], team2: seededTeams[4], round: 0, phase: 'quarter', winner: null, played: false },
      ];
      const rounds = [
        { name: 'Quarterfinals', matches: quarterMatches, roundNumber: 0, stage: 'quarter' },
        { name: 'Semifinals', matches: [], roundNumber: 1, stage: 'semi' },
        { name: 'Final', matches: [], roundNumber: 2, stage: 'final' },
      ];

      try {
        await setDoc(doc(db, 'KnockoutTournamentMatches', newTournamentId), {
          tournamentId: newTournamentId,
          format: 'playOff',
          teams: seededTeams,
          rounds,
          currentPhase: 'quarter',
          tournamentWinner: null,
          finalRankings: null,
          tournamentName: tournamentName,
        });
        console.log('PlayOff tournament initialized in Firebase');
      } catch (error) {
        console.error('Error initializing PlayOff in Firebase:', error);
        alert('Failed to initialize tournament. Please try again.');
        window.location.reload();
        return;
      }

      setMatches(quarterMatches);
      setMatchHistory(quarterMatches);
      setCurrentPhase('quarter');
      setPhaseHistory(['quarter']);
    } else if (formatType === 'eliminatorElite') {
      if (teamCount !== 4) {
        console.error(`Eliminator Elite format requires exactly 4 teams, received ${teamCount}.`);
        alert('Eliminator Elite requires 4 teams.');
        window.location.reload();
        return;
      }
      const initialMatches = [
        { id: 'elite-1', team1: seededTeams[0], team2: seededTeams[3], round: 0, phase: 'eliminatorElite', winner: null, played: false },
        { id: 'elite-2', team1: seededTeams[1], team2: seededTeams[2], round: 0, phase: 'eliminatorElite', winner: null, played: false },
      ];
      const rounds = [
        { name: 'Semifinals', matches: initialMatches, roundNumber: 0, stage: 'eliminatorElite' },
        { name: 'Final', matches: [], roundNumber: 1, stage: 'final' },
        { name: 'Third Place', matches: [], roundNumber: 1, stage: 'thirdPlace' },
      ];

      try {
        await setDoc(doc(db, 'KnockoutTournamentMatches', newTournamentId), {
          tournamentId: newTournamentId,
          format: 'eliminatorElite',
          teams: seededTeams,
          rounds,
          currentPhase: 'eliminatorElite',
          tournamentWinner: null,
          finalRankings: null,
          tournamentName: tournamentName,
        });
        console.log('Eliminator Elite tournament initialized in Firebase');
      } catch (error) {
        console.error('Error initializing Eliminator Elite in Firebase:', error);
        alert('Failed to initialize tournament. Please try again.');
        window.location.reload();
        return;
      }

      setMatches(initialMatches);
      setMatchHistory(initialMatches);
      setCurrentPhase('eliminatorElite');
      setPhaseHistory(['eliminatorElite']);
    } else if (formatType === 'championship') {
      if (teamCount !== 2) {
        console.error(`Championship format requires exactly 2 teams, received ${teamCount}.`);
        alert('Championship requires 2 teams.');
        window.location.reload();
        return;
      }
      const initialMatches = [
        { id: 'championship', team1: seededTeams[0], team2: seededTeams[1], round: 0, phase: 'championship', winner: null, played: false },
      ];
      const rounds = [
        { name: 'Championship', matches: initialMatches, roundNumber: 0, stage: 'championship' },
      ];

      try {
        await setDoc(doc(db, 'KnockoutTournamentMatches', newTournamentId), {
          tournamentId: newTournamentId,
          format: 'championship',
          teams: seededTeams,
          rounds,
          currentPhase: 'championship',
          tournamentWinner: null,
          finalRankings: null,
          tournamentName: tournamentName,
        });
        console.log('Championship tournament initialized in Firebase');
      } catch (error) {
        console.error('Error initializing Championship in Firebase:', error);
        alert('Failed to initialize tournament. Please try again.');
        window.location.reload();
        return;
      }

      setMatches(initialMatches);
      setMatchHistory(initialMatches);
      setCurrentPhase('championship');
      setPhaseHistory(['championship']);
    } else {
      console.error(`Unknown format: ${formatType}`);
      alert('Invalid tournament format selected.');
      window.location.reload();
      return;
    }

    console.log(`Initialized ${formatType} with ${matches.length} matches.`);
    setCanAdvanceToNextRound(false);
  };

  const getRoundNumberForPhase = (phase) => {
    if (format === 'playOff') {
      switch (phase) {
        case 'quarter':
          return 0;
        case 'semi':
          return 1;
        case 'final':
          return 2;
        default:
          return -1;
      }
    } else if (format === 'knockout') {
      switch (phase) {
        case 'preQuarter':
          return 0;
        case 'quarter':
          return 1;
        case 'semi':
          return 2;
        case 'final':
          return 3;
        default:
          return -1;
      }
    } else if (format === 'superKnockout') {
      const targetTeams = getNearestLowerPowerOfTwo(teams.length);
      switch (phase) {
        case 'superKnockout':
          return 0;
        case 'quarter':
          return targetTeams > 4 ? 1 : -1;
        case 'semi':
          return targetTeams > 4 ? 2 : targetTeams > 2 ? 1 : -1;
        case 'final':
          return targetTeams > 4 ? 3 : targetTeams > 2 ? 2 : 1;
        default:
          return -1;
      }
    } else if (format === 'eliminatorElite') {
      switch (phase) {
        case 'eliminatorElite':
          return 0;
        case 'final':
        case 'thirdPlace':
          return 1;
        default:
          return -1;
      }
    } else if (format === 'championship') {
      switch (phase) {
        case 'championship':
          return 0;
        default:
          return -1;
      }
    }
    return -1;
  };

  const fetchWinnersByRoundFromFirebase = async (tournamentId, roundNumber, phase) => {
    try {
      const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
      const tournamentDoc = await getDoc(tournamentDocRef);
      if (tournamentDoc.exists()) {
        const data = tournamentDoc.data();
        const round = data.rounds.find((r) => r.stage === phase && r.roundNumber === roundNumber);
        if (!round) {
          console.error(`Round not found for phase ${phase}, roundNumber ${roundNumber}`);
          return [];
        }
        const roundMatches = round.matches || [];
        console.log(`Fetched matches for round ${roundNumber}, phase ${phase}:`, roundMatches);
        const winners = roundMatches
          .filter((m) => m.winner && m.played)
          .map((m) => {
            const winnerTeam = m.team1.name === m.winner ? m.team1 : m.team2;
            return { ...winnerTeam };
          });
        console.log(`Winners for round ${roundNumber}, phase ${phase}:`, winners);
        return winners;
      } else {
        console.error('Tournament document not found in Firebase');
        return [];
      }
    } catch (error) {
      console.error('Error fetching winners from Firebase:', error);
      return [];
    }
  };

  const fetchTeamsByRoundFromFirebase = async (tournamentId, roundNumber, phase) => {
    try {
      const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
      const tournamentDoc = await getDoc(tournamentDocRef);
      if (tournamentDoc.exists()) {
        const data = tournamentDoc.data();
        const round = data.rounds.find((r) => r.stage === phase && r.roundNumber === roundNumber);
        if (!round) {
          console.error(`Round not found for phase ${phase}, roundNumber ${roundNumber}`);
          return [];
        }
        const roundMatches = round.matches || [];
        const teams = roundMatches
          .filter((m) => m.winner && m.played)
          .map((m) => {
            const winnerTeam = m.team1.name === m.winner ? m.team1 : m.team2;
            return { ...winnerTeam };
          });
        return teams;
      } else {
        console.error('Tournament document not found in Firebase');
        return [];
      }
    } catch (error) {
      console.error('Error fetching teams from Firebase:', error);
      return [];
    }
  };

  useEffect(() => {
    if (['superKnockout', 'playOff', 'knockout', 'eliminatorElite', 'championship'].includes(format) && currentPhase && tournamentId) {
      const unsubscribe = onSnapshot(doc(db, 'KnockoutTournamentMatches', tournamentId), async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log('onSnapshot received data:', data);
          const currentRound = data.rounds.find((r) => r.stage === currentPhase);
          if (currentRound) {
            const updatedMatches = currentRound.matches.map((match) => ({
              ...match,
              played: !!match.winner || match.played,
            }));
            setMatches((prevMatches) => {
              const matchesChanged = JSON.stringify(prevMatches) !== JSON.stringify(updatedMatches);
              if (matchesChanged) {
                console.log('Matches updated via onSnapshot:', updatedMatches);
                return [...updatedMatches];
              }
              return prevMatches;
            });
            setMatchHistory((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newMatches = updatedMatches.filter((m) => !existingIds.has(m.id) || m.winner || m.played);
              const updatedHistory = [...prev.filter((m) => !newMatches.some((nm) => nm.id === m.id)), ...newMatches];
              if (JSON.stringify(prev) !== JSON.stringify(updatedHistory)) {
                console.log('Match history updated via onSnapshot:', updatedHistory);
                return updatedHistory;
              }
              return prev;
            });

            const allMatchesPlayed = updatedMatches.every((m) => m.played);
            setCanAdvanceToNextRound(allMatchesPlayed);

            if (allMatchesPlayed && !tournamentWinner) {
              const roundNumber = getRoundNumberForPhase(currentPhase);
              const winners = await fetchWinnersByRoundFromFirebase(tournamentId, roundNumber, currentPhase);

              if (format === 'superKnockout') {
                const targetTeams = getNearestLowerPowerOfTwo(teams.length);
                const byeCount = targetTeams - (teams.length - targetTeams);
                const byeTeamsSorted = teams.sort((a, b) => a.seed - b.seed).slice(0, byeCount);

                if (currentPhase === 'superKnockout') {
                  const nextTeams = [...winners, ...byeTeamsSorted];
                  console.log('Advancing from Super Knockout with teams:', nextTeams);
                  if (nextTeams.length === targetTeams) {
                    if (targetTeams === 2) {
                      console.log('Initializing Final');
                      await initializeFinal(nextTeams, tournamentId);
                    } else if (targetTeams === 4) {
                      console.log('Initializing Semifinals');
                      await initializeSemiFinals(nextTeams, tournamentId);
                    } else {
                      console.log('Initializing Quarterfinals');
                      await initializeQuarterFinals(nextTeams, tournamentId);
                    }
                  } else {
                    console.error(`Unexpected number of teams (${nextTeams.length}) for target ${targetTeams}`);
                    alert('Error in tournament progression.');
                  }
                } else if (currentPhase === 'quarter' && winners.length === 4) {
                  console.log('Advancing from Quarterfinals to Semifinals');
                  await initializeSemiFinals(winners, tournamentId);
                } else if (currentPhase === 'semi' && winners.length === 2) {
                  console.log('Advancing from Semifinals to Final');
                  await initializeFinal(winners, tournamentId);
                } else if (currentPhase === 'final' && winners.length === 1) {
                  console.log('Setting tournament winner:', winners[0].name);
                  setTournamentWinner(winners[0].name);
                  await setDoc(doc(db, 'KnockoutTournamentMatches', tournamentId), { tournamentWinner: winners[0].name }, { merge: true });
                  setCanAdvanceToNextRound(false);
                }
              } else if (format === 'playOff') {
                if (currentPhase === 'quarter' && winners.length === 4) {
                  console.log('Advancing from Quarter Finals to Semi Finals');
                  await initializeSemiFinals(winners, tournamentId);
                } else if (currentPhase === 'semi' && winners.length === 2) {
                  console.log('Advancing from Semifinals to Final');
                  await initializeFinal(winners, tournamentId);
                } else if (currentPhase === 'final' && winners.length === 1) {
                  console.log('Setting tournament winner');
                  setTournamentWinner(winners[0].name);
                  await setDoc(doc(db, 'KnockoutTournamentMatches', tournamentId), { tournamentWinner: winners[0].name }, { merge: true });
                  setCanAdvanceToNextRound(false);
                }
              } else if (format === 'knockout') {
                if (currentPhase === 'preQuarter' && winners.length === 2) {
                  console.log('Advancing from Pre-Quarterfinals to Quarterfinals');
                  const topSixSeeds = teams
                    .sort((a, b) => a.seed - b.seed)
                    .slice(0, 6);
                  const quarterFinalTeams = [...topSixSeeds, ...winners];
                  console.log('Quarterfinal teams:', quarterFinalTeams);
                  await initializeQuarterFinals(quarterFinalTeams, tournamentId);
                } else if (currentPhase === 'quarter' && winners.length === 4) {
                  console.log('Advancing from Quarterfinals to Semifinals');
                  await initializeSemiFinals(winners, tournamentId);
                } else if (currentPhase === 'semi' && winners.length === 2) {
                  console.log('Advancing from Semifinals to Final');
                  await initializeFinal(winners, tournamentId);
                } else if (currentPhase === 'final' && winners.length === 1) {
                  console.log('Setting tournament winner');
                  setTournamentWinner(winners[0].name);
                  await setDoc(doc(db, 'KnockoutTournamentMatches', tournamentId), { tournamentWinner: winners[0].name }, { merge: true });
                  setCanAdvanceToNextRound(false);
                }
              } else if (format === 'eliminatorElite') {
                if (currentPhase === 'eliminatorElite' && updatedMatches.length === 2) {
                  console.log('Advancing from Eliminator Elite to Final');
                  const winners = updatedMatches
                    .filter((m) => m.winner)
                    .map((m) => (m.team1.name === m.winner ? m.team1 : m.team2));
                  const losers = updatedMatches
                    .filter((m) => m.winner)
                    .map((m) => (m.team1.name === m.winner ? m.team2 : m.team1));
                  if (winners.length === 2 && losers.length === 2) {
                    const finalMatch = [
                      {
                        id: 'final',
                        team1: winners[0],
                        team2: winners[1],
                        round: 1,
                        phase: 'final',
                        winner: null,
                        played: false,
                      },
                    ];
                    const thirdPlaceMatch = [
                      {
                        id: 'third-place',
                        team1: losers[0],
                        team2: losers[1],
                        round: 1,
                        phase: 'thirdPlace',
                        winner: null,
                        played: false,
                      },
                    ];
                    const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
                    const tournamentDoc = await getDoc(tournamentDocRef);
                    if (tournamentDoc.exists()) {
                      const existingData = tournamentDoc.data();
                      const updatedRounds = existingData.rounds.map((round) => {
                        if (round.stage === 'final') {
                          return { ...round, matches: finalMatch };
                        }
                        if (round.stage === 'thirdPlace') {
                          return { ...round, matches: thirdPlaceMatch };
                        }
                        return round;
                      });
                      await setDoc(tournamentDocRef, {
                        rounds: updatedRounds,
                        currentPhase: 'final',
                      }, { merge: true });
                      console.log('Final and Third Place matches initialized in Firebase');
                    }
                    setMatches(finalMatch);
                    setMatchHistory((prev) => [...prev, ...finalMatch, ...thirdPlaceMatch]);
                    setCurrentPhase('final');
                    setPhaseHistory((prev) => [...prev, 'eliminatorElite']);
                  }
                } else if (currentPhase === 'final' && updatedMatches.length === 1) {
                  console.log('Advancing from Final to Third Place');
                  const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
                  const tournamentDoc = await getDoc(tournamentDocRef);
                  if (tournamentDoc.exists()) {
                    const data = tournamentDoc.data();
                    const thirdPlaceRound = data.rounds.find((r) => r.stage === 'thirdPlace');
                    if (thirdPlaceRound && thirdPlaceRound.matches.length === 1) {
                      await setDoc(tournamentDocRef, { currentPhase: 'thirdPlace' }, { merge: true });
                      setMatches(thirdPlaceRound.matches);
                      setCurrentPhase('thirdPlace');
                      setPhaseHistory((prev) => [...prev, 'final']);
                      setCanAdvanceToNextRound(false);
                      console.log('Transitioned to Third Place phase');
                    }
                  }
                } else if (currentPhase === 'thirdPlace' && updatedMatches.length === 1) {
                  console.log('Setting final rankings for Eliminator Elite');
                  const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
                  const tournamentDoc = await getDoc(tournamentDocRef);
                  if (tournamentDoc.exists()) {
                    const data = tournamentDoc.data();
                    const finalMatch = data.rounds.find((r) => r.stage === 'final')?.matches[0];
                    const thirdPlaceMatch = data.rounds.find((r) => r.stage === 'thirdPlace')?.matches[0];
                    if (finalMatch?.played && thirdPlaceMatch?.played) {
                      const firstPlace = finalMatch.winner;
                      const secondPlace = finalMatch.team1.name === finalMatch.winner ? finalMatch.team2.name : finalMatch.team1.name;
                      const thirdPlace = thirdPlaceMatch.winner;
                      const fourthPlace = thirdPlaceMatch.team1.name === thirdPlaceMatch.winner ? thirdPlaceMatch.team2.name : thirdPlaceMatch.team1.name;
                      const rankings = { first: firstPlace, second: secondPlace, third: thirdPlace, fourth: fourthPlace };
                      setTournamentWinner(firstPlace);
                      setFinalRankings(rankings);
                      await setDoc(tournamentDocRef, {
                        tournamentWinner: firstPlace,
                        finalRankings: rankings,
                        currentPhase: 'completed',
                      }, { merge: true });
                      console.log('Final rankings set in Firebase:', rankings);
                      setCanAdvanceToNextRound(false);
                    }
                  }
                }
              } else if (format === 'championship') {
                if (currentPhase === 'championship' && winners.length === 1) {
                  console.log('Setting tournament winner');
                  setTournamentWinner(winners[0].name);
                  await setDoc(doc(db, 'KnockoutTournamentMatches', tournamentId), { tournamentWinner: winners[0].name }, { merge: true });
                  setCanAdvanceToNextRound(false);
                }
              }
            }
          }
        }
      }, (error) => {
        console.error('onSnapshot error:', error);
      });

      return () => unsubscribe();
    }
  }, [format, currentPhase, teams, tournamentId, tournamentWinner]);

  const initializeQuarterFinals = async (teamsForQuarter, tournamentId) => {
    if (teamsForQuarter.length !== 8) {
      console.error(`Quarter Finals requires exactly 8 teams, got ${teamsForQuarter.length}`);
      alert('Error: Quarter Finals need exactly 8 teams.');
      return;
    }
    const sortedTeams = [...teamsForQuarter].sort((a, b) => (a.seed || 0) - (b?.seed || 0));
    const roundNumber = format === 'playOff' ? 0 : format === 'knockout' ? 1 : 1;
    const matches = [
      { id: 'quarter-1', team1: sortedTeams[0], team2: sortedTeams[7], round: roundNumber, phase: 'quarter', winner: null, played: false },
      { id: 'quarter-2', team1: sortedTeams[1], team2: sortedTeams[6], round: roundNumber, phase: 'quarter', winner: null, played: false },
      { id: 'quarter-3', team1: sortedTeams[2], team2: sortedTeams[5], round: roundNumber, phase: 'quarter', winner: null, played: false },
      { id: 'quarter-4', team1: sortedTeams[3], team2: sortedTeams[4], round: roundNumber, phase: 'quarter', winner: null, played: false },
    ];
    try {
      const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
      const tournamentDoc = await getDoc(tournamentDocRef);
      if (tournamentDoc.exists()) {
        const existingData = tournamentDoc.data();
        const updatedRounds = existingData.rounds.map((round) => {
          if (round.stage === 'quarter') {
            return { ...round, matches };
          }
          return round;
        });
        await setDoc(tournamentDocRef, {
          rounds: updatedRounds,
          currentPhase: 'quarter',
        }, { merge: true });
        console.log('Quarter-finals initialized in Firebase');
      }
    } catch (error) {
      console.error('Error initializing quarter-finals in Firebase:', error);
      alert('Failed to initialize quarter-finals.');
      return;
    }
    setMatches(matches);
    setMatchHistory((prev) => [...prev, ...matches]);
    setCurrentPhase('quarter');
    setPhaseHistory((prev) => [...prev, 'superKnockout']);
    setCanAdvanceToNextRound(false);
  };

  const initializeSemiFinals = async (teamsForSemi, tournamentId) => {
    if (teamsForSemi.length !== 4) {
      console.error(`Semi Finals requires exactly 4 teams, got ${teamsForSemi.length}`);
      alert('Failed to update matches for semi-finals. Please try again.');
      return;
    }
    const sortedTeams = [...teamsForSemi].sort((a, b) => (a?.seed || 0) - (b?.seed || 0));
    const roundNumber = format === 'playOff' ? 1 : format === 'knockout' ? 2 : getNearestLowerPowerOfTwo(teams.length) > 4 ? 2 : 1;
    const matches = [
      { id: 'semi-1', team1: sortedTeams[0], team2: sortedTeams[3], round: roundNumber, phase: 'semi', winner: null, played: false },
      { id: 'semi-2', team1: sortedTeams[1], team2: sortedTeams[2], round: roundNumber, phase: 'semi', winner: null, played: false },
    ];
    try {
      const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
      const tournamentDoc = await getDoc(tournamentDocRef);
      if (tournamentDoc.exists()) {
        const existingData = tournamentDoc.data();
        const updatedRounds = existingData.rounds.map((round) => {
          if (round.stage === 'semi') {
            return { ...round, matches };
          }
          return round;
        });
        await setDoc(tournamentDocRef, {
          rounds: updatedRounds,
          currentPhase: 'semi',
        }, { merge: true });
        console.log('Semi-finals initialized in Firebase');
      }
    } catch (err) {
      console.error('Error initializing semi-finals in Firebase:', err);
      alert('Failed to initialize tournament semi-finals. Please try again.');
      return;
    }
    setMatches(matches);
    setMatchHistory((prevHistory) => [...prevHistory, ...matches]);
    setCurrentPhase('semi');
    setPhaseHistory((prev) => [...prev, 'quarter']);
    setCanAdvanceToNextRound(false);
  };

  const initializeFinal = async (winners, tournamentId) => {
    if (winners.length !== 2) {
      console.error(`Final expects 2 teams, received ${winners.length}`);
      alert('Failed to proceed to final.');
      return;
    }
    const sortedTeams = [...winners].sort((a, b) => (a?.seed || 0) - (b?.seed || 0));
    const roundNumber = format === 'playOff' ? 2 : format === 'knockout' ? 3 : getNearestLowerPowerOfTwo(teams.length) > 4 ? 3 : getNearestLowerPowerOfTwo(teams.length) > 2 ? 2 : 1;
    const finalMatch = [
      {
        id: 'final',
        team1: sortedTeams[0],
        team2: sortedTeams[1],
        round: roundNumber,
        phase: 'final',
        winner: null,
        played: false,
      },
    ];
    try {
      const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
      const tournamentDoc = await getDoc(tournamentDocRef);
      if (tournamentDoc.exists()) {
        const existingData = tournamentDoc.data();
        const updatedRounds = existingData.rounds.map((round) => {
          if (round.stage === 'final') {
            return { ...round, matches: finalMatch };
          }
          return round;
        });
        await setDoc(tournamentDocRef, {
          rounds: updatedRounds,
          currentPhase: 'final',
        }, { merge: true });
        console.log('Final initialized in Firebase');
      }
    } catch (error) {
      console.error('Error initializing final in Firebase:', error);
      alert('Failed to initialize final.');
      return;
    }
    setMatches(finalMatch);
    setMatchHistory((prev) => [...prev, ...finalMatch]);
    setCurrentPhase('final');
    setPhaseHistory((prev) => [...prev, 'semi']);
    setCanAdvanceToNextRound(false);
  };

  const handleMatchResult = (matchId, winnerId) => {
    if (tournamentWinner) return;

    setMatches((prevMatches) => {
      const updatedMatches = prevMatches.map((match) => {
        if (match.id === matchId) {
          const winnerTeam = match.team1.id === winnerId ? match.team1 : match.team2;
          return { ...match, winner: winnerTeam.name, played: true };
        }
        return match;
      });

      setMatchHistory((prev) => {
        const existingMatch = prev.find((m) => m.id === matchId);
        if (existingMatch) {
          const winnerTeam = existingMatch.team1.id === winnerId ? existingMatch.team1 : existingMatch.team2;
          return prev.map((m) => (m.id === matchId ? { ...m, winner: winnerTeam.name, played: true } : m));
        }
        return [...prev, ...updatedMatches.filter((m) => m.id === matchId)];
      });

      if (['superKnockout', 'playOff', 'knockout', 'eliminatorElite', 'championship'].includes(format) && tournamentId) {
        const updateFirebase = async () => {
          try {
            const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
            const tournamentDoc = await getDoc(tournamentDocRef);
            if (tournamentDoc.exists()) {
              const data = tournamentDoc.data();
              const updatedRounds = data.rounds.map((round) => {
                if (round.stage === currentPhase) {
                  const updatedRoundMatches = round.matches.map((m) => {
                    if (m.id === matchId) {
                      const winnerTeam = m.team1.id === winnerId ? m.team1 : m.team2;
                      return { ...m, winner: winnerTeam.name, played: true };
                    }
                    return m;
                  });
                  return { ...round, matches: updatedRoundMatches };
                }
                return round;
              });
              await setDoc(tournamentDocRef, { rounds: updatedRounds }, { merge: true });
              console.log(`Match result updated in Firebase: match ${matchId}, winner ${winnerId}`);
            }
          } catch (error) {
            console.error('Error updating match result in Firebase:', error);
            alert('Failed to update match result. Please try again.');
          }
        };
        updateFirebase();
      }

      return updatedMatches;
    });
  };

  const handleGoToFlowchart = () => {
    navigate('/selection1', {
      state: {
        teams,
        format,
        matches: matchHistory,
        currentPhase,
        tournamentWinner,
        phaseHistory,
        matchHistory,
        tournamentId,
        finalRankings,
      },
    });
  };
  const handleStartMatch = (match) => {
    if (match.played) {
      console.log(`Match ${match.id} has already been played. Navigation to start-match stopped.`);
      return;
    }

    if (match.team1?.isBye || match.team2?.isBye) {
      console.log(`Match ${match.id} involves a BYE team. Navigation to start-match stopped.`);
      return;
    }

    if (!match.team1?.id || !match.team1?.name || !match.team2?.id || !match.team2?.name) {
      console.error(`Invalid team data for match ${match.id}:`, match);
      alert('Error: Invalid team data for this match.');
      return;
    }

    // NEW: Check if tournament has started
    const currentDate = new Date('2025-08-13T15:00:00+05:30');  // Use provided current date (Wednesday, August 13, 2025, 3 PM IST). In production, use new Date() for real-time.
    if (tournamentStartDate) {
      const startDateObj = new Date(`${tournamentStartDate}T00:00:00+05:30`);  // Parse startDate (adjust format if needed, e.g., add time if it's not midnight)
      
      if (currentDate < startDateObj) {
        alert(`Tournament not yet started. It will start on ${tournamentStartDate}.`);
        return;  // Prevent navigation
      }
    } else {
      // Optional: If startDate not fetched, you could prevent starting or show a warning
      alert('Unable to verify tournament start date. Proceeding anyway.');
    }

    // Proceed if tournament has started
    if (['superKnockout', 'playOff', 'knockout', 'eliminatorElite', 'championship'].includes(format) && tournamentId) {
      console.log(`Navigating to start-match-ko for match ${match.id} with teams:`, {
        teamA: match.team1,
        teamB: match.team2,
      });
      navigate('/start-match-ko', {
        state: {
          matchId: match.id,
          currentPhase,
          tournamentId,
          teamA: {
            id: match.team1.id,
            name: match.team1.name,
            flagUrl: match.team1?.flagUrl || '',
          },
          teamB: {
            id: match.team2.id,
            name: match.team2.name,
            flagUrl: match.team2?.flagUrl || '',
          },
          overs: 5,
          origin: '/match-start-ko',
          activeTab: 'Knockout Brackets',
        },
      });
    }
  };


  const handleNextRound = async () => {
    if (!canAdvanceToNextRound || tournamentWinner) return;

    const roundNumber = getRoundNumberForPhase(currentPhase);
    const winners = await fetchWinnersByRoundFromFirebase(tournamentId, roundNumber, currentPhase);

    if (format === 'superKnockout') {
      const targetTeams = getNearestLowerPowerOfTwo(teams.length);
      const byeCount = targetTeams - (teams.length - targetTeams);
      const byeTeamsSorted = teams.sort((a, b) => a.seed - b.seed).slice(0, byeCount);

      if (currentPhase === 'superKnockout') {
        const nextTeams = [...winners, ...byeTeamsSorted];
        console.log('Manually advancing from Super Knockout with teams:', nextTeams);
        if (nextTeams.length === targetTeams) {
          if (targetTeams === 2) {
            console.log('Manually advancing to Final');
            await initializeFinal(nextTeams, tournamentId);
          } else if (targetTeams === 4) {
            console.log('Manually advancing to Semifinals');
            await initializeSemiFinals(nextTeams, tournamentId);
          } else {
            console.log('Manually advancing to Quarterfinals');
            await initializeQuarterFinals(nextTeams, tournamentId);
          }
        } else {
          console.error(`Unexpected number of teams (${nextTeams.length}) for target ${targetTeams}`);
          alert('Error in tournament progression.');
        }
      } else if (currentPhase === 'quarter' && winners.length === 4) {
        console.log('Manually advancing from Quarterfinals to Semifinals');
        await initializeSemiFinals(winners, tournamentId);
      } else if (currentPhase === 'semi' && winners.length === 2) {
        console.log('Manually advancing from Semifinals to Final');
        await initializeFinal(winners, tournamentId);
      } else if (currentPhase === 'final' && winners.length === 1) {
        console.log('Manually setting tournament winner');
        setTournamentWinner(winners[0].name);
        await setDoc(doc(db, 'KnockoutTournamentMatches', tournamentId), { tournamentWinner: winners[0].name }, { merge: true });
        setCanAdvanceToNextRound(false);
      }
    } else if (format === 'playOff') {
      if (currentPhase === 'quarter' && winners.length === 4) {
        console.log('Manually advancing from quarterfinals to semifinals');
        await initializeSemiFinals(winners, tournamentId);
      } else if (currentPhase === 'semi' && winners.length === 2) {
        console.log('Manually advancing from Semifinals to Final');
        await initializeFinal(winners, tournamentId);
      } else if (currentPhase === 'final' && winners.length === 1) {
        console.log('Manually setting tournament winner');
        setTournamentWinner(winners[0].name);
        await setDoc(doc(db, 'KnockoutTournamentMatches', tournamentId), { tournamentWinner: winners[0].name }, { merge: true });
        setCanAdvanceToNextRound(false);
      }
    } else if (format === 'knockout') {
      if (currentPhase === 'preQuarter' && winners.length === 2) {
        console.log('Manually advancing from Pre-Quarterfinals to Quarterfinals');
        const topSixSeeds = teams
          .sort((a, b) => a.seed - b.seed)
          .slice(0, 6);
        const quarterFinalTeams = [...topSixSeeds, ...winners];
        console.log('Quarterfinal teams:', quarterFinalTeams);
        await initializeQuarterFinals(quarterFinalTeams, tournamentId);
      } else if (currentPhase === 'quarter' && winners.length === 4) {
        console.log('Manually advancing from Quarterfinals to Semifinals');
        await initializeSemiFinals(winners, tournamentId);
      } else if (currentPhase === 'semi' && winners.length === 2) {
        console.log('Manually advancing from Semifinals to Final');
        await initializeFinal(winners, tournamentId);
      } else if (currentPhase === 'final' && winners.length === 1) {
        console.log('Manually setting tournament winner');
        setTournamentWinner(winners[0].name);
        await setDoc(doc(db, 'KnockoutTournamentMatches', tournamentId), { tournamentWinner: winners[0].name }, { merge: true });
        setCanAdvanceToNextRound(false);
      }
    } else if (format === 'eliminatorElite') {
      if (currentPhase === 'eliminatorElite' && winners.length === 2) {
        console.log('Manually advancing from Eliminator Elite to Final');
        const losers = matches
          .filter((m) => m.winner)
          .map((m) => (m.team1.name === m.winner ? m.team2 : m.team1));
        const finalMatch = [
          { id: 'final', team1: winners[0], team2: winners[1], round: 1, phase: 'final', winner: null, played: false },
        ];
        const thirdPlaceMatch = [
          { id: 'third-place', team1: losers[0], team2: losers[1], round: 1, phase: 'thirdPlace', winner: null, played: false },
        ];
        const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
        const tournamentDoc = await getDoc(tournamentDocRef);
        if (tournamentDoc.exists()) {
          const existingData = tournamentDoc.data();
          const updatedRounds = existingData.rounds.map((round) => {
            if (round.stage === 'final') return { ...round, matches: finalMatch };
            if (round.stage === 'thirdPlace') return { ...round, matches: thirdPlaceMatch };
            return round;
          });
          await setDoc(tournamentDocRef, { rounds: updatedRounds, currentPhase: 'final' }, { merge: true });
        }
        setMatches(finalMatch);
        setMatchHistory((prev) => [...prev, ...finalMatch, ...thirdPlaceMatch]);
        setCurrentPhase('final');
        setPhaseHistory((prev) => [...prev, 'eliminatorElite']);
        setCanAdvanceToNextRound(false);
      } else if (currentPhase === 'final' && winners.length === 1) {
        console.log('Manually advancing from Final to Third Place');
        const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
        const tournamentDoc = await getDoc(tournamentDocRef);
        if (tournamentDoc.exists()) {
          const data = tournamentDoc.data();
          const thirdPlaceRound = data.rounds.find((r) => r.stage === 'thirdPlace');
          if (thirdPlaceRound && thirdPlaceRound.matches.length === 1) {
            await setDoc(tournamentDocRef, { currentPhase: 'thirdPlace' }, { merge: true });
            setMatches(thirdPlaceRound.matches);
            setCurrentPhase('thirdPlace');
            setPhaseHistory((prev) => [...prev, 'final']);
            setCanAdvanceToNextRound(false);
          }
        }
      } else if (currentPhase === 'thirdPlace' && winners.length === 1) {
        console.log('Manually setting final rankings for Eliminator Elite');
        const tournamentDocRef = doc(db, 'KnockoutTournamentMatches', tournamentId);
        const tournamentDoc = await getDoc(tournamentDocRef);
        if (tournamentDoc.exists()) {
          const data = tournamentDoc.data();
          const finalMatch = data.rounds.find((r) => r.stage === 'final')?.matches[0];
          const thirdPlaceMatch = data.rounds.find((r) => r.stage === 'thirdPlace')?.matches[0];
          if (finalMatch?.played && thirdPlaceMatch?.played) {
            const firstPlace = finalMatch.winner;
            const secondPlace = finalMatch.team1.name === finalMatch.winner ? finalMatch.team2.name : finalMatch.team1.name;
            const thirdPlace = thirdPlaceMatch.winner;
            const fourthPlace = thirdPlaceMatch.team1.name === thirdPlaceMatch.winner ? thirdPlaceMatch.team2.name : thirdPlaceMatch.team1.name;
            const rankings = { first: firstPlace, second: secondPlace, third: thirdPlace, fourth: fourthPlace };
            setTournamentWinner(firstPlace);
            setFinalRankings(rankings);
            await setDoc(tournamentDocRef, {
              tournamentWinner: firstPlace,
              finalRankings: rankings,
              currentPhase: 'completed',
            }, { merge: true });
            setCanAdvanceToNextRound(false);
          }
        }
      }
    } else if (format === 'championship') {
      if (currentPhase === 'championship' && winners.length === 1) {
        console.log('Manually setting tournament winner');
        setTournamentWinner(winners[0].name);
        await setDoc(doc(db, 'KnockoutTournamentMatches', tournamentId), { tournamentWinner: winners[0].name }, { merge: true });
        setCanAdvanceToNextRound(false);
      }
    }
  };

  const renderMatchCard = (match) => (
    <motion.div
      key={match.id}
      className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-lg mb-6 border-2 border-purple-500"
      whileHover={{ scale: (match.team1?.isBye || match.team2?.isBye || match.played) ? 1 : 1.02 }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className={`flex-1 text-right ${match.winner === match.team1?.name ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
          {match.team1?.isBye ? 'BYE' : match.team1?.name || 'TBD'}
        </div>
        <div className="mx-4 text-xl font-bold text-purple-400">vs</div>
        <div className={`flex-1 text-left ${match.winner === match.team2?.name ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
          {match.team2?.isBye ? 'BYE' : match.team2?.name || 'TBD'}
        </div>
      </div>
      {['superKnockout', 'playOff', 'knockout', 'eliminatorElite', 'championship'].includes(format) && (
        <div className="text-center mt-2">
          {match.winner ? (
            <div className="text-sm text-green-500">
              Winner: {match.winner}
            </div>
          ) : !match.team1?.isBye && !match.team2?.isBye ? (
            <motion.button 
            className={`px-4 py-2 rounded-lg text-white transition-all duration-200 ${
              User === 'Different User' 
                ? 'bg-gray-500 cursor-not-allowed'  // Disabled style
                : 'bg-purple-600 hover:bg-purple-700'  // Enabled style
            }`}
            onClick={() => handleStartMatch(match)}
            whileHover={{ scale: User === 'Different User' ? 1 : 1.05 }}  // Disable hover animation if disabled
            whileTap={{ scale: User === 'Different User' ? 1 : 0.95 }}    // Disable tap animation if disabled
            disabled={User === 'Different User'}  // NEW: Disable the button
          >
            Start Match
          </motion.button>

          ) : null}
        </div>
      )}
    </motion.div>
  );

  const isFormatEnabled = (formatType) => {
    const teamCount = teams.length;
    switch (formatType) {
      case 'championship':
        return teamCount === 2;
      case 'eliminatorElite':
        return teamCount === 4;
      case 'playOff':
        return teamCount === 8;
      case 'knockout':
        return teamCount === 12;
      case 'superKnockout':
        return teamCount >= 3;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center">Loading tournament...</div>
        ) : error ? (
          <div className="text-center">
            <p>{error}</p>
            <button 
              onClick={() => navigate('/TournamentPage')}
              className="mt-4 px-6 py-2 bg-purple-600 hover:bg-blue-800 rounded-lg text-white"
            >
              Go Back
            </button>
          </div>
        ) : !format ? (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-8 text-blue-400">Select Tournament Format</h1>
            <div className="flex flex-wrap justify-center gap-4">
              {['championship', 'eliminatorElite', 'playOff', 'knockout', 'superKnockout'].map((formatType) => (
                <button 
                  key={formatType}
                  onClick={() => isFormatEnabled(formatType) && initializeTournament(formatType)}
                  disabled={!isFormatEnabled(formatType)}
                  className={`px-8 py-3 rounded-xl text-lg font-semibold mb-2 transition-transform duration-200 ${
                    isFormatEnabled(formatType)
                      ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {formatType === 'superKnockout' ? 'Super Knockout' 
                    : formatType === 'knockout' ? 'Knockout' 
                    : formatType === 'playOff' ? 'Play Off' 
                    : formatType === 'eliminatorElite' ? 'Eliminator Elite' 
                    : 'Championship'}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-blue-400">
                {currentPhase === 'superKnockout' ? 'Super Knockout' 
                  : currentPhase === 'quarter' ? 'Quarter Finals' 
                  : currentPhase === 'semi' ? 'Semi Finals' 
                  : currentPhase === 'final' ? 'Final' 
                  : currentPhase === 'eliminatorElite' ? 'Semifinals' 
                  : currentPhase === 'championship' ? 'Championship' 
                  : currentPhase === 'thirdPlace' ? 'Third Place Match' 
                  : currentPhase === 'completed' ? 'Tournament Completed' 
                  : 'Tournament'}
              </h1>
            </div>

            <div className="space-y-8">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4 text-blue-400">
                  {currentPhase === 'superKnockout' ? 'Super Knockout' 
                    : currentPhase === 'quarter' ? 'Quarterfinals' 
                    : currentPhase === 'semi' ? 'Semifinals' 
                    : currentPhase === 'final' ? 'Final' 
                    : currentPhase === 'eliminatorElite' ? 'Semifinals' 
                    : currentPhase === 'championship' ? 'Championship' 
                    : currentPhase === 'thirdPlace' ? 'Third Place Match' 
                    : currentPhase === 'completed' ? 'Tournament Matches' 
                    : 'Tournament'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.map((match) => renderMatchCard(match))}
                </div>
              </div>
            </div>

            {canAdvanceToNextRound && ['superKnockout', 'playOff', 'knockout', 'eliminatorElite'].includes(format) && !tournamentWinner && currentPhase !== 'completed' && (
              <div className="text-center mt-8">
                <button 
                  onClick={handleNextRound}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-transform duration-200 hover:scale-105"
                >
                  Next Round
                </button>
              </div>
            )}
            {tournamentWinner && (
              <div className="text-center mt-8">
                <div className="bg-blue-500 p-8 rounded-full mx-auto shadow-lg w-fit">
                  <h2 className="text-4xl font-bold text-white mb-4 animate-pulse">
                    🏆 Champion: {tournamentWinner} 🏆
                  </h2>
                </div>

                <button 
                  onClick={handleGoToFlowchart}
                  className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg text-white font-semibold transition-all duration-200 hover:scale-105"
                >
                  Go to Flowchart
                </button>

                {finalRankings && format === 'eliminatorElite' && (
                  <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-lg inline-block">
                    <h3 className="text-2xl font-bold text-blue-600 mb-2">Final Rankings</h3>
                    <p className="text-lg text-gray-900">1st: {finalRankings.first}</p>
                    <p className="text-lg text-gray-700">2nd: {finalRankings.second}</p>
                    <p className="text-lg text-gray-700">3rd: {finalRankings.third}</p>
                    <p className="text-lg text-gray-600">4th: {finalRankings.fourth}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {tournamentId && (
              <div className="text-center mt-8">
                <button 
                  onClick={() => setShowTimetable(!showTimetable)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-transform duration-200 hover:scale-105"
                >
                  {showTimetable ? 'Hide Timetable' : 'View Timetable'}
                </button>
                {showTimetable && (
                  <div className="mt-6 bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-2xl font-bold mb-4 text-blue-400">Match Timetable</h3>
                    {User !== 'Different User' && (  // NEW: Conditional render to hide the button
                      <button
                        onClick={regenerateTimetable}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white mb-4"  // Restore original enabled styles
                      >
                        Regenerate Timetable
                      </button>
                    )}

                    {timetableData.length > 0 ? (
                      <table className="w-full text-left">
                        <thead>
                          <tr>
                            <th>Match ID</th>
                            <th>Phase</th>
                            <th>Teams</th>
                            <th>Scheduled Time (IST)</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timetableData.map((item) => (
                            <tr key={item.id}>
                              <td>{item.id}</td>
                              <td>{item.phase}</td>
                              <td>{item.team1} vs {item.team2}</td>
                              <td>
                                {editingMatchId === item.id ? (
                                  <div>
                                    <input
                                      type="date"
                                      value={editedDate}
                                      onChange={(e) => setEditedDate(e.target.value)}
                                      className="text-black"
                                    />
                                    <input
                                      type="time"
                                      value={editedTime}
                                      onChange={(e) => setEditedTime(e.target.value)}
                                      className="text-black ml-2"
                                    />
                                  </div>
                                ) : (
                                  item.time
                                )}
                              </td>
                              <td>
                                {editingMatchId === item.id ? (
                                  <div>
                                    <button
                                      onClick={() => {
                                        // Parse and format date and time as needed (e.g., convert to simple format)
                                        const formattedDate = new Date(editedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                                        const formattedTime = new Date(`1970-01-01T${editedTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                                        updateMatchTimetable(item.id, formattedDate, formattedTime);
                                        setEditingMatchId(null);
                                      }}
                                      className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white mr-2"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingMatchId(null)}
                                      className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-white"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  User !== 'Different User' ? ( 
                                  <div>
                                    <button
                                      onClick={() => {
                                      // Initialize editedDate and editedTime from item.time (parse accordingly)
                                      if (item.time === 'Not Scheduled') {
                                        setEditedDate('');
                                        setEditedTime('');
                                        setEditingMatchId(item.id);
                                        return;
                                      }

                                      const [datePart, timePart] = item.time.split(', ');
                                      
                                      // Parse date: "Aug 01, 2025" -> remove comma after day, split by space
                                      const cleanedDate = datePart.replace(/,/g, '');
                                      const dateParts = cleanedDate.split(' ');
                                      const monthShort = dateParts[0];
                                      const day = dateParts[1];
                                      const year = dateParts[2];

                                      // Convert short month to number (e.g., 'Aug' -> '08')
                                      const monthMap = {
                                        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
                                        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                                      };
                                      const month = monthMap[monthShort];

                                      if (!month) {
                                        console.error('Failed to parse month:', monthShort);
                                        setEditedDate('');
                                      } else {
                                        setEditedDate(`${year}-${month}-${day.padStart(2, '0')}`);
                                      }

                                      // Parse time (same as before, handling optional seconds and case-insensitive AM/PM)
                                      const match = timePart.match(/(\d+):(\d+)(?::\d+)? (AM|PM)/i);
                                      if (match) {
                                        const [_, hours, minutes, ampmRaw] = match;
                                        const ampm = ampmRaw.toUpperCase();
                                        let hour = parseInt(hours, 10);
                                        if (ampm === 'PM' && hour < 12) hour += 12;
                                        if (ampm === 'AM' && hour === 12) hour = 0;
                                        setEditedTime(`${hour.toString().padStart(2, '0')}:${minutes}`);
                                      } else {
                                        setEditedTime('');
                                        console.error('Failed to parse time:', timePart);
                                      }
                                      setEditingMatchId(item.id);
                                    }}
                                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white mr-2"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this timetable entry?')) {
                                          updateMatchTimetable(item.id, null, null);
                                        }
                                      }}
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                  ) : null
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>No matches available or loading...</p>
                    )}
                  </div>
                )}
              </div>
            )}
      </div>
    </div>
  );
};

export default TournamentBracket;