import { Component } from '@angular/core';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss']
})
export class ForgotPasswordPage {
  email: string = '';

  constructor(
    private auth: Auth,
    private alertController: AlertController,
    private router: Router
  ) {}

  async resetPassword() {
    if (!this.email) {
      this.presentAlert('Error', 'Please enter your email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(this.auth, this.email);
      this.presentAlert('Success', 'Password reset email sent. Please check your inbox.');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error(error);
      this.presentAlert('Error', 'Failed to send password reset email. Please try again.');
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
