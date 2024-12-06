import { Component, OnInit } from '@angular/core';
import { LoadingController, AlertController, PopoverController } from '@ionic/angular';
import { Auth } from '@angular/fire/auth';
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
export class HomePage implements OnInit {
  restaurants: Restaurant[] = [];
  isSearchbarCollapsed: boolean = false;
  lastScrollPosition: number = 0;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private popoverController: PopoverController,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadRestaurants();
  }

  ionViewWillEnter() {
    if (this.auth.currentUser) {
      this.loadRestaurants();
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
    const currentUserId = this.auth.currentUser?.uid;
    
    if (!currentUserId) {
      console.log('No user ID available');
      return;
    }

    let loading = await this.loadingCtrl.create({
      message: 'Loading your restaurants...',
      duration: 2000 // Add a maximum duration to prevent infinite loading
    });
    
    try {
      await loading.present();
      const restaurantsRef = collection(this.firestore, 'restaurant');
      const q = query(
        restaurantsRef, 
        where('ownerId', '==', currentUserId)
      );
      
      const querySnapshot = await getDocs(q);
      
      this.restaurants = querySnapshot.docs.map(doc => ({
        ...(doc.data() as Omit<Restaurant, 'id'>),
        id: doc.id
      }));

    } catch (error) {
      console.error('Error loading restaurants:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Unable to load your restaurants. Please try again later.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      if (loading) {
        await loading.dismiss();
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
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Restaurant ID not found.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }
  
    try {
      await this.router.navigate(['/business/edit-restaurant', restaurantId]);
    } catch (error) {
      console.error('Navigation error:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Unable to edit restaurant. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async navigateToRestaurant() {
    await this.router.navigate(['/business/add-restaurant']);
  }

}

