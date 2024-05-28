import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog as MatDialog } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';

@Component({
  selector: 'mail-compose',
  templateUrl: './mail-compose.template.html'
})
export class MailComposeComponent implements OnInit {
  newMailData = {};
  mailForm: UntypedFormGroup;

  constructor(private composeDialog: MatDialog) { }

  ngOnInit() {
    this.mailForm = new UntypedFormGroup({
      to: new UntypedFormControl('', [
        Validators.required,
        Validators.email
      ]),
      subject: new UntypedFormControl('', [
        Validators.required
      ]),
      message: new UntypedFormControl('', [
        Validators.required
      ])
    })
  }
  sendEmail() {
    // console.log(this.mailForm.value);
  }
  closeDialog() {

  }
}
