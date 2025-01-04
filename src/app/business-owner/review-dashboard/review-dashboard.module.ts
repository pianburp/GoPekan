import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReviewDashboardPageRoutingModule } from './review-dashboard-routing.module';

import { ReviewDashboardPage } from './review-dashboard.page';
import {TrendPredictionChartComponent} from './components/trend-prediction-chart.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReviewDashboardPageRoutingModule
  ],
  declarations: [ReviewDashboardPage, TrendPredictionChartComponent]
})
export class ReviewDashboardPageModule {}
