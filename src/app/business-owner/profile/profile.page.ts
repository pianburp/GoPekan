import { Component, OnInit } from '@angular/core';
import { Auth, getAuth, onAuthStateChanged, sendPasswordResetEmail } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  userProfile: any = {
    name: '',
    email: '',
    // Add other profile fields as needed
  };

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private alertController: AlertController,
    private router: Router
  ) { }

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
        // Update in Firestore
        const userDoc = doc(this.firestore, 'users', user.uid);
        await updateDoc(userDoc, {
          name: this.userProfile.name
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
    this.router.navigate(['/business/home']);
  }

}
