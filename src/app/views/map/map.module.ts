import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { GoogleMapsModule } from '@angular/google-maps';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';

import { MapComponent } from './map.component';
import { MapRoutes } from "./map.routing";

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    GoogleMapsModule,
    HttpClientModule,
    HttpClientJsonpModule,
    RouterModule.forChild(MapRoutes)
  ],
  declarations: [MapComponent]
})
export class AppMapModule { }
