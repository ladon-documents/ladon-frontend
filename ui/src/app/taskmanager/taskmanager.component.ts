import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { TaskmanagerService } from './taskmanager.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroPlayCircle, heroStopCircle } from '@ng-icons/heroicons/outline';
import {
  Observable,
  switchMap,
  tap,
  interval,
  takeUntil,
  Subject,
  groupBy,
  mergeMap,
  toArray,
  map,
  from,
  filter,
} from 'rxjs';
import { CommonModule } from '@angular/common';
import { DocumentModel, TaskStatusModel } from '../../api';
import { FilemanagerContentFacade } from '../filemanager/filemanager-content/filemanager-content.facade';

@Component({
  selector: 'app-taskmanager',
  standalone: true,
  imports: [NgIconComponent, CommonModule],
  providers: [provideIcons({ heroPlayCircle, heroStopCircle })],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './taskmanager.component.html',
  styleUrl: './taskmanager.component.scss',
})
export class TaskmanagerComponent implements OnInit {
  availableTasks$: Observable<string[]> | undefined;
  activeTasks$: Observable<TaskStatusModel[]> | undefined;
  activeLog$ = new Subject<string>();
  activeTask: string | undefined;
  activeLog: string | undefined;
  availableLogs: { created: string | undefined; logs: DocumentModel[] }[] | undefined;
  toggleChecked: boolean | undefined;
  scrolledDivs: { [key: string]: boolean } = {};

  private readonly taskFilterQuery = 'Demo';
  private taskStatusSubject = new Subject<boolean>();
  private taskmanagerService = inject(TaskmanagerService);
  private filemanagerContentFacade = inject(FilemanagerContentFacade);

  ngOnInit(): void {
    this.availableTasks$ = this.taskmanagerService.filterAvailableTasks(this.taskFilterQuery);
    this.activeTasks$ = this.taskmanagerService.retrieveActiveTasks().pipe(
      filter((tasks) => tasks.length !== 0),
      this.runTaskPolling(),
    );
  }

  onScroll(event: Event, objectKey: string) {
    const target = event.target as HTMLElement;
    this.scrolledDivs[objectKey] = target.scrollTop > 5;
  }

  selectTask(name: string): void {
    this.activeTask = name;
    this.taskmanagerService
      .retrieveLogs(name)
      .pipe(
        switchMap((logs) =>
          from(logs).pipe(
            map((log) => {
              return {
                ...log,
                created: log.created?.slice(0, log.created.indexOf('T')),
              } as DocumentModel;
            }),
            groupBy((log: DocumentModel) => log.created),
            mergeMap((group$) =>
              group$.pipe(
                toArray(),
                map((groupedLogs) => ({
                  created: group$.key,
                  logs: groupedLogs,
                })),
              ),
            ),
            toArray(),
          ),
        ),
      )
      .subscribe((logs) => {
        this.availableLogs = logs;
      });
  }

  playTask(name: string) {
    this.activeTasks$ = this.taskmanagerService.taskStart(name).pipe(this.runTaskPolling());
  }

  stopTask(name: string) {
    this.taskmanagerService.stopTask(name).subscribe((id) => {
      console.log(id);
      // this.taskStatusSubject.next(false);
    });
  }

  toggleAvailableTasks(event: Event) {
    const { checked } = event.target as HTMLInputElement;
    this.toggleChecked = checked;
    if (checked) {
      this.availableTasks$ = this.taskmanagerService.filterAvailableTasks();
    } else {
      this.availableTasks$ = this.taskmanagerService.filterAvailableTasks(this.taskFilterQuery);
    }
  }

  invokeLog(log: DocumentModel): void {
    const { bucket, key } = log;
    this.activeLog = key;
    this.taskmanagerService.retrieveLog(bucket!, key!).subscribe(async (log: Blob) => {
      this.activeLog$.next(await log.text());
    });
  }

  private runTaskPolling() {
    return switchMap(() =>
      interval(1000).pipe(
        takeUntil(this.taskStatusSubject),
        switchMap(() => this.taskmanagerService.retrieveActiveTasks()),
        tap((tasks) => {
          if (tasks.length === 0) {
            this.taskStatusSubject.next(true);
          }
        }),
        tap((tasks) => {
          this.filemanagerContentFacade.activeTasks.set(tasks);
        }),
      ),
    );
  }
}
