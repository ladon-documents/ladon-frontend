import { Component, inject, OnInit } from '@angular/core';
import { PermissionModel } from '../../../api';
import { AliasPipe } from '@ladon/shared';
import { ActivatedRoute, Router } from '@angular/router';
import { UsermanagerService } from '../services/usermanager.service';
import { UsermanagerFacade } from '../services/usermanager.facade';
import { UsermanagerStore } from '../../store/usermanager.store';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { tap } from 'rxjs/internal/operators/tap';

@Component({
  selector: 'app-permission-details',
  providers: [UsermanagerFacade],
  imports: [AliasPipe, ReactiveFormsModule],
  templateUrl: './permission-details.component.html',
  styleUrl: './permission-details.component.scss',
})
export class PermissionDetailsComponent implements OnInit {
  permission: PermissionModel | undefined;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usermanagerService = inject(UsermanagerService);
  private readonly usermanagerFacade = inject(UsermanagerFacade);
  readonly store = inject(UsermanagerStore);
  permissionForm = new FormGroup({
    allowed: new FormControl(),
    description: new FormControl(),
    permissionId: new FormControl(),
    type: new FormControl(),
    operation: new FormControl(),
    value: new FormControl(),
  });

  ngOnInit(): void {
    this.route.params
      .pipe(
        tap(({ id }) => {
          this.permission = this.store.getPermission(id);
        }),
        tap(() => {
          this.permissionForm.patchValue(this.permission!);
        }),
      )
      .subscribe({
        next: (payload) => {
          // this.updateViewByPayload(payload);
        },
      });
  }

  onSubmit() {}

  deletePermission() {
    this.store.deletePermission(this.permission!.permissionId);
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
