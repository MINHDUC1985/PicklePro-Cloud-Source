
import { Player, Team, Match, Level, TournamentState } from '../types';

export const pairDoubles = (players: Player[]): Team[] => {
  const teams: Team[] = [];
  const groupA = players.filter(p => p.level === 'A');
  const groupB = players.filter(p => p.level === 'B');
  const groupNone = players.filter(p => p.level === 'None');

  const shuffle = <T,>(arr: T[]): T[] => arr.sort(() => Math.random() - 0.5);

  const shuffledA = shuffle([...groupA]);
  const shuffledB = shuffle([...groupB]);
  const shuffledNone = shuffle([...groupNone]);

  while (shuffledA.length > 0 && shuffledB.length > 0) {
    const p1 = shuffledA.pop()!;
    const p2 = shuffledB.pop()!;
    teams.push(createTeam([p1, p2]));
  }

  const remaining = [...shuffledA, ...shuffledB, ...shuffledNone];
  while (remaining.length >= 2) {
    teams.push(createTeam([remaining.pop()!, remaining.pop()!]));
  }

  return teams;
};

const createTeam = (players: Player[]): Team => ({
  id: `team-${players.map(p => p.id).join('-')}`,
  name: players.map(p => p.name).join(' / '),
  players,
  points: 0,
  goalsScored: 0,
  goalsConceded: 0
});

export const splitGroups = (teams: Team[], numGroups: number): Record<string, Team[]> => {
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const groups: Record<string, Team[]> = {};
  for (let i = 0; i < numGroups; i++) {
    groups[`Bảng ${String.fromCharCode(65 + i)}`] = [];
  }
  shuffled.forEach((team, idx) => {
    const groupName = `Bảng ${String.fromCharCode(65 + (idx % numGroups))}`;
    groups[groupName].push({ ...team, group: groupName });
  });
  return groups;
};

export const generateRoundRobin = (teams: Team[], groupName: string): Match[] => {
  const matches: Match[] = [];

  if (teams.length === 5) {
    const pairings = [
      [0, 1], [3, 4], [2, 1], [3, 0], [2, 4],
      [3, 1], [0, 4], [2, 3], [1, 4], [0, 2]
    ];
    pairings.forEach((p, idx) => {
      matches.push({
        id: `m-group-${groupName}-${idx}`,
        stage: 'group',
        roundName: groupName,
        team1Id: teams[p[0]].id,
        team2Id: teams[p[1]].id
      });
    });
  } else if (teams.length === 4) {
    const pairings = [
      [0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]
    ];
    pairings.forEach((p, idx) => {
      matches.push({
        id: `m-group-${groupName}-${idx}`,
        stage: 'group',
        roundName: groupName,
        team1Id: teams[p[0]].id,
        team2Id: teams[p[1]].id
      });
    });
  } else {
    let matchIdx = 0;
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          id: `m-group-${groupName}-${matchIdx++}`,
          stage: 'group',
          roundName: groupName,
          team1Id: teams[i].id,
          team2Id: teams[j].id
        });
      }
    }
  }

  return matches;
};

export const calculateStandings = (teams: Team[], matches: Match[]): Team[] => {
  const updatedTeams = teams.map(t => ({ ...t, points: 0, goalsScored: 0, goalsConceded: 0 }));
  matches.forEach(m => {
    if (m.score1 !== undefined && m.score2 !== undefined) {
      const t1 = updatedTeams.find(t => t.id === m.team1Id);
      const t2 = updatedTeams.find(t => t.id === m.team2Id);
      if (t1 && t2) {
        t1.goalsScored += m.score1;
        t1.goalsConceded += m.score2;
        t2.goalsScored += m.score2;
        t2.goalsConceded += m.score1;
        if (m.score1 > m.score2) t1.points += 1;
        else if (m.score2 > m.score1) t2.points += 1;
      }
    }
  });
  return updatedTeams;
};

export const mergeMatches = (oldMatches: Match[], newMatches: Match[]): Match[] => {
  const groupMatches = oldMatches.filter(m => m.stage === 'group');
  const knockoutMatches = [...newMatches];

  knockoutMatches.forEach(nm => {
    const existing = oldMatches.find(om => om.id === nm.id && om.stage === 'knockout');
    if (existing) {
      nm.score1 = existing.score1;
      nm.score2 = existing.score2;
      nm.winnerId = existing.winnerId;
    }
  });

  return [...groupMatches, ...knockoutMatches];
};

const getWinnerId = (match?: Match): string | undefined => {
  if (!match || match.score1 === undefined || match.score2 === undefined) return undefined;
  if (match.score1 > match.score2) return match.team1Id;
  if (match.score2 > match.score1) return match.team2Id;
  return undefined;
};

