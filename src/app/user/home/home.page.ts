// home.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, AlertController, PopoverController } from '@ionic/angular';
import { Auth } from '@angular/fire/auth';
import { signOut } from '@angular/fire/auth';
import { Platform } from '@ionic/angular';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

interface Restaurant {
  name: string;
  desc: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  restaurants: Restaurant[] = [];
  isSearchbarCollapsed: boolean = false;
  lastScrollPosition: number = 0;

  constructor(
    private auth: Auth,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private popoverController: PopoverController,
    private platform: Platform,
    private firestore: Firestore
  ) { }

  async ngOnInit() {
    await this.loadRestaurants();
  }

  handleScroll(event: any) {
    const currentScrollPosition = event.detail.scrollTop;
    
    // Determine scroll direction and position
    if (currentScrollPosition > this.lastScrollPosition && currentScrollPosition > 50) {
      // Scrolling down and past threshold
      this.isSearchbarCollapsed = true;
    } else if (currentScrollPosition < this.lastScrollPosition) {
      // Scrolling up
      this.isSearchbarCollapsed = false;
    }
    
    this.lastScrollPosition = currentScrollPosition;
  }

  async loadRestaurants() {
    try {
      const loading = await this.loadingCtrl.create({
        message: 'Loading restaurants...'
      });
      await loading.present();

      const restaurantsRef = collection(this.firestore, 'restaurant');
      const querySnapshot = await getDocs(restaurantsRef);
      
      this.restaurants = querySnapshot.docs.map(doc => {
        const data = doc.data() as Restaurant;
        return data;
      });

      await loading.dismiss();
    } catch (error) {
      console.error('Error loading restaurants:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Unable to load restaurants. Please try again later.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async navigateToProfile() {
    try {
      const popover = await this.popoverController.getTop();
      if (popover) {
        await popover.dismiss();
      }
      await this.router.navigate(['/user/profile']);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Failed to logout. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }
}