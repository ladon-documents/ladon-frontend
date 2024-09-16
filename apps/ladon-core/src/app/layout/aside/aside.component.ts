import {Component} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";

@Component({
  selector: "ldn-mf-aside",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./aside.component.html",
  styleUrl: "./aside.component.css",
})
export class AsideComponent {


  showMenu1(flag: boolean) {
    let icon1 = document.getElementById("icon1");
    let menu1 = document.getElementById("menu1");
    if (flag && icon1 && menu1) {
      icon1.classList.toggle("rotate-180");
      menu1.classList.toggle("hidden");
    }
  };


  showMenu2(flag: boolean) {
    let icon2 = document.getElementById("icon2");
    if (flag && icon2) {
      icon2.classList.toggle("rotate-180");
    }
  };

  showMenu3(flag: boolean) {
    let icon3 = document.getElementById("icon3");
    if (flag && icon3) {
      icon3.classList.toggle("rotate-180");
    }
  };

  showNav(flag: boolean) {
    let Main = document.getElementById("Main");
    let open = document.getElementById("open");
    let close = document.getElementById("close");
    if (flag && Main && open && close) {
      Main.classList.toggle("-translate-x-full");
      Main.classList.toggle("translate-x-0");
      open.classList.toggle("hidden");
      close.classList.toggle("hidden");
    }
  };
}
