import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { HttpInterceptorFn } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('attaches the stored login token to team API requests', () => {
    localStorage.setItem('token', 'fresh-login-token');

    http.get('http://localhost:8080/api/teams').subscribe();

    const request = httpTestingController.expectOne('http://localhost:8080/api/teams');
    expect(request.request.headers.get('Authorization')).toBe('Bearer fresh-login-token');
    request.flush([]);
  });

  it('uses the token saved by login for subsequent team requests', () => {
    const authService = TestBed.inject(AuthService);
    authService.login({ email: 'admin@example.com', password: 'password' }).subscribe();

    const login = httpTestingController.expectOne('http://localhost:8080/api/auth/login');
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush({ token: 'new-session-token', workspaceRole: 'ADMIN' });

    http.get('http://localhost:8080/api/teams').subscribe();

    const teams = httpTestingController.expectOne('http://localhost:8080/api/teams');
    expect(teams.request.headers.get('Authorization')).toBe('Bearer new-session-token');
    teams.flush([]);
  });

  it('clears an unauthorized session and returns the user to login', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    localStorage.setItem('token', 'expired-token');

    http.get('http://localhost:8080/api/teams').subscribe({
      error: () => undefined
    });

    const request = httpTestingController.expectOne('http://localhost:8080/api/teams');
    request.flush({ status: 401 }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
