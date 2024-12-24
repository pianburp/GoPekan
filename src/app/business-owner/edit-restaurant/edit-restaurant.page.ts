import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { Firestore, doc, getDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Router } from '@angular/router';

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
  id: string;
  name: string;
  desc: string;
  address: string;
  type: string;
  phone: string;
  ownerId: string;
  imageUrl?: string;
  operatingHours?: OperatingHours;
}

@Component({
  selector: 'app-edit-restaurant',
  templateUrl: './edit-restaurant.page.html',
  styleUrls: ['./edit-restaurant.page.scss'],
})
export class EditRestaurantPage implements OnInit {
  restaurantId: string = '';
  days: (keyof OperatingHours)[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 
    'friday', 'saturday', 'sunday'
  ];
  is24Hours: boolean = false;
  isLoading: boolean = false;
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;

  restaurant: Restaurant = {
    id: '',
    name: '',
    desc: '',
    address: '',
    type: '',
    phone: '',
    ownerId: '',
    operatingHours: this.initializeOperatingHours()
  };

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private storage: Storage,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.restaurantId = this.route.snapshot.paramMap.get('id') || '';
    if (this.restaurantId) {
      this.loadRestaurantData();
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

  async loadRestaurantData() {
    if (!this.restaurantId) return;

    const loading = await this.loadingCtrl.create({
      message: 'Loading restaurant details...'
    });

    try {
      await loading.present();
      const restaurantDoc = doc(this.firestore, `restaurant/${this.restaurantId}`);
      const restaurantSnap = await getDoc(restaurantDoc);

      if (restaurantSnap.exists()) {
        const data = restaurantSnap.data() as Restaurant;
        const defaultHours = this.initializeOperatingHours();
        
        this.restaurant = {
          id: this.restaurantId,
          name: data.name,
          desc: data.desc,
          address: data.address || '',
          type: data.type || '',
          phone: data.phone || '',
          ownerId: data.ownerId,
          imageUrl: data.imageUrl || '',
          operatingHours: data.operatingHours ? {
            ...defaultHours,
            ...data.operatingHours
          } : defaultHours
        };
        
        this.is24Hours = this.checkIf24Hours();
      } else {
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'Restaurant not found',
          buttons: ['OK']
        });
        await alert.present();
        this.router.navigate(['/home']);
      }
    } catch (error) {
      console.error('Error loading restaurant:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Unable to load restaurant details. Please try again later.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      await loading.dismiss();
    }
  }

  checkIf24Hours(): boolean {
    if (!this.restaurant.operatingHours) return false;
    return this.days.every(day => {
      const hours = this.restaurant.operatingHours![day];
      return hours.isOpen && hours.open === '00:00' && hours.close === '23:59';
    });
  }

  toggle24Hours() {
    if (!this.restaurant.operatingHours) {
      this.restaurant.operatingHours = this.initializeOperatingHours();
    }

    const hours: HoursData = {
      open: this.is24Hours ? '00:00' : '09:00',
      close: this.is24Hours ? '23:59' : '17:00',
      isOpen: true,
      spanNextDay: false
    };

    this.days.forEach(day => {
      if (this.restaurant.operatingHours) {
        this.restaurant.operatingHours[day] = { ...hours };
      }
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

      this.selectedFile = file;
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  private async uploadImage(file: File): Promise<string> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `restaurants/${this.restaurantId}/image-${Date.now()}.${fileExtension}`;
    const storageRef = ref(this.storage, fileName);
    
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  private async deleteOldImage(imageUrl: string) {
    try {
      const storageRef = ref(this.storage, imageUrl);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting old image:', error);
      // Continue execution even if delete fails
    }
  }

  async onSubmit() {
    if (!this.restaurant.name || !this.restaurant.desc || !this.restaurant.address || !this.restaurant.type) {
      const alert = await this.alertCtrl.create({
        header: 'Invalid Form',
        message: 'Please fill in all required fields.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Updating restaurant...'
    });

    try {
      await loading.present();
      const restaurantDoc = doc(this.firestore, `restaurant/${this.restaurantId}`);
      
      let updateData: any = {
        name: this.restaurant.name,
        desc: this.restaurant.desc,
        address: this.restaurant.address,
        type: this.restaurant.type,
        phone: this.restaurant.phone,
        operatingHours: this.restaurant.operatingHours
      };

      // Handle image upload if new file is selected
      if (this.selectedFile) {
        // Delete old image if it exists
        if (this.restaurant.imageUrl) {
          await this.deleteOldImage(this.restaurant.imageUrl);
        }
        
        // Upload new image and get URL
        const imageUrl = await this.uploadImage(this.selectedFile);
        updateData.imageUrl = imageUrl;
      }

      await updateDoc(restaurantDoc, updateData);

      const alert = await this.alertCtrl.create({
        header: 'Success',
        message: 'Restaurant updated successfully',
        buttons: ['OK']
      });
      await alert.present();
      this.router.navigate(['/business/home']);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Unable to update restaurant. Please try again later.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      await loading.dismiss();
    }
  }

  async deleteRestaurant() {
    const confirmAlert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this restaurant? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Deleting restaurant...'
            });

            try {
              await loading.present();
              
              // Delete image from storage if it exists
              if (this.restaurant.imageUrl) {
                await this.deleteOldImage(this.restaurant.imageUrl);
              }

              // Delete restaurant document
              const restaurantDoc = doc(this.firestore, `restaurant/${this.restaurantId}`);
              await deleteDoc(restaurantDoc);

              const alert = await this.alertCtrl.create({
                header: 'Success',
                message: 'Restaurant deleted successfully',
                buttons: ['OK']
              });
              await alert.present();
              this.router.navigate(['/business/home']);
            } catch (error) {
              console.error('Error deleting restaurant:', error);
              const alert = await this.alertCtrl.create({
                header: 'Error',
                message: 'Unable to delete restaurant. Please try again later.',
                buttons: ['OK']
              });
              await alert.present();
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await confirmAlert.present();
  }

  navigateToHome() {
    this.router.navigate(['/business/home']);
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'https://ionicframework.com/docs/img/demos/card-media.png';
    }
  }
}