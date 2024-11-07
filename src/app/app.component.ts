import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Animation, AnimationController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private animationCtrl: AnimationController
  ) {}
  myPageTransition = (baseEl: HTMLElement, opts?: any) => {
    const DURATION = 300;
    
    const enteringAnimation = (element: HTMLElement) => {
      const rootAnimation = this.animationCtrl
        .create()
        .addElement(element)
        .duration(DURATION)
        .easing('ease-in-out');

      const slideAnimation = this.animationCtrl
        .create()
        .addElement(element.querySelector('ion-content')!)
        .fromTo('transform', 'translateX(100%)', 'translateX(0)')
        .fromTo('opacity', '0.5', '1');

      return rootAnimation.addAnimation(slideAnimation);
    };

    const leavingAnimation = (element: HTMLElement) => {
      const rootAnimation = this.animationCtrl
        .create()
        .addElement(element)
        .duration(DURATION)
        .easing('ease-in-out');

      const slideAnimation = this.animationCtrl
        .create()
        .addElement(element.querySelector('ion-content')!)
        .fromTo('transform', 'translateX(0)', 'translateX(-100%)')
        .fromTo('opacity', '1', '0.5');

      return rootAnimation.addAnimation(slideAnimation);
    };

    // Check if we're going forward or backward
    const isForward = opts.direction === 'forward';
    const entering = enteringAnimation(opts.enteringEl);
    const leaving = leavingAnimation(opts.leavingEl);

    if (!isForward) {
      // Reverse the animations if going backward
      entering.fromTo('transform', 'translateX(-100%)', 'translateX(0)');
      leaving.fromTo('transform', 'translateX(0)', 'translateX(100%)');
    }

    return this.animationCtrl
      .create()
      .duration(DURATION)
      .addAnimation([entering, leaving]);
  };
}

