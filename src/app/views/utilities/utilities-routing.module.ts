import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TypographyComponent } from './typography/typography.component';
import { ColorsComponent } from './colors/colors.component';

const routes: Routes = [
  {
    path: 'color',
    component: ColorsComponent
  },
  {
    path: 'typography',
    component: TypographyComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UtilitiesRoutingModule { }
