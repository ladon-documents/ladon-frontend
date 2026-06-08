import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DocumentModel, TaskStatusModel } from '@ladon/api';
import { map } from 'rxjs/operators';
import { from, Observable } from 'rxjs';
import { FetchApiFactory } from '../services/api/fetch-api.factory';

@Injectable({
  providedIn: 'root',
})
export class TaskmanagerService {
  constructor(
    private http: HttpClient,
    private apiFactory: FetchApiFactory,
  ) {}

  filterAvailableTasks(filterQuery?: string): Observable<string[]> {
    return from(this.apiFactory.tasksApi.getAvailableTasks()).pipe(
      map((tasks: string[]) => {
        if (filterQuery) {
          return tasks.filter((task) => task.includes(filterQuery));
        }
        return tasks;
      }),
    );
  }

  retrieveActiveTasks(): Observable<TaskStatusModel[]> {
    return from(this.apiFactory.tasksApi.getActiveTasks() as Promise<TaskStatusModel[]>);
  }

  taskStart(name: string): Observable<{ [key: string]: string }> {
    return from(
      this.apiFactory.tasksApi.startTask({
        name,
        requestBody: {},
      }),
    );
  }

  stopTask(id: string): Observable<string> {
    return from(
      this.apiFactory.tasksApi.stopTask({
        id,
      }),
    );
  }

  retrieveLogs(name: string): Observable<DocumentModel[]> {
    return from(
      this.apiFactory.documentsApi.listDocuments({
        bucket: '_system',
        prefix: `tasks/${name}/`,
      }) as Promise<DocumentModel[]>,
    );
  }

  retrieveLog(bucket: string, key: string): Observable<Blob> {
    return from(
      this.apiFactory.documentsApi.getDocument({
        bucket,
        key,
      }),
    );
  }

  retrieveMockJSON(name: string): Observable<DocumentModel[]> {
    return this.http.get<DocumentModel[]>(`public/mocks/${name}.json`);
  }
}
