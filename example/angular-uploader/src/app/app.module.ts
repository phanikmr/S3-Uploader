import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';


import { AppComponent } from './app.component';
import { AppRouting } from './app.routing';
import { FileUploadService } from './file-upload.service';
import { APIServie } from './api.service';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule, CommonModule, RouterModule, AppRouting, FormsModule, HttpClientModule
  ],
  providers: [FileUploadService, APIServie],
  bootstrap: [AppComponent]
})
export class AppModule { }
