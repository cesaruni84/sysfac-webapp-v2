import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UtilitiesRoutingModule } from './utilities-routing.module';
import { SharedMaterialModule } from 'app/shared/shared-material.module';
import { TypographyComponent } from './typography/typography.component';
import { SharedDirectivesModule } from 'app/shared/directives/shared-directives.module';
import { ColorsComponent } from './colors/colors.component';

@NgModule({
  declarations: [TypographyComponent, ColorsComponent],
  imports: [
    CommonModule,
    SharedMaterialModule,
    SharedDirectivesModule,
    UtilitiesRoutingModule
  ]
})
export class UtilitiesModule { }
