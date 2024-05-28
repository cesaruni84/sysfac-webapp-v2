import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { NgChartsModule } from 'ng2-charts';

import { ChartsComponent } from './charts.component';
import { ChartsRoutes } from "./charts.routing";


@NgModule({
  imports: [
    CommonModule,
    MatListModule,
    MatCardModule,
    NgChartsModule,
    RouterModule.forChild(ChartsRoutes)
  ],
  declarations: [ChartsComponent]
})
export class AppChartsModule { }
