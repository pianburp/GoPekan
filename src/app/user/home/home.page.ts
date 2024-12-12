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
  id: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  restaurants: Restaurant[] = [];
  filteredRestaurants: Restaurant[] = [];
  isSearchbarCollapsed: boolean = false;
  lastScrollPosition: number = 0;
  searchTerm: string = '';
  isLoading: boolean = false;

  constructor(
    private auth: Auth,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private popoverController: PopoverController,
    private platform: Platform,
    private firestore: Firestore
  ) {}

  async ngOnInit() {
    await this.loadRestaurants();
    this.filteredRestaurants = [...this.restaurants];
    await this.getTotalReviews();
  }

  handleSearch(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.filterRestaurants();
  }

  filterRestaurants() {
    if (!this.searchTerm) {
      this.filteredRestaurants = [...this.restaurants];
      return;
    }

    this.filteredRestaurants = this.restaurants.filter(restaurant => {
      return (
        restaurant.name.toLowerCase().includes(this.searchTerm) ||
        restaurant.desc.toLowerCase().includes(this.searchTerm)
      );
    });
  }

  async getTotalReviews() {
    try {
      let totalReviews = 0;

      // First get all restaurants
      const restaurantsRef = collection(this.firestore, 'restaurant');
      const restaurantSnapshot = await getDocs(restaurantsRef);

      // For each restaurant, get its reviews subcollection
      for (const restaurantDoc of restaurantSnapshot.docs) {
        const reviewsRef = collection(
          this.firestore,
          'restaurant',
          restaurantDoc.id,
          'reviews'
        );
        const reviewsSnapshot = await getDocs(reviewsRef);

        // Add the number of reviews for this restaurant
        const restaurantReviews = reviewsSnapshot.size;
        totalReviews += restaurantReviews;

        // Log individual restaurant review counts
        console.log(
          `${restaurantDoc.data()['name']}: ${restaurantReviews} reviews`
        );
      }

      // Log total reviews across all restaurants
      console.log(`Total reviews across all restaurants: ${totalReviews}`);
      return totalReviews;
    } catch (error) {
      console.error('Error counting total reviews:', error);
      throw error;
    }
  }

  async presentProfilePopover(event: any) {
    const popover = await this.popoverController.create({
      component: ProfilePopoverComponent,
      event: event,
      dismissOnSelect: true,
      translucent: true,
    });

    await popover.present();
  }

  handleScroll(event: any) {
    const currentScrollPosition = event.detail.scrollTop;

    if (
      currentScrollPosition > this.lastScrollPosition &&
      currentScrollPosition > 50
    ) {
      this.isSearchbarCollapsed = true;
    } else if (currentScrollPosition < this.lastScrollPosition) {
      this.isSearchbarCollapsed = false;
    }

    this.lastScrollPosition = currentScrollPosition;
  }

  async loadRestaurants() {
    try {
      this.isLoading = true;

      const restaurantsRef = collection(this.firestore, 'restaurant');
      const querySnapshot = await getDocs(restaurantsRef);
      
      this.restaurants = querySnapshot.docs.map(doc => ({
        ...(doc.data() as Omit<Restaurant, 'id'>),
        id: doc.id 
      }));
      
      this.filteredRestaurants = [...this.restaurants];
      this.isLoading = false;
    } catch (error) {
      this.isLoading = false;
      console.error('Error loading restaurants:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Unable to load restaurants. Please try again later.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async navigateToReviews(restaurantId: string) {
    if (!restaurantId) {
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Restaurant ID not found.',
        buttons: ['OK'],
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
        buttons: ['OK'],
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
        buttons: ['OK'],
      });
      await alert.present();
    }
  }
}
