import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReviewPageRoutingModule } from './review-routing.module';

import { ReviewPage } from './review.page';
import { RestaurantMapComponent } from './components/restaurant-map.component';
import { ReviewFormComponent } from './components/review-form.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReviewPageRoutingModule
  ],
  declarations: [ReviewPage, RestaurantMapComponent, ReviewFormComponent  ]
})
export class ReviewPageModule {}
