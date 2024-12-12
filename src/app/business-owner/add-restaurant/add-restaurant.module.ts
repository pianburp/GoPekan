import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddRestaurantPageRoutingModule } from './add-restaurant-routing.module';

import { AddRestaurantPage } from './add-restaurant.page';
import { RestaurantMapComponent } from './components/map.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddRestaurantPageRoutingModule
  ],
  declarations: [AddRestaurantPage,RestaurantMapComponent]
})
export class AddRestaurantPageModule {}
