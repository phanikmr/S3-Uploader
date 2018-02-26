import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';


import { AppComponent } from './app.component';

const appRoutes: Routes = [
    { path: 'facility-upload', component: AppComponent },
    { path: '', redirectTo: 'facility-upload', pathMatch: 'full'}
];


export const AppRouting: ModuleWithProviders = RouterModule.forRoot(appRoutes);
