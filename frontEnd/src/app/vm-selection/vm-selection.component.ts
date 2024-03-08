import { Component, OnInit  } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-vm-selection',
  templateUrl: './vm-selection.component.html',
  styleUrls: ['./vm-selection.component.css']
})
export class VmSelectionComponent implements OnInit {
  username!: string ;
  roles!: string;
  credits!: number;
  apiUrl = 'http://localhost:3000/create-vm';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    // @ts-ignore
    this.username = localStorage.getItem('username');
    this.roles = localStorage.getItem('roles') || '';
    this.credits = parseInt(localStorage.getItem('credits') || '0', 10);
  }

  logout() {
    localStorage.removeItem('username');
    localStorage.removeItem('roles');
    localStorage.removeItem('credits');
    this.router.navigate(['/login']);
  }

  createVM(vmType: string) {
    // Vérifiez si l'utilisateur a suffisamment de crédits
    if (this.credits <= 0) {
      alert('You do not have enough credits to create a VM.');
      return;
    }

    const requestBody = { vmType };
    this.http.post(this.apiUrl, requestBody).subscribe({
      next: (response) => {
        console.log('VM creation initiated', response);
        alert(`Creation of ${vmType} VM initiated.`);
      },
      error: (error) => {
        console.error('Error creating VM', error);
        alert(`Error creating ${vmType} VM. Please try again.`);
      }
    });
  }

}
