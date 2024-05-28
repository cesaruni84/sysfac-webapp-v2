import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog as MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { AppInboxService } from './app-inbox.service';
import { MailComposeComponent } from './mail-compose.component';

@Component({
  selector: 'app-inbox',
  templateUrl: './app-inbox.component.html',
  styleUrls: ['./app-inbox.component.css'],
  providers: [AppInboxService]
})
export class AppInboxComponent implements OnInit, OnDestroy {
  isMobile;
  screenSizeWatcher: Subscription;
  isSidenavOpen: Boolean = true;
  selectToggleFlag = false;
  @ViewChild(MatSidenav) private sideNav: MatSidenav;
  messages;


  constructor(private router: Router,
    private breakpointObserver: BreakpointObserver,
    public composeDialog: MatDialog,
    private inboxService: AppInboxService) { }

  ngOnInit() {
    this.inboxSideNavInit();
    this.messages = this.inboxService.messages;
  }
  ngOnDestroy() {
    if(this.screenSizeWatcher) {
      this.screenSizeWatcher.unsubscribe()
    }
  }
  openComposeDialog() {
    const dialogRef = this.composeDialog.open(MailComposeComponent);
    dialogRef.afterClosed().subscribe(result => { });
  }
  selectToggleAll() {
    this.selectToggleFlag = !this.selectToggleFlag;
    this.messages.forEach((msg) => { msg.selected = this.selectToggleFlag });
  }

  stopProp(e) {
    e.stopPropagation()
  }

  updateSidenav() {
    let self = this;
    setTimeout(() => {
      self.isSidenavOpen = !self.isMobile;
      self.sideNav.mode = self.isMobile ? 'over' : 'side';
    })
  }
  inboxSideNavInit() {
    this.isMobile = this.breakpointObserver.isMatched('(max-width: 959px)');
    this.updateSidenav();

    this.screenSizeWatcher = this.breakpointObserver.observe('(max-width: 959px)').subscribe(result => {
      this.isMobile = result.matches;
      this.updateSidenav();
    });
  }
}
