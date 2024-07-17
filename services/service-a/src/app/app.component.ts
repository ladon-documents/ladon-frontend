import { Component, OnInit } from '@angular/core';
import { ServiceService } from './services/service.service';

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [ServiceService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'service-a';

  constructor(private serviceService: ServiceService) {

  }

  ngOnInit(): void {
    this.title = this.serviceService.title
  }
}
