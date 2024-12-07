import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReviewDashboardPageRoutingModule } from './review-dashboard-routing.module';

import { ReviewDashboardPage } from './review-dashboard.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReviewDashboardPageRoutingModule
  ],
  declarations: [ReviewDashboardPage]
})
export class ReviewDashboardPageModule {}
