import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideRouter, RouterOutlet } from '@angular/router';
import { routes } from './usermanager.routes';

@Component({
  selector: 'ldn-mf-usermanager',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  providers: [provideRouter(routes)],
  templateUrl: './usermanager.component.html',
  styleUrl: './usermanager.component.scss',
})
export class UsermanagerComponent {}
