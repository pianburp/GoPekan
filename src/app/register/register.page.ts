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
import { AnimationController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ 
          transform: 'translateY(100px)',
          opacity: 0 
        }),
        animate('500ms ease-out', 
          style({ 
            transform: 'translateY(0)',
            opacity: 1 
          })
        )
      ]),
      transition(':leave', [
        animate('500ms ease-in', 
          style({ 
            transform: 'translateY(100px)',
            opacity: 0 
          })
        )
      ])
    ])
  ]
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
    private alertController: AlertController,
    private animationCtrl: AnimationController
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
  async animateCard(card: HTMLElement) {
    const animation = this.animationCtrl
      .create()
      .addElement(card)
      .duration(300)
      .iterations(1)
      .fromTo('transform', 'translateY(0px)', 'translateY(-10px)')
      .fromTo('box-shadow', 
        '0 4px 6px rgba(0, 0, 0, 0.1)', 
        '0 8px 12px rgba(0, 0, 0, 0.2)');

    await animation.play();
  }
}