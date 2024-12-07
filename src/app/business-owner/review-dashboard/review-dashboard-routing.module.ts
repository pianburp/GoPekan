import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReviewDashboardPage } from './review-dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: ReviewDashboardPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReviewDashboardPageRoutingModule {}
