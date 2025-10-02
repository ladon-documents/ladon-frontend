import { Component, inject, OnInit } from '@angular/core';
import { UsermanagerService } from '../services/usermanager.service';
import { ActivatedRoute } from '@angular/router';
import { UsermanagerStore } from '../../store/usermanager.store';
import { tap } from 'rxjs/internal/operators/tap';
import { RoleEntryModel } from '../../../api';
import { combineLatest, switchMap } from 'rxjs';

@Component({
  selector: 'app-role-details',
  imports: [],
  templateUrl: './role-details.component.html',
  styleUrl: './role-details.component.scss',
})
export class RoleDetailsComponent implements OnInit {
  role: RoleEntryModel | undefined;
  private readonly route = inject(ActivatedRoute);
  private readonly usermanagerService = inject(UsermanagerService);
  readonly store = inject(UsermanagerStore);

  ngOnInit(): void {
    this.route.params
      .pipe(
        tap(({ id }) => {
          this.role = this.store.getRole(id);
        }),
        switchMap(({ id }) =>
          combineLatest([
            this.usermanagerService.retrievePermissionsByRole(id),
            this.usermanagerService.retrieveUsersByRole(id),
          ]),
        ),
      )
      .subscribe({
        next: (payload) => {
          const { 0: permissions, 1: users } = payload;
          console.log('Permissions for role:', permissions);
          console.log('Users with role:', users);
          debugger;
        },
      });
    // Fetch role details using the route parameter
  }
}
