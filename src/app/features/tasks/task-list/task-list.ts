import { Component, OnInit, inject } from '@angular/core';
import { TaskService } from '../../../services/task.service';
import { Task } from '../../../models/task';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.html',
  styleUrl: './task-list.css',
  imports: [FormsModule, RouterLink]
})
export class TaskList implements OnInit {
  private taskService = inject(TaskService);

  tasks: Task[] = [];

  get pendingTaskCount(): number {
    return this.tasks.filter(task => task.status !== 'COMPLETED').length;
  }

  get completedTaskCount(): number {
    return this.tasks.filter(task => task.status === 'COMPLETED').length;
  }

  currentPage = 0;
  pageSize = 5;
  totalPages = 0;
  searchTitle = '';
isSearching = false;

selectedStatus = '';
isFiltering = false;

sortField = '';
isSorting = false;

private requestVersion = 0;

filterByStatus(): void {

  this.currentPage = 0;

  this.isFiltering = !!this.selectedStatus;

  this.loadTasksByPage();
}

clearStatusFilter(): void {

  this.selectedStatus = '';
  this.isFiltering = false;
  this.currentPage = 0;

  this.loadTasksByPage();
}

loadTasksByPage(): void {

  const requestVersion = ++this.requestVersion;

  this.taskService.getTasksByPage(
    this.currentPage,
    this.pageSize,
    this.searchTitle.trim() || undefined,
    this.selectedStatus || undefined
  ).subscribe({

    next: (data) => {
      if (requestVersion !== this.requestVersion) {
        return;
      }

      this.tasks = data.content;
      this.totalPages = data.totalPages;

      if (this.totalPages > 0 && this.currentPage >= this.totalPages) {
        this.currentPage = this.totalPages - 1;
        this.loadTasksByPage();
      }
    },

    error: (error) => {
      console.error('Failed to load paginated tasks:', error);
    }

  });
}

searchTasks(): void {

  this.currentPage = 0;

  this.isSearching = !!this.searchTitle.trim();

  this.loadTasksByPage();
}


sortTasks(): void {

  if (!this.sortField) {
    this.isSorting = false;
    this.loadTasksByPage();
    return;
  }

  this.isSorting = true;
  this.currentPage = 0;
  const requestVersion = ++this.requestVersion;

  this.taskService.sortTasks(this.sortField).subscribe({

    next: (data) => {
      if (requestVersion !== this.requestVersion) {
        return;
      }

      this.tasks = data;
    },

    error: (error) => {
      console.error('Failed to sort tasks:', error);
    }

  });
}
clearSort(): void {

  this.sortField = '';
  this.isSorting = false;
  this.currentPage = 0;

  this.loadTasksByPage();
}

clearSearch(): void {

  this.searchTitle = '';
  this.isSearching = false;

  this.currentPage = 0;

  this.loadTasksByPage();
}

  showAddForm = false;

  newTask: Task = {
    id: 0,
    title: '',
    description: '',
    status: 'TODO'
  };

ngOnInit(): void {
  this.loadTasksByPage();
}

  openAddForm(): void {
    this.editingTaskId = null;
    this.newTask = {
      id: 0,
      title: '',
      description: '',
      status: 'TODO'
    };
    this.showAddForm = true;
  }

  cancelAdd(): void {
    this.showAddForm = false;
    this.editingTaskId = null;

    this.newTask = {
      id: 0,
      title: '',
      description: '',
      status: 'TODO'
    };
  }

addTask(): void {

  this.taskService.createTask(this.newTask).subscribe({

    next: (task) => {
      console.log('Task created:', task);

      this.cancelAdd();
      this.currentPage = 0;
      this.loadTasksByPage();
    },

    error: (error) => {
      console.error('Failed to create task:', error);
    }

  });
}
editingTaskId: number | null = null;
  editTask(task: Task): void {
  this.editingTaskId = task.id;

  this.newTask = {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status
  };

  this.showAddForm = true;
}



updateTask(): void {

  if (this.editingTaskId === null) {
    return;
  }

  if (!this.newTask.title.trim()) {
  alert('Task title is required');
  return;
}

if (!this.newTask.description.trim()) {
  alert('Task description is required');
  return;
}

  this.taskService.updateTask(
    this.editingTaskId,
    this.newTask
  ).subscribe({

    next: (updatedTask) => {

      console.log('Task updated:', updatedTask);

      this.cancelAdd();

      this.loadTasksByPage();
    },

    error: (error) => {
      console.error('Failed to update task:', error);
    }

  });
}

deleteTask(id: number): void {

  this.taskService.deleteTask(id).subscribe({

    next: () => {

      console.log('Task deleted');

      this.loadTasksByPage();
    },

    error: (error) => {
      console.error('Failed to delete task:', error);
    }

  });

}

previousPage(): void {
  if (this.currentPage > 0) {
    this.currentPage--;
    this.loadTasksByPage();
  }
}

nextPage(): void {
  if (this.currentPage + 1 < this.totalPages) {
    this.currentPage++;
    this.loadTasksByPage();
  }
}
}
