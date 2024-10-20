import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

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
    private alertController: AlertController
  ) {}

  async login() {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, this.email, this.password);
      console.log(userCredential.user);
      this.router.navigate(['/home']);
    } catch (error) {
      console.error(error);
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