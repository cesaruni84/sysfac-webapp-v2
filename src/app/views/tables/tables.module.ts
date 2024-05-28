import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatInputModule as MatInputModule } from '@angular/material/input';
import { MatPaginatorModule as MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule as MatTableModule } from '@angular/material/table';


import { TablesRoutes } from './tables.routing';
import { MaterialTableComponent } from './material-table/material-table.component';

@NgModule({
  imports: [
    CommonModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    RouterModule.forChild(TablesRoutes)
  ],
  declarations: [MaterialTableComponent]
})
export class TablesModule { }
