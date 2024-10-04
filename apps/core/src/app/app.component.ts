import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcomeComponent } from './nx-welcome.component';
import { WebcomponentsComponent } from 'webcomponents';
import { NavigationComponent } from 'navigation';

@Component({
  standalone: true,
  imports: [
    NxWelcomeComponent, RouterModule, WebcomponentsComponent, NavigationComponent
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'core';
}
