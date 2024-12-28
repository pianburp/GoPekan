import { Component, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-restaurant-detail-popover',
  template: `
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item>
          <ion-label>
            <h2>{{ restaurant.name }}</h2>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-label>
            <h3>Owner ID</h3>
            <p>{{ restaurant.ownerId }}</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-label>
            <h3>Status</h3>
            <ion-badge [color]="restaurant.isVerified ? 'success' : 'warning'">
              {{ restaurant.isVerified ? 'Verified' : 'Not Verified' }}
            </ion-badge>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-label>
            <h3>Address</h3>
            <p>{{ restaurant.address || 'Not provided' }}</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-label>
            <h3>Phone</h3>
            <p>{{ restaurant.phone || 'Not provided' }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-button expand="block" color="medium" (click)="dismiss()">
        Close
      </ion-button>
    </ion-content>
  `
})
export class RestaurantDetailPopoverComponent {
  @Input() restaurant: any;

  constructor(private popoverController: PopoverController) {}

  dismiss() {
    this.popoverController.dismiss();
  }
}