import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CrudService } from '../crud.service';
import { MatDialogRef as MatDialogRef, MatDialog as MatDialog } from '@angular/material/dialog';
import { MatSnackBar as MatSnackBar } from '@angular/material/snack-bar';
import { AppConfirmService } from '../../../shared/services/app-confirm/app-confirm.service';
import { AppLoaderService } from '../../../shared/services/app-loader/app-loader.service';
import { NgxTablePopupComponent } from './ngx-table-popup/ngx-table-popup.component';
import { Subscription } from 'rxjs';
import { egretAnimations } from "../../../shared/animations/egret-animations";
import { MatTableDataSource as MatTableDataSource } from '@angular/material/table';
import { MatPaginator as MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-crud-ngx-table',
  templateUrl: './crud-ngx-table.component.html',
  animations: egretAnimations
})
export class CrudNgxTableComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  public dataSource: any;
  public displayedColumns: any;
  public getItemSub: Subscription;
  constructor(
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private crudService: CrudService,
    private confirmService: AppConfirmService,
    private loader: AppLoaderService
  ) { }

  ngOnInit() {
    this.displayedColumns = this.getDisplayedColumns();
    this.getItems()
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  ngOnDestroy() {
    if (this.getItemSub) {
      this.getItemSub.unsubscribe()
    }
  }

  getDisplayedColumns() {
    return ['name', 'age', 'balance', 'company', 'status', 'actions'];
  }

  getItems() {    
    this.getItemSub = this.crudService.getItems()
      .subscribe(data => {
        this.dataSource = new MatTableDataSource(data);
      })
  }

  openPopUp(data: any = {}, isNew?) {
    let title = isNew ? 'Add new Customer' : 'Update Customer';
    let dialogRef: MatDialogRef<any> = this.dialog.open(NgxTablePopupComponent, {
      width: '720px',
      disableClose: true,
      data: { title: title, payload: data }
    })
    dialogRef.afterClosed()
      .subscribe(res => {
        if(!res) {
          // If user press cancel
          return;
        }
        if (isNew) {
          this.loader.open('Adding new Customer');
          this.crudService.addItem(res)
            .subscribe(data => {
              this.dataSource = data;
              this.loader.close();
              this.snack.open('Customer Added!', 'OK', { duration: 4000 })
            })
        } else {
          this.loader.open('Updating Customer');
          this.crudService.updateItem(data._id, res)
            .subscribe(data => {
              this.dataSource = data;
              this.loader.close();
              this.snack.open('Customer Updated!', 'OK', { duration: 4000 })
            })
        }
      })
  }
  deleteItem(row) {
    this.confirmService.confirm({message: `Delete ${row.name}?`})
      .subscribe(res => {
        if (res) {
          this.loader.open('Deleting Customer');
          this.crudService.removeItem(row)
            .subscribe(data => {
              this.dataSource = data;
              this.loader.close();
              this.snack.open('Customer deleted!', 'OK', { duration: 4000 })
            })
        }
      })
  }
}