// review-form.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Firestore, doc, setDoc, deleteDoc, Timestamp, collection, getDoc } from '@angular/fire/firestore';
import { AlertController } from '@ionic/angular';
import { Auth } from '@angular/fire/auth';

interface ReviewForm {
  stars: number;
  text: string;
}

@Component({
  selector: 'app-review-form',
  template: `
    <div class="review-form-container">
      <!-- Show form only if user is logged in -->
      <div *ngIf="currentUserId; else loginPrompt">
        <!-- Edit/Create Form -->
        <form (ngSubmit)="onSubmit()" *ngIf="!userReview || isEditing" #reviewForm="ngForm">
          <ion-item>
            <ion-label position="stacked">Rating</ion-label>
            <ion-range
              [(ngModel)]="review.stars"
              name="stars"
              min="1"
              max="5"
              step="1"
              snaps="true"
              pin="true"
              color="warning"
              required
            >
              <ion-icon slot="start" name="star-outline"></ion-icon>
              <ion-icon slot="end" name="star"></ion-icon>
            </ion-range>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Your Review</ion-label>
            <ion-textarea
              [(ngModel)]="review.text"
              name="text"
              placeholder="Share your experience..."
              [rows]="3"
              required
              minlength="10"
              #reviewText="ngModel"
            ></ion-textarea>
          </ion-item>
          
          <div *ngIf="reviewText.invalid && (reviewText.dirty || reviewText.touched)" class="ion-padding-start text-red">
            <div *ngIf="reviewText.errors?.['required']">Review text is required.</div>
            <div *ngIf="reviewText.errors?.['minlength']">Review must be at least 10 characters long.</div>
          </div>

          <div class="ion-padding">
            <ion-button expand="block" type="submit" [disabled]="!reviewForm.form.valid">
              {{ isEditing ? 'Update Review' : 'Submit Review' }}
            </ion-button>
            <ion-button 
              *ngIf="isEditing"
              expand="block" 
              color="medium" 
              (click)="cancelEdit()"
            >
              Cancel
            </ion-button>
          </div>
        </form>

        <!-- Display user's review -->
        <div *ngIf="userReview && !isEditing" class="user-review">
          <ion-card>
            <ion-card-header>
              <ion-card-subtitle>Your Review</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div class="rating">
                <ion-icon
                  *ngFor="let num of [1,2,3,4,5]"
                  [name]="num <= userReview.stars ? 'star' : 'star-outline'"
                  color="warning"
                >
                </ion-icon>
              </div>
              <p>{{ userReview.text }}</p>
              <div class="review-actions">
                <ion-button fill="clear" (click)="startEdit()">
                  <ion-icon name="create-outline" slot="start"></ion-icon>
                  Edit
                </ion-button>
                <ion-button fill="clear" color="danger" (click)="confirmDelete()">
                  <ion-icon name="trash-outline" slot="start"></ion-icon>
                  Delete
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      </div>

      <ng-template #loginPrompt>
        <ion-card>
          <ion-card-content>
            <p>Please login to leave a review.</p>
            <ion-button expand="block" routerLink="/login">
              Login
            </ion-button>
          </ion-card-content>
        </ion-card>
      </ng-template>
    </div>
  `,
  styles: [`
    .review-form-container {
      padding: 16px;
    }
    .rating {
      margin: 8px 0;
    }
    .review-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .user-review {
      margin: 16px 0;
    }
    .text-red {
      color: var(--ion-color-danger);
      font-size: 12px;
    }
  `]
})
export class ReviewFormComponent {
  @Input() restaurantId!: string;
  @Output() reviewUpdated = new EventEmitter<void>();

  review: ReviewForm = {
    stars: 5,
    text: ''
  };
  
  currentUserId: string | null = null;
  userReview: any = null;
  isEditing = false;

  constructor(
    private firestore: Firestore,
    private alertCtrl: AlertController,
    private auth: Auth
  ) {
    // Get current user ID
    this.auth.onAuthStateChanged(user => {
      this.currentUserId = user?.uid || null;
      if (this.currentUserId) {
        this.loadUserReview();
      }
    });
  }

  async loadUserReview() {
    if (!this.currentUserId || !this.restaurantId) return;

    const reviewRef = doc(
      this.firestore,
      `restaurant/${this.restaurantId}/reviews/${this.currentUserId}`
    );
    
    try {
      const reviewDoc = await getDoc(reviewRef);
      if (reviewDoc.exists()) {
        this.userReview = { id: reviewDoc.id, ...reviewDoc.data() };
      }
    } catch (error) {
      console.error('Error loading review:', error);
    }
  }

  startEdit() {
    this.isEditing = true;
    this.review = {
      stars: this.userReview.stars,
      text: this.userReview.text
    };
  }

  cancelEdit() {
    this.isEditing = false;
    this.review = {
      stars: 5,
      text: ''
    };
  }

  async onSubmit() {
    if (!this.currentUserId) return;

    const reviewData = {
      stars: this.review.stars,
      text: this.review.text,
      userId: this.currentUserId,
      createdAt: Timestamp.now()
    };

    try {
      const reviewRef = doc(
        this.firestore,
        `restaurant/${this.restaurantId}/reviews/${this.currentUserId}`
      );
      
      await setDoc(reviewRef, reviewData);
      
      this.review = { stars: 5, text: '' };
      this.isEditing = false;
      await this.loadUserReview();
      this.reviewUpdated.emit();
      
    } catch (error) {
      console.error('Error saving review:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Unable to save your review. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async confirmDelete() {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete your review?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.deleteReview()
        }
      ]
    });

    await alert.present();
  }

  async deleteReview() {
    if (!this.currentUserId || !this.restaurantId) return;

    try {
      const reviewRef = doc(
        this.firestore,
        `restaurant/${this.restaurantId}/reviews/${this.currentUserId}`
      );
      
      await deleteDoc(reviewRef);
      
      this.userReview = null;
      this.reviewUpdated.emit();
      
    } catch (error) {
      console.error('Error deleting review:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Unable to delete your review. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }
}