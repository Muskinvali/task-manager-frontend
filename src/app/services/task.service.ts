import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/task';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private http = inject(HttpClient);

  private apiUrl = `${API_BASE_URL}/tasks`;

  getTasks(): Observable<Task[]> {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<Task[]>(this.apiUrl, { headers });
  }

  createTask(task: Task): Observable<Task> {

    return this.http.post<Task>(this.apiUrl, task);
  }

  updateTask(id: number, task: Task): Observable<Task> {

    return this.http.put<Task>(
      `${this.apiUrl}/${id}`,
      task
    );
  }

  deleteTask(id: number): Observable<string> {

    return this.http.delete(
      `${this.apiUrl}/${id}`,
      { responseType: 'text' }
    );
  }

  getTasksByPage(
    page: number,
    size: number,
    title?: string,
    status?: string
  ): Observable<any> {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    let url = `${this.apiUrl}/page?page=${page}&size=${size}`;

    if (title) {
      url += `&title=${encodeURIComponent(title)}`;
    }

    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }

    return this.http.get<any>(url, { headers });
  }

  searchByTitle(title: string): Observable<Task[]> {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<Task[]>(
      `${this.apiUrl}/search/title?title=${encodeURIComponent(title)}`,
      { headers }
    );
  }

  searchByStatus(status: string): Observable<Task[]> {

    return this.http.get<Task[]>(
      `${this.apiUrl}/filter?status=${status}`
    );
  }

  sortTasks(field: string): Observable<Task[]> {

    return this.http.get<Task[]>(
      `${this.apiUrl}/sort?field=${field}`
    );
  }
}