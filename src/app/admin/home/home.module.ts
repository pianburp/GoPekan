// src/app/admin/home/home.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { HomePageRoutingModule } from './home-routing.module';
import { ProfilePopoverModule } from './components/profile-popover.module';
import { RestaurantDetailPopoverModule } from './components/restaurant-detail-popover.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    ProfilePopoverModule,
    RestaurantDetailPopoverModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}