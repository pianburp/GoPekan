import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ProfilePopoverComponent } from './profile-popover.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule
  ],
  declarations: [ProfilePopoverComponent],
  exports: [ProfilePopoverComponent]
})
export class ProfilePopoverModule {}