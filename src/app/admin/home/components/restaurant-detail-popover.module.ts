import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RestaurantDetailPopoverComponent } from './restaurant-detail-popover.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule
  ],
  declarations: [RestaurantDetailPopoverComponent],
  exports: [RestaurantDetailPopoverComponent]
})
export class RestaurantDetailPopoverModule {}