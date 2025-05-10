import { Component, OnInit } from '@angular/core';
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
export class UsermanagerComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}
  ngOnInit(): void {
    this.router.navigate(['users'], { relativeTo: this.route });
    console.info('Routes', usermanagerRoutes);
  }
}
