import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import {FormsModule} from "@angular/forms";
import {FontAwesomeTestingModule} from "@fortawesome/angular-fontawesome/testing";
import { VmSelectionComponent } from './vm-selection/vm-selection.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import {AuthService} from "./auth.service";

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    VmSelectionComponent,
    PageNotFoundComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    FontAwesomeTestingModule,
    HttpClientModule
  ],
  providers: [AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
