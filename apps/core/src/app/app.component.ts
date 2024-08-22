import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcomeComponent } from './nx-welcome.component';
import { WebcomponentsComponent } from 'webcomponents';
import { LadonComponent } from 'ladon-theme';

@Component({
  standalone: true,
  imports: [NxWelcomeComponent, RouterModule, WebcomponentsComponent, LadonComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'core';
}
