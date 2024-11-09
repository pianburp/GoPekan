import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Auth, signInWithEmailAndPassword, sendEmailVerification } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  isVisible = false;
  showScrollIndicator = true; // New property for scroll indicator
  email: string = '';
  password: string = '';

  constructor(
    private auth: Auth,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private firestore: Firestore
  ) {}

  onScroll(event: any) {
    const element = event.target;
    const loginCard = element.querySelector('.login-card');
    if (!loginCard) return;

    const rect = loginCard.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Check if element is in viewport
    if (rect.top <= windowHeight * 0.75) {
      this.isVisible = true;
      this.showScrollIndicator = false; // Hide scroll indicator when login card is visible
    } else {
      this.showScrollIndicator = true; // Show scroll indicator when login card is not visible
    }
  }

  async login() {
    const loading = await this.loadingController.create({
      message: 'Please wait...',
    });
    await loading.present();

    try {
      // Authenticate the user
      const userCredential = await signInWithEmailAndPassword(
        this.auth, 
        this.email, 
        this.password
      );
      
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        await this.auth.signOut(); // Sign out unverified user
        await loading.dismiss();
        await this.presentVerificationAlert(user.email);
        return;
      }

      // Fetch user role from Firestore
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Update emailVerified status in Firestore if needed
        if (userData['emailVerified'] === false) {
          await setDoc(userDocRef, { emailVerified: true }, { merge: true });
        }

        const role = userData['type']; // Changed from 'role' to 'type' to match your registration

        // Role-based redirection
        await loading.dismiss();
        
        switch (role) {
          case 'user':
            this.router.navigate(['/user/home']);
            break;
          case 'business':
            this.router.navigate(['/business/home']);
            break;
          case 'admin':
            this.router.navigate(['/admin/home']);
            break;
          default:
            console.error('Invalid role');
            this.presentAlert('Login Error', 'User role is not recognized.');
        }
      } else {
        await loading.dismiss();
        console.error('No such document for the user');
        this.presentAlert('Login Error', 'User information not found.');
      }

    } catch (error: any) {
      await loading.dismiss();
      console.error('Login error', error);
      let errorMessage = 'Please check your email and password and try again.';
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
      }
      
      this.presentAlert('Login Failed', errorMessage);
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

  async presentVerificationAlert(email: string | null) {
    const alert = await this.alertController.create({
      header: 'Email Not Verified',
      message: 'Please verify your email address before logging in. Would you like us to send a new verification email?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Resend Email',
          handler: () => {
            this.resendVerificationEmail();
          }
        }
      ]
    });
    await alert.present();
  }

  async resendVerificationEmail() {
    try {
      const user = this.auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        this.presentAlert(
          'Email Sent', 
          'A new verification email has been sent. Please check your inbox and spam folder.'
        );
      } else {
        // If no user is signed in, we need to sign them in first
        const userCredential = await signInWithEmailAndPassword(
          this.auth,
          this.email,
          this.password
        );
        await sendEmailVerification(userCredential.user);
        await this.auth.signOut(); // Sign out again after sending verification
        this.presentAlert(
          'Email Sent', 
          'A new verification email has been sent. Please check your inbox and spam folder.'
        );
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      this.presentAlert(
        'Error',
        'Failed to send verification email. Please try again later.'
      );
    }
  }

}