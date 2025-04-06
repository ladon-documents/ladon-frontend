import { Component, OnInit } from '@angular/core';
import { TaskmanagerService } from './taskmanager.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroPlayCircle, heroStopCircle } from '@ng-icons/heroicons/outline';
import { Document, TaskStatus } from '../../api';
import { Observable, switchMap, tap, interval, takeUntil, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-taskmanager',
  standalone: true,
  imports: [NgIconComponent, CommonModule],
  providers: [provideIcons({ heroPlayCircle, heroStopCircle })],
  templateUrl: './taskmanager.component.html',
  styleUrl: './taskmanager.component.scss',
})
export class TaskmanagerComponent implements OnInit {
  availableTasks$: Observable<string[]> | undefined;
  activeTasks$: Observable<TaskStatus[]> | undefined;
  availableLogs: Document[] | undefined;
  toggleChecked: boolean | undefined;

  private readonly taskFilterQuery = 'Demo';
  private taskStatusSubject = new Subject<boolean>();

  constructor(private taskmanagerService: TaskmanagerService) {}

  ngOnInit(): void {
    this.availableTasks$ = this.taskmanagerService.filterAvailableTasks(this.taskFilterQuery);
  }

  selectTask(name: string): void {
    this.taskmanagerService.retrieveLogs(name).subscribe((logs) => {
      this.availableLogs = logs;
    });
  }

  playTask(name: string) {
    this.activeTasks$ = this.taskmanagerService.taskStart(name).pipe(this.runTaskPolling());
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
      ),
    );
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

  stopTask(name: string) {
    this.taskmanagerService.stopTask(name).subscribe((id) => {
      console.log(id);
      // this.taskStatusSubject.next(false);
    });
  }
}
