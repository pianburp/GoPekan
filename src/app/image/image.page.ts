import { Component, OnInit } from '@angular/core';
import { Firestore, collection, collectionData, updateDoc, doc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from '@angular/fire/storage';
import { LoadingController, ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';

interface Restaurant {
  id: string;
  name: string;
  // Add other properties as needed
}

@Component({
  selector: 'app-image',
  templateUrl: './image.page.html',
  styleUrls: ['./image.page.scss'],
})
export class ImagePage implements OnInit {
  restaurants: Restaurant[] = [];
  selectedRestaurant: Restaurant | null = null;
  selectedImage: string | null = null;
  uploadProgress: number = 0;
  selectedFile: File | null = null;

  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadRestaurants();
  }

  loadRestaurants() {
    const restaurantRef = collection(this.firestore, 'restaurant');
    collectionData(restaurantRef, { idField: 'id' }).subscribe(
      (data) => {
        this.restaurants = data as Restaurant[];
      },
      error => {
        console.error('Error loading restaurants:', error);
        this.showToast('Error loading restaurants');
      }
    );
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      this.showToast('Please select an image file');
      return;
    }

    try {
      this.selectedFile = file;
      // Create preview URL
      this.selectedImage = URL.createObjectURL(file);
    } catch (error) {
      console.error('Error creating preview:', error);
      this.showToast('Error loading image preview');
    }
  }

  async uploadImage() {
    if (!this.selectedFile || !this.selectedRestaurant) {
      this.showToast('Please select both a restaurant and an image');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Uploading image...'
    });
    await loading.present();

    try {
      // Create a unique filename
      const fileName = `restaurant_${this.selectedRestaurant.id}_${new Date().getTime()}_${this.selectedFile.name}`;
      const filePath = `restaurant-images/${fileName}`;
      
      // Create a reference to the storage location
      const storageRef = ref(this.storage, filePath);
      
      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, this.selectedFile);

      // Monitor upload progress
      uploadTask.on('state_changed', 
        (snapshot) => {
          this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          console.error('Upload error:', error);
          loading.dismiss();
          this.showToast('Error uploading image');
        },
        async () => {
          // Upload completed successfully
          try {
            // Get download URL
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update restaurant document with new image URL
            const restaurantRef = doc(this.firestore, `restaurant/${this.selectedRestaurant?.id}`);
            await updateDoc(restaurantRef, {
              imageUrl: downloadUrl
            });

            loading.dismiss();
            this.showToast('Image uploaded successfully');
            this.resetForm();
          } catch (error) {
            console.error('Error getting download URL:', error);
            loading.dismiss();
            this.showToast('Error completing upload');
          }
        }
      );

    } catch (error) {
      console.error('Error uploading image:', error);
      loading.dismiss();
      this.showToast('Error uploading image');
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  private resetForm() {
    this.selectedImage = null;
    this.selectedRestaurant = null;
    this.selectedFile = null;
    this.uploadProgress = 0;
  }
}