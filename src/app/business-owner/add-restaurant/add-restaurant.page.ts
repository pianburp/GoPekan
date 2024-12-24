import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged, User, Unsubscribe } from '@angular/fire/auth';
import { Firestore, collection, addDoc, GeoPoint } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { LoadingController, AlertController  } from '@ionic/angular';
import { RestaurantMapComponent } from './components/map.component';

interface HoursData {
  open: string;
  close: string;
  isOpen: boolean;
  spanNextDay: boolean;
}

interface OperatingHours {
  monday: HoursData;
  tuesday: HoursData;
  wednesday: HoursData;
  thursday: HoursData;
  friday: HoursData;
  saturday: HoursData;
  sunday: HoursData;
}

interface Restaurant {
  name: string;
  address: string;
  type: string;
  desc: string;
  imageUrl: string;
  ownerId: string;
  phone: string;
  coordinates: GeoPoint;
  operatingHours: OperatingHours;
}


@Component({
  selector: 'app-add-restaurant',
  templateUrl: './add-restaurant.page.html',
  styleUrls: ['./add-restaurant.page.scss']
})
export class AddRestaurantPage implements OnInit, OnDestroy {
  @ViewChild(RestaurantMapComponent) mapComponent!: RestaurantMapComponent;

  days: (keyof OperatingHours)[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 
    'friday', 'saturday', 'sunday'
  ];
  
  is24Hours: boolean = false;

  restaurant: Restaurant = {
    name: '',
    address: '',
    type: '',
    desc: '',
    imageUrl: '',
    ownerId: '',  
    phone: '',
    coordinates: new GeoPoint(3.4922367966846597, 103.39242973104015),
    operatingHours: this.initializeOperatingHours()
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
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
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

  private initializeOperatingHours(): OperatingHours {
    const defaultHours: HoursData = {
      open: '09:00',
      close: '17:00',
      isOpen: true,
      spanNextDay: false
    };

    return {
      monday: { ...defaultHours },
      tuesday: { ...defaultHours },
      wednesday: { ...defaultHours },
      thursday: { ...defaultHours },
      friday: { ...defaultHours },
      saturday: { ...defaultHours },
      sunday: { ...defaultHours }
    };
  }

  toggle24Hours() {
    const hours: HoursData = {
      open: this.is24Hours ? '00:00' : '09:00',
      close: this.is24Hours ? '23:59' : '17:00',
      isOpen: true,
      spanNextDay: false
    };

    this.days.forEach(day => {
      this.restaurant.operatingHours[day] = { ...hours };
    });
  }

  getDayDisplayName(day: keyof OperatingHours): string {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        const alert = await this.alertCtrl.create({
          header: 'Invalid File',
          message: 'Please select an image file.',
          buttons: ['OK']
        });
        await alert.present();
        return;
      }
  
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        const alert = await this.alertCtrl.create({
          header: 'File Too Large',
          message: 'Please select an image smaller than 5MB.',
          buttons: ['OK']
        });
        await alert.present();
        return;
      }
  
      this.selectedImage = file;
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  isFormValid(): boolean {
    return !!(
      this.restaurant.name && 
      this.restaurant.address && 
      this.restaurant.type && 
      this.restaurant.desc && 
      this.restaurant.phone &&  
      this.selectedImage &&
      this.restaurant.coordinates
    );
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