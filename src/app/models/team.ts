export type TeamRole = 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'TESTER' | 'MEMBER';
export type TeamMemberStatus = 'ACTIVE' | 'INACTIVE' | 'INVITED';

export interface Team {
  id: number;
  name: string;
  teamKey: string;
  description?: string;
  createdBy: number;
  createdAt: string;
  teamLeadName?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
}

export interface TeamMember {
  id: number;
  userId: number;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  joinedAt: string;
}

export interface TeamStatistics {
  totalMembers: number;
  activeMembers: number;
  totalProjects: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
}

export interface CreateTeamRequest {
  name: string;
  teamKey: string;
  description?: string;
}

export interface CreateTeamMemberRequest {
  userId: number;
  role: TeamRole;
  status: TeamMemberStatus;
}

export interface UpdateTeamMemberRequest {
  role: TeamRole;
  status: TeamMemberStatus;
}
