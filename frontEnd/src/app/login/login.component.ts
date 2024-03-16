import { Component } from '@angular/core';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import {Router} from "@angular/router";
import { AuthService} from "../auth.service";
import {HttpClient} from "@angular/common/http";
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginError: boolean = false;
  username!: string;
  password!: string;

  faCloud = faCloud;
  model: any = {};
  constructor(private router: Router,private authService: AuthService,private http: HttpClient,private toastr: ToastrService) { }


  onSubmit() {
    this.authService.login(this.model.username, this.model.password).subscribe({
      next: (response) => {
        this.router.navigate(['/vm-selection']);
        this.loginError = false;
      },
      error: (error) => {
        this.toastr.error('username or password are incorrect');
        this.loginError = true;
      }
    });
  }

}
