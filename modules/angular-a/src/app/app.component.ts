import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ServiceService } from 'service-a/src/app/services/service.service'
import { FancyLogger } from 'fancy-logger';

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
    const service = new ServiceService()
    this.title = service.title
    FancyLogger.log('imported')
  }
}
