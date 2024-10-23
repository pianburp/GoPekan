import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  signOut,
  User
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  selectedSegment: string = 'user';
  
  userEmail: string = '';
  userName: string = '';
  userPassword: string = '';
  businessEmail: string = '';
  businessName: string = '';
  businessAddress: string = '';
  businessPassword: string = '';

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {}

  async registerUser() {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.userEmail,
        this.userPassword
      );

      // Send verification email
      await sendEmailVerification(userCredential.user);

      await setDoc(doc(this.firestore, 'users', userCredential.user.uid), {
        email: this.userEmail,
        name: this.userName,
        type: 'user',
        emailVerified: false
      });

      await signOut(this.auth); // Sign out user until they verify email
      await this.presentVerificationAlert();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error(error);
      this.presentAlert('Registration Failed', 'Please check your information and try again.');
    }
  }

  async registerBusiness() {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.businessEmail,
        this.businessPassword
      );

      // Send verification email
      await sendEmailVerification(userCredential.user);

      await setDoc(doc(this.firestore, 'users', userCredential.user.uid), {
        email: this.businessEmail,
        name: this.businessName,
        address: this.businessAddress,
        type: 'business',
        emailVerified: false
      });

      await signOut(this.auth); // Sign out user until they verify email
      await this.presentVerificationAlert();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error(error);
      this.presentAlert('Registration Failed', 'Please check your information and try again.');
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

  async presentVerificationAlert() {
    const alert = await this.alertController.create({
      header: 'Verify Your Email',
      message: 'A verification link has been sent to your email address. Please verify your email before logging in.',
      buttons: ['OK']
    });
    await alert.present();
  }
}