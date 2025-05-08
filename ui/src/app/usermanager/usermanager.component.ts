import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'ldn-mf-usermanager',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './usermanager.component.html',
  styleUrl: './usermanager.component.scss',
})
export class UsermanagerComponent {}
