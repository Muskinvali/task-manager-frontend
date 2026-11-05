import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TimeoutError } from 'rxjs';
import { Team, TeamMember, TeamStatistics } from '../../../models/team';
import { TeamService } from '../../../services/team.service';

@Component({
  selector: 'app-team-list',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './team-list.html',
  styleUrl: './team-list.css'
})
export class TeamList implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly formBuilder = inject(FormBuilder);

  readonly createTeamForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    teamKey: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]{2,12}$/)]],
    description: ['', Validators.maxLength(500)]
  });

  teams: Team[] = [];
  readonly statistics = new Map<number, TeamStatistics>();
  private members: TeamMember[] = [];
  loading = true;
  submitting = false;
  showCreateForm = false;
  errorMessage = '';
  createError = '';
  notification = '';

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.loading = true;
    this.errorMessage = '';
    this.teamService.getTeams().subscribe({
      next: (teams) => {
        this.teams = teams;
        if (teams.length === 0) {
          this.statistics.clear();
          this.members = [];
          this.loading = false;
          return;
        }

        forkJoin(teams.map((team) => forkJoin({
          statistics: this.teamService.getStatistics(team.id),
          members: this.teamService.getMembers(team.id)
        }))).subscribe({
          next: (results) => {
            this.statistics.clear();
            teams.forEach((team, index) => {
              const teamData = results[index];
              if (teamData) {
                this.statistics.set(team.id, teamData.statistics);
              }
            });
            this.members = results.flatMap((teamData) => teamData.members);
            this.loading = false;
          },
          error: (error: unknown) => {
            this.loading = false;
            this.errorMessage = this.describeError(error, 'Could not load team statistics.');
          }
        });
      },
      error: (error: unknown) => {
        this.loading = false;
        this.errorMessage = this.describeError(error, 'Could not load teams.');
      }
    });
  }

  openCreateForm(): void {
    this.notification = '';
    this.createError = '';
    this.createTeamForm.reset({ name: '', teamKey: '', description: '' });
    this.showCreateForm = true;
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.createError = '';
  }

  createTeam(): void {
    if (this.createTeamForm.invalid || this.submitting) {
      this.createTeamForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.createError = '';
    const request = this.createTeamForm.getRawValue();
    this.teamService.createTeam({
      name: request.name.trim(),
      teamKey: request.teamKey.trim().toUpperCase(),
      description: request.description.trim() || undefined
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.showCreateForm = false;
        this.notification = 'Team created successfully.';
        this.loadTeams();
      },
      error: (error: unknown) => {
        this.submitting = false;
        this.createError = this.describeError(error, 'Could not create the team.');
      }
    });
  }

  statisticsFor(teamId: number): TeamStatistics | undefined {
    return this.statistics.get(teamId);
  }

  get totalMembers(): number {
    return new Set(this.members.map((member) => member.userId)).size;
  }

  get activeMembers(): number {
    return new Set(
      this.members.filter((member) => member.status === 'ACTIVE').map((member) => member.userId)
    ).size;
  }

  get totalProjects(): number {
    return this.sumStatistics('totalProjects');
  }

  get totalTasks(): number {
    return this.sumStatistics('totalTasks');
  }

  get pendingTasks(): number {
    return this.sumStatistics('pendingTasks');
  }

  private sumStatistics(key: keyof TeamStatistics): number {
    return [...this.statistics.values()].reduce((sum, item) => sum + item[key], 0);
  }

  private describeError(error: unknown, fallback: string): string {
    if (error instanceof TimeoutError) {
      return 'The team service did not respond within 15 seconds. Check that the backend is running and try again.';
    }
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'The team service could not be reached. Check that the backend is running.';
      }
      if (error.status === 401) {
        return 'Your session is missing or expired. Sign in again, then retry. If this continues, check that the backend accepts the login token.';
      }
      if (error.status === 403) {
        return 'Your account is signed in but is not authorized to access this team operation.';
      }
      if (error.status >= 500) {
        return 'The team service encountered an error. Please try again later.';
      }
      return error.error?.message ?? fallback;
    }
    return fallback;
  }
}
