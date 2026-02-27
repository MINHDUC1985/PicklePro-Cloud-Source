
export type Level = 'A' | 'B' | 'None';

export interface Player {
  id: string;
  name: string;
  address?: string;
  level: Level;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  points: number;
  goalsScored: number;
  goalsConceded: number;
  group?: string;
}

export interface Match {
  id: string;
  stage: 'group' | 'knockout';
  roundName: string; // e.g., "Bảng A", "Tứ kết"
  team1Id: string;
  team2Id: string;
  score1?: number;
  score2?: number;
  winnerId?: string;
  nextMatchId?: string; // For knockout brackets
}

export interface TournamentState {
  id: string;
  name: string;
  createdBy: string; // username of the creator
  teams: Team[];
  matches: Match[];
  config: {
    numGroups: number;
    mode: 'Đơn' | 'Đôi';
    hasKnockout: boolean;
    knockoutType: 'top1' | 'top2';
    sharedThirdPlace: boolean;
  };
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'manager' | 'viewer';
  password?: string; // Only used for management/login
}
