import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, AlertController, PopoverController } from '@ionic/angular';
import { Auth } from '@angular/fire/auth';
import { signOut } from '@angular/fire/auth';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage{
  isSearchbarCollapsed = false;
  lastScrollPosition = 0;
  cards = Array(3).fill(0).map((_, index) => index + 1);

  constructor(
    private auth: Auth,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private popoverController: PopoverController // Add PopoverController
  ) { }

  handleScroll(event: any) {
    const currentScrollPosition = event.detail.scrollTop;
    
    if (currentScrollPosition > this.lastScrollPosition && currentScrollPosition > 50) {
      this.isSearchbarCollapsed = true;
    } else if (currentScrollPosition < this.lastScrollPosition) {
      this.isSearchbarCollapsed = false;
    }
    
    this.lastScrollPosition = currentScrollPosition;
  }

  async logout() {
    // Dismiss popover first
    const popover = await this.popoverController.getTop();
    if (popover) {
      await popover.dismiss();
    }

    const loading = await this.loadingCtrl.create({
      message: 'Logging out...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await signOut(this.auth);
      await loading.dismiss();
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      await loading.dismiss();
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Could not log out. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
      console.error('Logout error:', error);
    }
  }

  async navigateToProfile() {
    // Dismiss popover first
    const popover = await this.popoverController.getTop();
    if (popover) {
      await popover.dismiss();
    }
    this.router.navigate(['/business/profile']);
  }

  async navigateToDashboard() {
    // Dismiss popover first
    const popover = await this.popoverController.getTop();
    if (popover) {
      await popover.dismiss();
    }
    this.router.navigate(['/business/dashboard']);
  }

}
