import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { Firestore, doc, getDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';

interface Restaurant {
  id: string;
  name: string;
  desc: string;
  address: string;
  cuisineType: string;
  ownerId: string;
}

@Component({
  selector: 'app-edit-restaurant',
  templateUrl: './edit-restaurant.page.html',
  styleUrls: ['./edit-restaurant.page.scss'],
})
export class EditRestaurantPage implements OnInit {
  restaurantId: string = '';
  restaurant: Restaurant = {
    id: '',
    name: '',
    desc: '',
    address: '',
    cuisineType: '',
    ownerId: ''
  };
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
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
        this.restaurant = {
          id: this.restaurantId,
          name: data.name,
          desc: data.desc,
          address: data.address || '',
          cuisineType: data.cuisineType || '',
          ownerId: data.ownerId
        };
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

  async onSubmit() {
    if (!this.restaurant.name || !this.restaurant.desc || !this.restaurant.address || !this.restaurant.cuisineType) {
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
      await updateDoc(restaurantDoc, {
        name: this.restaurant.name,
        desc: this.restaurant.desc,
        address: this.restaurant.address,
        cuisineType: this.restaurant.cuisineType
      });

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

  navigateToHome() {
    this.router.navigate(['/business/home']);
  }

  async deleteRestaurant() {
    // Show confirmation alert before deleting
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
}