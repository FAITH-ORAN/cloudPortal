import { Component } from '@angular/core';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {


  faCloud = faCloud;
  model: any = {};
  constructor(private router: Router) { }


    onSubmit() {
      this.router.navigate(['/vm-selection']);
    }

}
