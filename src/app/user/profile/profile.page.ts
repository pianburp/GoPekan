import { Component, OnInit } from '@angular/core';
import { Auth, getAuth, onAuthStateChanged, sendPasswordResetEmail } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from '@angular/fire/storage';
import { AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        query('.animate-item', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(100, [
            animate('400ms ease-out', 
              style({ opacity: 1, transform: 'translateY(0)' })
            )
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class ProfilePage implements OnInit {
  userProfile: any = {
    name: '',
    email: '',
    phonenumber: '',
    photoURL: '',
  };

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage,
    private alertController: AlertController,
    private router: Router ,
    private loadingController: LoadingController,
  ) {}

  ngOnInit() {
    this.getUserProfile();
  }

  async getUserProfile() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = doc(this.firestore, 'users', user.uid);
        const userSnapshot = await getDoc(userDoc);
        
        if (userSnapshot.exists()) {
          this.userProfile = userSnapshot.data();
        }
        
        this.userProfile.email = user.email;
      }
    });
  }

  async onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file: File | null = target.files?.[0] || null;
    if (file) {
      try {
        const user = await this.auth.currentUser;
        if (!user) {
          throw new Error('No user logged in');
        }
  
        const loading = await this.loadingController.create({
          message: 'Uploading...',
          spinner: 'crescent'
        });
        await loading.present();
  
        const filePath = `profile-pictures/${user.uid}/${Date.now()}_${file.name}`;
        const fileRef = ref(this.storage, filePath);
  
        const uploadTask = uploadBytesResumable(fileRef, file);
  
        uploadTask.on('state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            loading.message = `Uploading... ${Math.round(progress)}%`;
          },
          async (error: any) => {
            await loading.dismiss();
            console.error('Upload error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            const alert = await this.alertController.create({
              header: 'Upload Failed',
              message: `There was an error uploading your image. Error: ${error.message}`,
              buttons: ['OK']
            });
            await alert.present();
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              const userDoc = doc(this.firestore, 'users', user.uid);
              await updateDoc(userDoc, {
                photoURL: downloadURL
              });
  
              this.userProfile.photoURL = downloadURL;
  
              await loading.dismiss();
              const alert = await this.alertController.create({
                header: 'Success',
                message: 'Profile picture updated successfully',
                buttons: ['OK']
              });
              await alert.present();
            } catch (error: any) {
              await loading.dismiss();
              console.error('Error getting download URL:', error);
              console.error('Error code:', error.code);
              console.error('Error message:', error.message);
              const alert = await this.alertController.create({
                header: 'Error',
                message: `Failed to update profile picture. Error: ${error.message}`,
                buttons: ['OK']
              });
              await alert.present();
            }
          }
        );
  
      } catch (error: any) {
        console.error('Error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        const alert = await this.alertController.create({
          header: 'Error',
          message: `An error occurred while processing your request. Error: ${error.message}`,
          buttons: ['OK']
        });
        await alert.present();
      }
    }
  }

  async editProfile() {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      try {
        // Basic validation
        if (this.userProfile.phonenumber && !/^\d{10,13}$/.test(this.userProfile.phonenumber)) {
          const alert = await this.alertController.create({
            header: 'Invalid Phone Number',
            message: 'Please enter a valid phone number (10-13 digits)',
            buttons: ['OK']
          });
          await alert.present();
          return;
        }

        // Create and present loading indicator
        const loading = await this.loadingController.create({
          message: 'Updating profile...',
          spinner: 'crescent'
        });
        await loading.present();
        
        try {
          // Update in Firestore
          const userDoc = doc(this.firestore, 'users', user.uid);
          await updateDoc(userDoc, {
            name: this.userProfile.name,
            phonenumber: this.userProfile.phonenumber,
            photoURL: this.userProfile.photoURL
          });

          // Dismiss loading before showing success alert
          await loading.dismiss();
          
          const alert = await this.alertController.create({
            header: 'Success',
            message: 'Profile updated successfully',
            buttons: ['OK']
          });
          await alert.present();

        } catch (error) {
          // Dismiss loading if there's an error
          await loading.dismiss();
          
          const alert = await this.alertController.create({
            header: 'Error',
            message: 'Failed to update profile',
            buttons: ['OK']
          });
          await alert.present();
        }

      } catch (error) {
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Failed to update profile',
          buttons: ['OK']
        });
        await alert.present();
      }
    }
  }

  onNameChange(event: any) {
    this.userProfile.name = event.detail.value;
  }

  onPhoneNumberChange(event: any) {
    this.userProfile.phonenumber = event.detail.value;
  }

  async changePassword() {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user?.email) {
      try {
        await sendPasswordResetEmail(auth, user.email);
        const alert = await this.alertController.create({
          header: 'Success',
          message: 'Password reset email sent. Please check your inbox.',
          buttons: ['OK']
        });
        await alert.present();
      } catch (error) {
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Failed to send password reset email.',
          buttons: ['OK']
        });
        await alert.present();
      }
    }
  }

  navigateToHome() {
    this.router.navigate(['/user/home']);
  }
}