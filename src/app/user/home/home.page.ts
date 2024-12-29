import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, AlertController, PopoverController } from '@ionic/angular';
import { Auth , signOut } from '@angular/fire/auth';
import { Platform } from '@ionic/angular';
import { Firestore, collection, getDocs , query, where, DocumentData} from '@angular/fire/firestore';
import { ProfilePopoverComponent } from './components/profile-popover.component';

interface Restaurant {
  name: string;
  desc: string;
  id: string;
  imageUrl?: string;
  isVerified: boolean;
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
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'https://ionicframework.com/docs/img/demos/card-media.png';
    }
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
      // Create a query to only get verified restaurants
      const verifiedQuery = query(restaurantsRef, where('isVerified', '==', true));
      const querySnapshot = await getDocs(verifiedQuery);
      
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

}