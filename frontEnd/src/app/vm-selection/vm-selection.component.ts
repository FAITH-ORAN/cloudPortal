import { Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
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
  faCopy = faCopy;

  isLoading = false;
  vmCreationStates: { [key: string]: boolean } = {
    ubuntu: false,
    debian: false,
    windows: false,
  };

  public connectionDetails: { [key: string]: { method: string, ipAddress: string, username?: string, password?: string, command?: string } | null } = {
    ubuntu: null,
    debian: null,
    windows: null,
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
      next: (response:any) => {
        this.toastr.success(`Creation of ${vmType} VM initiated.`);
        this.isLoading = false; // Stop loading
        this.vmCreationStates[vmType] = true; 
        this.connectionDetails[vmType] = response.connectionInfo;

        setTimeout(() => {
          this.vmCreationStates[vmType] = false; 
          this.connectionDetails[vmType] = null;
        }, 1000000);
      },
      error: (error) => {
        console.error('Error creating VM', error);
        this.toastr.error(`Error creating ${vmType} VM. Please try again.`);
        this.isLoading = false; // Stop loading
        this.vmCreationStates[vmType] = false; // Reset state in case of failure
      }
    });
  }


  copyToClipboard(text: string | undefined) {
    if (!text) {
      // Gérer le cas où la commande est undefined, peut-être afficher une erreur
      console.error('No command to copy');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      this.toastr.success('Command copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  }
}