const getLoserId = (match?: Match): string | undefined => {
  if (!match || match.score1 === undefined || match.score2 === undefined) return undefined;
  if (match.score1 > match.score2) return match.team2Id;
  if (match.score2 > match.score1) return match.team1Id;
  return undefined;
};

const isGroupFinished = (groupLetter: string, matches: Match[]): boolean => {
  const groupName = `Bảng ${groupLetter}`;
  const groupMatches = matches.filter(m => m.roundName === groupName);
  if (groupMatches.length === 0) return false;
  return groupMatches.every(m => m.score1 !== undefined && m.score2 !== undefined);
};

const getDisplayNameFromId = (id: string): string => {
  if (id.includes('semi-1')) return 'Bán kết 1';
  if (id.includes('semi-2')) return 'Bán kết 2';
  if (id.includes('q1')) return 'Tứ kết 1';
  if (id.includes('q2')) return 'Tứ kết 2';
  if (id.includes('q3')) return 'Tứ kết 3';
  if (id.includes('q4')) return 'Tứ kết 4';
  if (id.includes('ko-o')) return `Vòng 1/8 (Trận ${id.replace('ko-o', '')})`;
  return 'Vòng trước';
};

export const generateKnockoutStage = (teams: Team[], config: any, matches: Match[]): Match[] => {
  const knockoutMatches: Match[] = [];
  const { numGroups, knockoutType, sharedThirdPlace } = config;

  const getRankedId = (groupLetter: string, rank: number) => {
    const groupIdx = groupLetter.charCodeAt(0) - 65;
    const rankName = rank === 1 ? 'Nhất' : 'Nhì';

    if (groupIdx >= numGroups) return `placeholder-Bảng ${groupLetter} (Chưa tạo)`;

    if (!isGroupFinished(groupLetter, matches)) return `placeholder-${rankName} Bảng ${groupLetter}`;
    const groupName = `Bảng ${groupLetter}`;
    const sorted = teams
      .filter(t => t.group === groupName)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return (b.goalsScored - b.goalsConceded) - (a.goalsScored - a.goalsConceded);
      });
    return sorted[rank - 1]?.id || `placeholder-${rankName} Bảng ${groupLetter}`;
  };

  const getWinnerOf = (id: string) => {
    const m = matches.find(match => match.id === id);
    return getWinnerId(m) || `placeholder-Thắng ${getDisplayNameFromId(id)}`;
  };

  const getLoserOf = (id: string) => {
    const m = matches.find(match => match.id === id);
    return getLoserId(m) || `placeholder-Thua ${getDisplayNameFromId(id)}`;
  };

  // Logic 1 Bảng
  if (numGroups === 1) {
    if (knockoutType === 'top2') {
      knockoutMatches.push({ id: 'ko-final', stage: 'knockout', roundName: 'Chung kết', team1Id: getRankedId('A', 1), team2Id: getRankedId('A', 2) });
    }
  }
  // Logic 2 Bảng
  else if (numGroups === 2) {
    if (knockoutType === 'top1') {
      knockoutMatches.push({ id: 'ko-final', stage: 'knockout', roundName: 'Chung kết', team1Id: getRankedId('A', 1), team2Id: getRankedId('B', 1) });
    } else {
      knockoutMatches.push({ id: 'ko-semi-1', stage: 'knockout', roundName: 'Bán kết 1', team1Id: getRankedId('A', 1), team2Id: getRankedId('B', 2) });
      knockoutMatches.push({ id: 'ko-semi-2', stage: 'knockout', roundName: 'Bán kết 2', team1Id: getRankedId('B', 1), team2Id: getRankedId('A', 2) });
    }
  }
  // Logic 3-4 Bảng
  else if (numGroups <= 4) {
    if (knockoutType === 'top1') {
      knockoutMatches.push({ id: 'ko-semi-1', stage: 'knockout', roundName: 'Bán kết 1', team1Id: getRankedId('A', 1), team2Id: getRankedId('B', 1) });
      knockoutMatches.push({ id: 'ko-semi-2', stage: 'knockout', roundName: 'Bán kết 2', team1Id: getRankedId('C', 1), team2Id: getRankedId('D', 1) || 'placeholder-Đội Nhì xuất sắc' });
    } else {
      knockoutMatches.push({ id: 'ko-q1', stage: 'knockout', roundName: 'Tứ kết 1', team1Id: getRankedId('A', 1), team2Id: getRankedId('C', 2) });
      knockoutMatches.push({ id: 'ko-q2', stage: 'knockout', roundName: 'Tứ kết 2', team1Id: getRankedId('B', 1), team2Id: getRankedId('D', 2) });
      knockoutMatches.push({ id: 'ko-q3', stage: 'knockout', roundName: 'Tứ kết 3', team1Id: getRankedId('C', 1), team2Id: getRankedId('A', 2) });
      knockoutMatches.push({ id: 'ko-q4', stage: 'knockout', roundName: 'Tứ kết 4', team1Id: getRankedId('D', 1), team2Id: getRankedId('B', 2) });

      knockoutMatches.push({ id: 'ko-semi-1', stage: 'knockout', roundName: 'Bán kết 1', team1Id: getWinnerOf('ko-q1'), team2Id: getWinnerOf('ko-q2') });
      knockoutMatches.push({ id: 'ko-semi-2', stage: 'knockout', roundName: 'Bán kết 2', team1Id: getWinnerOf('ko-q3'), team2Id: getWinnerOf('ko-q4') });
    }
  }
  // Logic 5-8 Bảng
  else {
    if (knockoutType === 'top1') {
      knockoutMatches.push({ id: 'ko-q1', stage: 'knockout', roundName: 'Tứ kết 1', team1Id: getRankedId('A', 1), team2Id: getRankedId('B', 1) });
      knockoutMatches.push({ id: 'ko-q2', stage: 'knockout', roundName: 'Tứ kết 2', team1Id: getRankedId('C', 1), team2Id: getRankedId('D', 1) });
      knockoutMatches.push({ id: 'ko-q3', stage: 'knockout', roundName: 'Tứ kết 3', team1Id: getRankedId('E', 1), team2Id: getRankedId('F', 1) });
      knockoutMatches.push({ id: 'ko-q4', stage: 'knockout', roundName: 'Tứ kết 4', team1Id: getRankedId('G', 1), team2Id: getRankedId('H', 1) });

      knockoutMatches.push({ id: 'ko-semi-1', stage: 'knockout', roundName: 'Bán kết 1', team1Id: getWinnerOf('ko-q1'), team2Id: getWinnerOf('ko-q2') });
      knockoutMatches.push({ id: 'ko-semi-2', stage: 'knockout', roundName: 'Bán kết 2', team1Id: getWinnerOf('ko-q3'), team2Id: getWinnerOf('ko-q4') });
    } else {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      for (let i = 0; i < 8; i += 2) {
        const L1 = letters[i];
        const L2 = letters[i + 1];
        knockoutMatches.push({ id: `ko-o${i + 1}`, stage: 'knockout', roundName: 'Vòng 1/8', team1Id: getRankedId(L1, 1), team2Id: getRankedId(L2, 2) });
        knockoutMatches.push({ id: `ko-o${i + 2}`, stage: 'knockout', roundName: 'Vòng 1/8', team1Id: getRankedId(L2, 1), team2Id: getRankedId(L1, 2) });
      }

      knockoutMatches.push({ id: 'ko-q1', stage: 'knockout', roundName: 'Tứ kết 1', team1Id: getWinnerOf('ko-o1'), team2Id: getWinnerOf('ko-o2') });
      knockoutMatches.push({ id: 'ko-q2', stage: 'knockout', roundName: 'Tứ kết 2', team1Id: getWinnerOf('ko-o3'), team2Id: getWinnerOf('ko-o4') });
      knockoutMatches.push({ id: 'ko-q3', stage: 'knockout', roundName: 'Tứ kết 3', team1Id: getWinnerOf('ko-o5'), team2Id: getWinnerOf('ko-o6') });
      knockoutMatches.push({ id: 'ko-q4', stage: 'knockout', roundName: 'Tứ kết 4', team1Id: getWinnerOf('ko-o7'), team2Id: getWinnerOf('ko-o8') });

      knockoutMatches.push({ id: 'ko-semi-1', stage: 'knockout', roundName: 'Bán kết 1', team1Id: getWinnerOf('ko-q1'), team2Id: getWinnerOf('ko-q2') });
      knockoutMatches.push({ id: 'ko-semi-2', stage: 'knockout', roundName: 'Bán kết 2', team1Id: getWinnerOf('ko-q3'), team2Id: getWinnerOf('ko-q4') });
    }
  }

  // Chung kết & Tranh hạng Ba
  const lastSemi1 = knockoutMatches.find(m => m.id === 'ko-semi-1');
  const lastSemi2 = knockoutMatches.find(m => m.id === 'ko-semi-2');

  if (lastSemi1 && lastSemi2) {
    if (!sharedThirdPlace) {
      knockoutMatches.push({ id: 'ko-third', stage: 'knockout', roundName: 'Tranh hạng Ba', team1Id: getLoserOf('ko-semi-1'), team2Id: getLoserOf('ko-semi-2') });
    }
    knockoutMatches.push({ id: 'ko-final', stage: 'knockout', roundName: 'Chung kết', team1Id: getWinnerOf('ko-semi-1'), team2Id: getWinnerOf('ko-semi-2') });
  }

  return knockoutMatches;
};
