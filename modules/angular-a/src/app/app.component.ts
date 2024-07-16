import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import { AppComponent as ServiceComponent } from 'service-a/src/app/app.component'

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
    // const serviceCmp = new ServiceComponent()
    // this.title = serviceCmp.fetchTitle()
  }
}
