import { Component } from '@angular/core';
import {CommonModule} from "@angular/common";
import {NgIconComponent} from "@ng-icons/core";
import {SearchbarComponent} from "../searchbar/searchbar.component";

@Component({
  selector: 'filemanager',
  standalone: true,
  imports: [CommonModule, NgIconComponent, SearchbarComponent],
  templateUrl: './filemanager.component.html',
  styleUrl: './filemanager.component.scss'
})
export class FilemanagerComponent {

}
