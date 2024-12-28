import { Component } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';

@Component({
  template: `
    <ion-list>
      <ion-item button (click)="navigateToDashboard()">
        <ion-icon name="bar-chart-outline" slot="start"></ion-icon>
        <ion-label>Dashboard</ion-label>
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

  async navigateToDashboard() {
    await this.popoverController.dismiss();
    await this.router.navigate(['/admin/dashboard']);
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