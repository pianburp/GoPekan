import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, AlertController, PopoverController } from '@ionic/angular';
import { Auth } from '@angular/fire/auth';
import { signOut } from '@angular/fire/auth';
import { Platform } from '@ionic/angular';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { ProfilePopoverComponent } from './components/profile-popover.component';

interface Restaurant {
  name: string;
  desc: string;
  id: string; // Make id required instead of optional
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

  async presentProfilePopover(event: any) {
    const popover = await this.popoverController.create({
      component: ProfilePopoverComponent,
      event: event,
      dismissOnSelect: true,
      translucent: true
    });
    
    await popover.present();
  }

  handleScroll(event: any) {
    const currentScrollPosition = event.detail.scrollTop;
    
    if (currentScrollPosition > this.lastScrollPosition && currentScrollPosition > 50) {
      this.isSearchbarCollapsed = true;
    } else if (currentScrollPosition < this.lastScrollPosition) {
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
      
      this.restaurants = querySnapshot.docs.map(doc => ({
        ...(doc.data() as Omit<Restaurant, 'id'>),
        id: doc.id // Explicitly add the id
      }));

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

  // Updated navigation method with null check
  async navigateToReviews(restaurantId: string) {
    if (!restaurantId) {
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Restaurant ID not found.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }
  
    try {
      await this.router.navigate(['/user/review', restaurantId]);
    } catch (error) {
      console.error('Navigation error:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Unable to load reviews. Please try again.',
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