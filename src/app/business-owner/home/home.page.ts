import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, AlertController, PopoverController } from '@ionic/angular';
import { Auth } from '@angular/fire/auth';
import { signOut } from '@angular/fire/auth';
import { Platform } from '@ionic/angular';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        query('.animate-item', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(50, [
            animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', 
              style({ opacity: 1, transform: 'translateY(0)' })
            )
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class HomePage implements AfterViewInit {
  isSearchbarCollapsed = false;
  lastScrollPosition = 0;
  scrollThreshold = 50;
  scrollDebounceTimer: any;
  cards = Array(10).fill(0).map((_, index) => index + 1);
  observer: IntersectionObserver | null = null;

  constructor(
    private auth: Auth,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private popoverController: PopoverController,
    private platform: Platform
  ) {
    this.platform.ready().then(() => {
      this.isSearchbarCollapsed = false;
      this.lastScrollPosition = 0;
    });
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => {
            entry.target.classList.add('show');
          });
          this.observer?.unobserve(entry.target);
        }
      });
    }, options);

    setTimeout(() => {
      document.querySelectorAll('.scroll-card').forEach((card) => {
        this.observer?.observe(card);
      });
    }, 100);
  }

  async navigateToProfile() {
    try {
      const popover = await this.popoverController.getTop();
      if (popover) {
        await popover.dismiss();
      }
      await this.router.navigate(['/business/profile']);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }
  async navigateToDashboard() {
    try {
      const popover = await this.popoverController.getTop();
      if (popover) {
        await popover.dismiss();
      }
      await this.router.navigate(['/business/dashboard']);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  async logout() {
    try {
      const popover = await this.popoverController.getTop();
      if (popover) {
        await popover.dismiss();
      }

      const loading = await this.loadingCtrl.create({
        message: 'Logging out...',
        spinner: 'crescent',
        cssClass: 'custom-loading'
      });
      await loading.present();

      await signOut(this.auth);
      await loading.dismiss();
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      const loading = await this.loadingCtrl.getTop();
      if (loading) {
        await loading.dismiss();
      }

      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Could not log out. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
      console.error('Logout error:', error);
    }
  }

  handleScroll(event: any) {
    if (this.scrollDebounceTimer) {
      cancelAnimationFrame(this.scrollDebounceTimer);
    }

    this.scrollDebounceTimer = requestAnimationFrame(() => {
      const currentScrollPosition = event.detail.scrollTop;
      
      if (Math.abs(currentScrollPosition - this.lastScrollPosition) > 10) {
        if (currentScrollPosition > this.lastScrollPosition && currentScrollPosition > this.scrollThreshold) {
          requestAnimationFrame(() => {
            this.isSearchbarCollapsed = true;
          });
        } else if (currentScrollPosition < this.lastScrollPosition) {
          requestAnimationFrame(() => {
            this.isSearchbarCollapsed = false;
          });
        }
        
        this.lastScrollPosition = currentScrollPosition;
      }
    });
  }

  ionViewWillEnter() {
    this.isSearchbarCollapsed = false;
    this.lastScrollPosition = 0;
  }

  ionViewWillLeave() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  ngOnDestroy() {
    if (this.scrollDebounceTimer) {
      cancelAnimationFrame(this.scrollDebounceTimer);
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
  navigateToRestaurant() {
    this.router.navigate(['/business/add-restaurant']);
  }
}