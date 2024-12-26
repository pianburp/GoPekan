import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { Firestore, collection, getDocs, doc, updateDoc } from '@angular/fire/firestore';

interface Restaurant {
  name: string;
  desc: string;
  id: string;
  imageUrl?: string;
  isVerified: boolean;
  ownerId: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  verifiedRestaurants: Restaurant[] = [];
  unverifiedRestaurants: Restaurant[] = [];

  constructor(
    private auth: Auth,
    private router: Router,
    private firestore: Firestore
  ) { }

  async ngOnInit() {
    await this.loadRestaurants();
  }

  async loadRestaurants() {
    try {
      const restaurantsRef = collection(this.firestore, 'restaurant');
      const querySnapshot = await getDocs(restaurantsRef);
      
      this.verifiedRestaurants = [];
      this.unverifiedRestaurants = [];

      querySnapshot.forEach((doc) => {
        const restaurant = { id: doc.id, ...doc.data() } as Restaurant;
        if (restaurant.isVerified) {
          this.verifiedRestaurants.push(restaurant);
        } else {
          this.unverifiedRestaurants.push(restaurant);
        }
      });
    } catch (error) {
      console.error('Error loading restaurants:', error);
    }
  }

  async verifyRestaurant(restaurant: Restaurant) {
    try {
      const restaurantRef = doc(this.firestore, 'restaurant', restaurant.id);
      await updateDoc(restaurantRef, {
        isVerified: true
      });
      // Reload restaurants after verification
      await this.loadRestaurants();
    } catch (error) {
      console.error('Error verifying restaurant:', error);
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']); 
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}