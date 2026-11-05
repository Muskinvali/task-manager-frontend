import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';

import { Dashboard } from './features/dashboard/dashboard';
import { TaskList } from './features/tasks/task-list/task-list';
import { TeamList } from './features/teams/team-list/team-list';
import { TeamDetails } from './features/teams/team-details/team-details';
export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: Login
  },

  {
    path: 'register',
    component: Register
  },

  {
  path: 'dashboard',
  component: Dashboard
},

{
    path: 'tasks',
    component: TaskList
},
{
    path: 'teams',
    component: TeamList
},
{
    path: 'teams/:teamId',
    component: TeamDetails
}

];