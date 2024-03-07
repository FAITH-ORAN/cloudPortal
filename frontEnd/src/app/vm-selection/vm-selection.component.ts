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
}
