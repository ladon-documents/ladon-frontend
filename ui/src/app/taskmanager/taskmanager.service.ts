import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TasksService, DocumentsService, DocumentModel, TaskStatusModel } from '../../api';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TaskmanagerService {
  constructor(
    private http: HttpClient,
    private documentsService: DocumentsService,
    private tasksService: TasksService,
  ) {}

  filterAvailableTasks(filterQuery?: string): Observable<string[]> {
    return this.tasksService.getAvailableTasks().pipe(
      map((tasks: string[]) => {
        if (filterQuery) {
          return tasks.filter((task) => task.includes(filterQuery));
        }
        return tasks;
      }),
    );
  }

  retrieveActiveTasks(): Observable<TaskStatusModel[]> {
    return this.tasksService.getActiveTasks();
  }

  taskStart(name: string): Observable<{ [key: string]: string }> {
    return this.tasksService.startTask(name, {});
  }

  stopTask(id: string): Observable<string> {
    return this.tasksService.stopTask(id);
  }

  retrieveLogs(name: string): Observable<DocumentModel[]> {
    return this.http.get<DocumentModel[]>('public/mocks/ausgaben_liste.json');
    // return this.documentsService.listDocuments('_system', undefined, undefined, `tasks/${name}/`);
  }

  retrieveLog(bucket: string, key: string): Observable<string> {
    return this.http.get(`public/mocks/ausgabe_inhalt.txt`, { responseType: 'text' as 'text' });
    // return this.documentsService.getDocument(bucket, key);
  }
}
