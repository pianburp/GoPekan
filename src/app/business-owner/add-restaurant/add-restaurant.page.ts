import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged, User, Unsubscribe } from '@angular/fire/auth';
import { Firestore, collection, addDoc, GeoPoint } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { LoadingController } from '@ionic/angular';
import { RestaurantMapComponent } from './components/map.component';

interface Restaurant {
  name: string;
  address: string;
  type: string;
  desc: string;
  imageUrl: string;
  ownerId: string;
  coordinates: GeoPoint;
}

@Component({
  selector: 'app-add-restaurant',
  templateUrl: './add-restaurant.page.html',
  styleUrls: ['./add-restaurant.page.scss']
})
export class AddRestaurantPage implements OnInit, OnDestroy {
  @ViewChild(RestaurantMapComponent) mapComponent!: RestaurantMapComponent;

  restaurant: Restaurant = {
    name: '',
    address: '',
    type: '',
    desc: '',
    imageUrl: '',
    ownerId: '',
    coordinates: new GeoPoint(3.4922367966846597, 103.39242973104015)
  };
  
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  private authUnsubscribe: Unsubscribe;
  currentUser: User | null = null;

  constructor(
    private router: Router,
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage,
    private loadingCtrl: LoadingController
  ) {
    this.authUnsubscribe = onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImage = input.files[0];
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedImage);
    }
  }

  isFormValid(): boolean {
    return !!(this.restaurant.name && 
              this.restaurant.address && 
              this.restaurant.type && 
              this.restaurant.desc && 
              this.selectedImage &&
              this.restaurant.coordinates);
  }

  async addRestaurant() {
    if (!this.isFormValid() || !this.currentUser) {
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Adding restaurant...'
    });
    await loading.present();

    try {
      if (!this.selectedImage) {
        throw new Error('No image selected');
      }
      
      const filePath = `restaurant-images/${Date.now()}_${this.selectedImage.name}`;
      const storageRef = ref(this.storage, filePath);
      await uploadBytes(storageRef, this.selectedImage);

      const imageUrl = await getDownloadURL(storageRef);

      const restaurantData: Restaurant = {
        ...this.restaurant,
        imageUrl,
        ownerId: this.currentUser.uid
      };

      const restaurantsRef = collection(this.firestore, 'restaurant');
      await addDoc(restaurantsRef, restaurantData);

      loading.dismiss();
      this.router.navigate(['/business/home']);

    } catch (error) {
      console.error('Error adding restaurant:', error);
      loading.dismiss();
    }
  }

  onCoordinatesSelected(coordinates: {lat: number, lng: number}) {
    this.restaurant.coordinates = new GeoPoint(coordinates.lat, coordinates.lng);
  }
  
  async onAddressChange() {
    if (this.restaurant.address && this.mapComponent) {
      try {
        await this.mapComponent.updateFromAddress(this.restaurant.address);
      } catch (error) {
        console.error('Error updating coordinates from address:', error);
      }
    }
  }

  navigateToHome() {
    this.router.navigate(['/business/home']);
  }
}