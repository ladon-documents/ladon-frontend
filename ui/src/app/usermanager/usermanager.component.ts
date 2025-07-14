import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { usermanagerRoutes } from './usermanager.routes';

@Component({
  selector: 'usermanager',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './usermanager.component.html',
  styleUrl: './usermanager.component.scss',
})
export class UsermanagerComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit() {
    await this.router.navigate(['users'], { relativeTo: this.route });
  }
}
