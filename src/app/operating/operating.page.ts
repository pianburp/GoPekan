// operating.page.ts
import { Component, OnInit } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc, collection, getDocs } from '@angular/fire/firestore';
import { AlertController } from '@ionic/angular';

interface HoursData {
  open: string;
  close: string;
  isOpen: boolean;
  is24Hours?: boolean;
}

interface OperatingHours {
  [key: string]: HoursData;
}

interface Restaurant {
  id: string;
  name: string;
  operatingHours?: OperatingHours;
}

@Component({
  selector: 'app-operating',
  templateUrl: './operating.page.html',
  styleUrls: ['./operating.page.scss'],
})
export class OperatingPage implements OnInit {
  restaurants: Restaurant[] = [];
  selectedRestaurantId: string = '';
  operatingHours: OperatingHours = {};
  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  is24HoursEnabled: boolean = false;
  
  constructor(
    private firestore: Firestore,
    private alertController: AlertController
  ) {
    this.initializeHours();
  }

  ngOnInit() {
    this.loadRestaurants();
  }

  initializeHours() {
    this.days.forEach(day => {
      this.operatingHours[day] = {
        open: '09:00',
        close: '17:00',
        isOpen: true,
        is24Hours: false
      };
    });
  }

  toggle24Hours(enabled: boolean) {
    this.is24HoursEnabled = enabled;
    this.days.forEach(day => {
      this.operatingHours[day] = {
        open: enabled ? '00:00' : '09:00',
        close: enabled ? '23:59' : '17:00',
        isOpen: enabled,
        is24Hours: enabled
      };
    });
  }

  async loadRestaurants() {
    try {
      const restaurantsRef = collection(this.firestore, 'restaurant');
      const querySnapshot = await getDocs(restaurantsRef);
      
      this.restaurants = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Restaurant));

      if (this.restaurants.length === 0) {
        this.showAlert('Info', 'No restaurants found.');
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
      this.showAlert('Error', 'Failed to load restaurants');
    }
  }

  async onRestaurantChange(event: any) {
    this.selectedRestaurantId = event.detail.value;
    if (this.selectedRestaurantId) {
      await this.loadRestaurantHours();
    } else {
      this.initializeHours();
    }
  }

  async loadRestaurantHours() {
    if (!this.selectedRestaurantId) return;

    try {
      const restaurantRef = doc(this.firestore, 'restaurant', this.selectedRestaurantId);
      const restaurantSnap = await getDoc(restaurantRef);

      const data = restaurantSnap.data();
      if (restaurantSnap.exists() && data && data['operatingHours']) {
        this.operatingHours = data['operatingHours'];
        // Check if all days are 24 hours
        this.is24HoursEnabled = this.days.every(day => 
          this.operatingHours[day]?.is24Hours === true
        );
        // Ensure all days exist in the map
        this.days.forEach(day => {
          if (!this.operatingHours[day]) {
            this.operatingHours[day] = {
              open: '09:00',
              close: '17:00',
              isOpen: true,
              is24Hours: false
            };
          }
        });
      } else {
        this.initializeHours();
      }
    } catch (error) {
      console.error('Error loading operating hours:', error);
      this.showAlert('Error', 'Failed to load operating hours');
    }
  }

  async saveOperatingHours() {
    if (!this.selectedRestaurantId) {
      this.showAlert('Error', 'Please select a restaurant');
      return;
    }

    try {
      const restaurantRef = doc(this.firestore, 'restaurant', this.selectedRestaurantId);
      await updateDoc(restaurantRef, {
        operatingHours: this.operatingHours
      });
      
      this.showAlert('Success', 'Operating hours saved successfully');
    } catch (error) {
      console.error('Error saving operating hours:', error);
      this.showAlert('Error', 'Failed to save operating hours');
    }
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  getDayDisplayName(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }
}