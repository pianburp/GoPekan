import { Component, OnInit } from '@angular/core';
import { Auth, getAuth, onAuthStateChanged, sendPasswordResetEmail } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
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
    // Add other profile fields as needed
  };

  constructor(
    private auth: Auth,
    private firestore: Firestore,
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
          phonenumber: this.userProfile.phonenumber 
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