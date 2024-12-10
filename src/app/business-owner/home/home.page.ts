import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingController, AlertController, PopoverController } from '@ionic/angular';
import { Auth, onAuthStateChanged, User, Unsubscribe } from '@angular/fire/auth';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { ProfilePopoverComponent } from './components/profile-popover.component';

interface Restaurant {
  id: string;
  name: string;
  desc: string;
  ownerId: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  restaurants: Restaurant[] = [];
  isSearchbarCollapsed: boolean = false;
  lastScrollPosition: number = 0;
  isLoading: boolean = true; // Add loading state
  private authUnsubscribe: Unsubscribe | null = null;
  private currentUser: User | null = null;
  private loading: HTMLIonLoadingElement | null = null;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private popoverController: PopoverController,
    private router: Router
  ) {}

  async ngOnInit() {
    // Set up auth state listener
    this.authUnsubscribe = onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        // User is signed in
        this.currentUser = user;
        await this.loadRestaurants();
      } else {
        // User is signed out
        this.currentUser = null;
        this.restaurants = [];
        this.isLoading = false; // Set loading to false when user is logged out
        // Redirect to login page
        this.router.navigate(['/login']);
      }
    }, (error) => {
      console.error('Auth state error:', error);
      this.isLoading = false; // Set loading to false on error
      this.showError('Authentication error occurred');
    });
  }

  ngOnDestroy() {
    // Clean up auth listener when component is destroyed
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
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

  async loadRestaurants() {
    if (!this.currentUser?.uid) {
      console.log('No user ID available');
      this.isLoading = false;
      return;
    }

    try {
      this.isLoading = true; // Set loading state before fetching data
      
      this.loading = await this.loadingCtrl.create({
        message: 'Loading your restaurants...',
        duration: 2000
      });
      
      await this.loading.present();
      
      const restaurantsRef = collection(this.firestore, 'restaurant');
      const q = query(
        restaurantsRef, 
        where('ownerId', '==', this.currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      
      this.restaurants = querySnapshot.docs.map(doc => ({
        ...(doc.data() as Omit<Restaurant, 'id'>),
        id: doc.id
      }));

    } catch (error) {
      console.error('Error loading restaurants:', error);
      await this.showError('Unable to load your restaurants. Please try again later.');
    } finally {
      this.isLoading = false; // Set loading to false after data is loaded
      if (this.loading) {
        await this.loading.dismiss();
        this.loading = null;
      }
    }
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

  async navigateToEditRestaurant(restaurantId: string) {
    if (!restaurantId) {
      await this.showError('Restaurant ID not found.');
      return;
    }
  
    try {
      await this.router.navigate(['/business/edit-restaurant', restaurantId]);
    } catch (error) {
      console.error('Navigation error:', error);
      await this.showError('Unable to edit restaurant. Please try again.');
    }
  }

  async navigateToRestaurant() {
    await this.router.navigate(['/business/add-restaurant']);
  }

  private async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}