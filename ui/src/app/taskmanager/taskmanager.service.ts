import { Injectable } from '@angular/core';
import { TasksService, DocumentsService } from '../../api';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TaskmanagerService {
  constructor(
    private documentsService: DocumentsService,
    private tasksService: TasksService,
  ) {}

  filterAvailableTasks(filterQuery?: string) {
    return this.tasksService.getAvailableTasks().pipe(
      map((tasks: string[]) => {
        if (filterQuery) {
          return tasks.filter((task) => task.includes(filterQuery));
        }
        return tasks;
      }),
    );
  }

  retrieveActiveTasks() {
    return this.tasksService.getActiveTasks();
  }

  taskStart(name: string) {
    return this.tasksService.startTask(name, {});
  }

  stopTask(name: string) {
    return this.tasksService.stopTask(name);
  }

  retrieveLogs(name: string) {
    return this.documentsService.listDocuments('_system', undefined, undefined, `tasks/${name}/`);
  }
}
