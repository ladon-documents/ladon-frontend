import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FancyLogger } from 'fancy-logger';
import { AppAngularBComponent } from 'angular-b/src/app/app.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'angular-a';

  ngOnInit(): void {
    this.title = FancyLogger.getTitle()
  }
}
