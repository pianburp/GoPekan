import { Component, OnInit } from '@angular/core';
import { Auth, getAuth, onAuthStateChanged, sendPasswordResetEmail } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AlertController } from '@ionic/angular';
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
    private router: Router 
  ) {}

  ngOnInit() {
    this.getUserProfile();
  }

  async getUserProfile() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user profile data from Firestore
        const userDoc = doc(this.firestore, 'users', user.uid);
        const userSnapshot = await getDoc(userDoc);
        
        if (userSnapshot.exists()) {
          this.userProfile = userSnapshot.data();
        }
        
        // Get email from Firebase Auth
        this.userProfile.email = user.email;
      }
    });
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        const alert = await this.alertController.create({
          header: 'Invalid File Type',
          message: 'Please select an image file',
          buttons: ['OK']
        });
        await alert.present();
        return;
      }
  
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        const alert = await this.alertController.create({
          header: 'File Too Large',
          message: 'Please select an image under 5MB',
          buttons: ['OK']
        });
        await alert.present();
        return;
      }
  
      try {
        const user = this.auth.currentUser;
        if (!user) return;
  
        // Show loading indicator
        const loading = await this.alertController.create({
          message: 'Uploading image...',
          backdropDismiss: false
        });
        await loading.present();
  
        // Create a reference to the storage location
        const fileName = `${new Date().getTime()}_${file.name}`; // Add timestamp to prevent naming conflicts
        const storageRef = ref(this.storage, `profile-pictures/${user.uid}/${fileName}`);
        
        // Create file metadata
        const metadata = {
          contentType: file.type,
        };
  
        // Upload the file with metadata
        const uploadTask = await uploadBytes(storageRef, file, metadata);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(uploadTask.ref);
        
        // Update Firestore with the new photo URL
        const userDoc = doc(this.firestore, 'users', user.uid);
        await updateDoc(userDoc, {
          photoURL: downloadURL
        });
        
        // Update local state
        this.userProfile.photoURL = downloadURL;
  
        // Dismiss loading indicator
        await loading.dismiss();
        
        const alert = await this.alertController.create({
          header: 'Success',
          message: 'Profile picture updated successfully',
          buttons: ['OK']
        });
        await alert.present();
        
      } catch (error) {
        console.error('Upload error:', error);
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Failed to upload profile picture. Please try again.',
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
        // Update in Firestore
        const userDoc = doc(this.firestore, 'users', user.uid);
        await updateDoc(userDoc, {
          name: this.userProfile.name,
          phonenumber: this.userProfile.phonenumber,
          photoURL: this.userProfile.photoURL
        });

        const alert = await this.alertController.create({
          header: 'Success',
          message: 'Profile updated successfully',
          buttons: ['OK']
        });
        await alert.present();

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