import { Component, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { RestaurantSentiment } from '../../../../services/sentiment-analysis.service';

@Component({
  selector: 'app-sentiment-popover',
  template: `
    <ion-content class="ion-padding">
      <div class="sentiment-popover">
        <ion-text>
          <h2>{{ restaurant.restaurantName }}</h2>
        </ion-text>
        
        <div class="sentiment-summary">
          <ion-text>
            <p>{{ restaurant.sentiment.summary }}</p>
          </ion-text>
        </div>

        <div class="recommendations-section">
          <h3>Recommendations</h3>
          <ion-list lines="none">
            <ion-item *ngFor="let recommendation of restaurant.sentiment.recommendations">
              <ion-icon name="bulb-outline" slot="start" color="warning"></ion-icon>
              <ion-label class="ion-text-wrap">{{ recommendation }}</ion-label>
            </ion-item>
          </ion-list>
        </div>
        
        <ion-button expand="block" (click)="dismiss()">Close</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .sentiment-popover {
      padding: 8px;
    }

    h2 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--ion-color-primary);
    }

    h3 {
      font-size: 1rem;
      font-weight: 500;
      margin: 16px 0 8px;
      color: var(--ion-color-medium);
    }

    .sentiment-summary {
      margin: 16px 0;
      padding: 8px;
      background: var(--ion-color-light);
      border-radius: 8px;
    }

    .recommendations-section {
      margin-top: 16px;
    }

    ion-item {
      --padding-start: 0;
    }

    ion-button {
      margin-top: 16px;
    }
  `]
})
export class SentimentPopoverComponent {
  @Input() restaurant!: RestaurantSentiment;

  constructor(private popoverCtrl: PopoverController) {}

  dismiss() {
    this.popoverCtrl.dismiss();
  }
}