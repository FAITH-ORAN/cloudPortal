import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-vm-selection',
  templateUrl: './vm-selection.component.html',
  styleUrls: ['./vm-selection.component.css']
})
export class VmSelectionComponent implements OnInit {
  username!: string;
  roles!: string;
  credits!: number;
  apiUrl = 'http://localhost:3000/create-vm';
  faCloud = faCloud;

  isLoading = false;
  vmCreationStates: { [key: string]: boolean } = {
    ubuntu: false,
    debian: false,
    windows: false,
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.username = localStorage.getItem('username') || '';
    this.roles = localStorage.getItem('roles') || '';
    this.credits = parseInt(localStorage.getItem('credits') || '0', 10);
  }

  logout() {
    localStorage.clear(); // Clears all localStorage data
    this.router.navigate(['/login']);
  }

  createVM(vmType: string) {
    if (this.credits <= 0) {
      this.toastr.error('You do not have enough credits to create a VM.');
      return;
    }

    this.isLoading = true;
    this.vmCreationStates[vmType] = true; // Start loading for this VM type

    const requestBody = { vmType };
    this.http.post(this.apiUrl, requestBody, { withCredentials: true }).subscribe({
      next: (response) => {
        console.log('VM creation initiated', response);
        this.toastr.success(`Creation of ${vmType} VM initiated.`);
        this.isLoading = false; // Stop loading
        this.vmCreationStates[vmType] = true; 
      },
      error: (error) => {
        console.error('Error creating VM', error);
        this.toastr.error(`Error creating ${vmType} VM. Please try again.`);
        this.isLoading = false; // Stop loading
        this.vmCreationStates[vmType] = false; // Reset state in case of failure
      }
    });
  }
}
