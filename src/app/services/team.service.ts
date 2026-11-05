import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import {
  CreateTeamMemberRequest,
  CreateTeamRequest,
  Team,
  TeamMember,
  TeamStatistics,
  UpdateTeamMemberRequest
} from '../models/team';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/teams`;
  private readonly requestTimeoutMs = 15000;

  getTeams(): Observable<Team[]> {
    return this.withTimeout(this.http.get<Team[]>(this.apiUrl));
  }

  createTeam(request: CreateTeamRequest): Observable<Team> {
    return this.withTimeout(this.http.post<Team>(this.apiUrl, request));
  }

  getTeam(id: number): Observable<Team> {
    return this.withTimeout(this.http.get<Team>(`${this.apiUrl}/${id}`));
  }

  updateTeam(id: number, request: CreateTeamRequest): Observable<Team> {
    return this.withTimeout(this.http.put<Team>(`${this.apiUrl}/${id}`, request));
  }

  deleteTeam(id: number): Observable<void> {
    return this.withTimeout(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }

  getMembers(teamId: number): Observable<TeamMember[]> {
    return this.withTimeout(this.http.get<TeamMember[]>(`${this.apiUrl}/${teamId}/members`));
  }

  addMember(teamId: number, request: CreateTeamMemberRequest): Observable<TeamMember> {
    return this.withTimeout(
      this.http.post<TeamMember>(`${this.apiUrl}/${teamId}/members`, request)
    );
  }

  updateMember(
    teamId: number,
    userId: number,
    request: UpdateTeamMemberRequest
  ): Observable<TeamMember> {
    return this.withTimeout(
      this.http.put<TeamMember>(
        `${this.apiUrl}/${teamId}/members/${userId}`,
        request
      )
    );
  }

  removeMember(teamId: number, userId: number): Observable<void> {
    return this.withTimeout(
      this.http.delete<void>(`${this.apiUrl}/${teamId}/members/${userId}`)
    );
  }

  getStatistics(teamId: number): Observable<TeamStatistics> {
    return this.withTimeout(
      this.http.get<TeamStatistics>(`${this.apiUrl}/${teamId}/statistics`)
    );
  }

  private withTimeout<T>(request: Observable<T>): Observable<T> {
    return request.pipe(timeout({ first: this.requestTimeoutMs }));
  }
}
