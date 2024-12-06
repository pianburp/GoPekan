import { Component } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';

@Component({
  template: `
    <ion-list>
      <ion-item button (click)="navigateToProfile()">
        <ion-icon name="person-outline" slot="start"></ion-icon>
        <ion-label>Profile</ion-label>
      </ion-item>
      <ion-item button (click)="logout()">
        <ion-icon name="log-out-outline" slot="start"></ion-icon>
        <ion-label>Logout</ion-label>
      </ion-item>
    </ion-list>
  `
})
export class ProfilePopoverComponent {
  constructor(
    private popoverController: PopoverController,
    private router: Router,
    private auth: Auth
  ) {}

  async navigateToProfile() {
    await this.popoverController.dismiss();
    await this.router.navigate(['/user/profile']);
  }

  async logout() {
    try {
      await this.auth.signOut();
      await this.popoverController.dismiss();
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}