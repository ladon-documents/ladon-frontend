import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { usermanagerRoutes } from './usermanager.routes';

@Component({
  selector: 'ldn-mf-usermanager',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './usermanager.component.html',
  styleUrl: './usermanager.component.scss',
})
export class UsermanagerComponent implements AfterViewInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngAfterViewInit(): void {
    console.info('Routes', usermanagerRoutes);
    this.router.navigate(['users'], { relativeTo: this.route });
  }
}
