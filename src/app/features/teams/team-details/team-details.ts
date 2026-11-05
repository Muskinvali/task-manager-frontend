import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TimeoutError } from 'rxjs';
import {
  CreateTeamMemberRequest,
  Team,
  TeamMember,
  TeamMemberStatus,
  TeamRole,
  TeamStatistics,
  UpdateTeamMemberRequest
} from '../../../models/team';
import { TeamService } from '../../../services/team.service';

type TeamTab = 'overview' | 'members' | 'projects' | 'settings';

@Component({
  selector: 'app-team-details',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './team-details.html',
  styleUrl: './team-details.css'
})
export class TeamDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamService = inject(TeamService);
  private readonly formBuilder = inject(FormBuilder);

  readonly roles: TeamRole[] = ['ADMIN', 'MANAGER', 'DEVELOPER', 'TESTER', 'MEMBER'];
  readonly statuses: TeamMemberStatus[] = ['ACTIVE', 'INACTIVE', 'INVITED'];
  readonly teamForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    teamKey: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]{2,12}$/)]],
    description: ['', Validators.maxLength(500)]
  });
  readonly addMemberForm = this.formBuilder.nonNullable.group({
    userId: [0, [Validators.required, Validators.min(1)]],
    role: ['MEMBER' as TeamRole, Validators.required],
    status: ['ACTIVE' as TeamMemberStatus, Validators.required]
  });
  readonly memberForm = this.formBuilder.nonNullable.group({
    role: ['MEMBER' as TeamRole, Validators.required],
    status: ['ACTIVE' as TeamMemberStatus, Validators.required]
  });

  teamId = 0;
  team: Team | null = null;
  members: TeamMember[] = [];
  statistics: TeamStatistics | null = null;
  activeTab: TeamTab = 'overview';
  loading = true;
  saving = false;
  errorMessage = '';
  notification = '';
  searchText = '';
  roleFilter = '';
  statusFilter = '';
  sortAscending = true;
  currentPage = 0;
  readonly pageSize = 8;
  showAddMember = false;
  editingMember: TeamMember | null = null;
  selectedMember: TeamMember | null = null;

  ngOnInit(): void {
    const teamId = Number(this.route.snapshot.paramMap.get('teamId'));
    if (!Number.isInteger(teamId) || teamId <= 0) {
      this.loading = false;
      this.errorMessage = 'The team identifier is invalid.';
      return;
    }

    this.teamId = teamId;
    this.loadTeam();
  }

  loadTeam(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      team: this.teamService.getTeam(this.teamId),
      members: this.teamService.getMembers(this.teamId),
      statistics: this.teamService.getStatistics(this.teamId)
    }).subscribe({
      next: (result) => {
        this.team = result.team;
        this.members = result.members;
        this.statistics = result.statistics;
        this.teamForm.reset({
          name: result.team.name,
          teamKey: result.team.teamKey,
          description: result.team.description ?? ''
        });
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        this.errorMessage = this.describeError(error, 'Could not load this team.');
      }
    });
  }

  setTab(tab: TeamTab): void {
    this.activeTab = tab;
    this.notification = '';
  }

  get filteredMembers(): TeamMember[] {
    const search = this.searchText.trim().toLowerCase();
    return this.members
      .filter((member) => !search
        || member.name.toLowerCase().includes(search)
        || member.email.toLowerCase().includes(search))
      .filter((member) => !this.roleFilter || member.role === this.roleFilter)
      .filter((member) => !this.statusFilter || member.status === this.statusFilter)
      .sort((a, b) => {
        const order = a.name.localeCompare(b.name);
        return this.sortAscending ? order : -order;
      });
  }

  get visibleMembers(): TeamMember[] {
    const start = this.currentPage * this.pageSize;
    return this.filteredMembers.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredMembers.length / this.pageSize);
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage + 1 < this.totalPages) {
      this.currentPage++;
    }
  }

  resetMemberPage(): void {
    this.currentPage = 0;
  }

  openAddMember(): void {
    this.addMemberForm.reset({ userId: 0, role: 'MEMBER', status: 'ACTIVE' });
    this.showAddMember = true;
    this.notification = '';
  }

  addMember(): void {
    if (this.addMemberForm.invalid || this.saving) {
      this.addMemberForm.markAllAsTouched();
      return;
    }
    const request: CreateTeamMemberRequest = this.addMemberForm.getRawValue();
    this.saving = true;
    this.teamService.addMember(this.teamId, request).subscribe({
      next: () => {
        this.saving = false;
        this.showAddMember = false;
        this.notification = 'Member added to the team.';
        this.loadTeam();
      },
      error: (error: unknown) => {
        this.saving = false;
        this.errorMessage = this.describeError(error, 'Could not add this member.');
      }
    });
  }

  openEditMember(member: TeamMember): void {
    this.editingMember = member;
    this.memberForm.reset({ role: member.role, status: member.status });
  }

  updateMember(): void {
    if (!this.editingMember || this.memberForm.invalid || this.saving) {
      return;
    }
    const request: UpdateTeamMemberRequest = this.memberForm.getRawValue();
    this.saving = true;
    this.teamService.updateMember(this.teamId, this.editingMember.userId, request).subscribe({
      next: () => {
        this.saving = false;
        this.editingMember = null;
        this.notification = 'Member details updated.';
        this.loadTeam();
      },
      error: (error: unknown) => {
        this.saving = false;
        this.errorMessage = this.describeError(error, 'Could not update this member.');
      }
    });
  }

  removeMember(member: TeamMember): void {
    if (!window.confirm(`Remove ${member.name} from this team?`)) {
      return;
    }
    this.teamService.removeMember(this.teamId, member.userId).subscribe({
      next: () => {
        this.notification = `${member.name} was removed from the team.`;
        this.loadTeam();
      },
      error: (error: unknown) => {
        this.errorMessage = this.describeError(error, 'Could not remove this member.');
      }
    });
  }

  saveTeam(): void {
    if (!this.team || this.teamForm.invalid || this.saving) {
      this.teamForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    const form = this.teamForm.getRawValue();
    this.teamService.updateTeam(this.teamId, {
      name: form.name.trim(),
      teamKey: form.teamKey.trim().toUpperCase(),
      description: form.description.trim() || undefined
    }).subscribe({
      next: (team) => {
        this.team = team;
        this.saving = false;
        this.notification = 'Team settings saved.';
      },
      error: (error: unknown) => {
        this.saving = false;
        this.errorMessage = this.describeError(error, 'Could not update team settings.');
      }
    });
  }

  archiveTeam(): void {
    if (!this.team || !window.confirm(`Delete the team "${this.team.name}"? This action may not be reversible.`)) {
      return;
    }
    this.teamService.deleteTeam(this.teamId).subscribe({
      next: () => this.router.navigate(['/teams']),
      error: (error: unknown) => {
        this.errorMessage = this.describeError(error, 'Could not delete this team.');
      }
    });
  }

  memberInitials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase();
  }

  private describeError(error: unknown, fallback: string): string {
    if (error instanceof TimeoutError) {
      return 'The team service did not respond within 15 seconds. Check that the backend is running and try again.';
    }
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'The team service could not be reached. Check that the backend is running.';
      }
      if (error.status === 403) {
        return 'You do not have permission to perform this action.';
      }
      if (error.status >= 500) {
        return 'The team service encountered an error. Please try again later.';
      }
      return error.error?.message ?? error.message ?? fallback;
    }
    return fallback;
  }
}
