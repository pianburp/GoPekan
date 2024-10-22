import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore'; // Import Firestore

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = '';
  password: string = '';

  constructor(
    private auth: Auth,
    private router: Router,
    private alertController: AlertController,
    private firestore: Firestore // Inject Firestore
  ) {}

  async login() {
    try {
      // Authenticate the user
      const userCredential = await signInWithEmailAndPassword(this.auth, this.email, this.password);
      console.log('Logged in user:', userCredential.user);

      // Fetch user role from Firestore
      const userDocRef = doc(this.firestore, `users/${userCredential.user.uid}`);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData['role']; // Assuming 'role' is a field in Firestore

        // Role-based redirection
        if (role === 'user') {
          this.router.navigate(['/user-home']); // Redirect to User home page
        } else if (role === 'business-owner') {
          this.router.navigate(['/business-owner-home']); // Redirect to Business Owner home page
        } else if (role === 'admin') {
          this.router.navigate(['/admin-home']); // Redirect to Admin home page
        } else {
          console.error('Invalid role');
          this.presentAlert('Login Error', 'User role is not recognized.');
        }
      } else {
        console.error('No such document for the user');
        this.presentAlert('Login Error', 'User role information not found.');
      }

    } catch (error) {
      console.error('Login error', error);
      this.presentAlert('Login Failed', 'Please check your email and password and try again.');
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
