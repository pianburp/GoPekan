import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth, getAuth } from '@angular/fire/auth';
import { Firestore, collection, collectionData, doc, getDoc, updateDoc, query, orderBy } from '@angular/fire/firestore';
import { Observable, tap, catchError } from 'rxjs';
import { map } from 'rxjs/operators';

interface Review {
  id?: string;
  userId: string;
  text: string;
  stars: number;
  createdAt: any;
  ownerReply?: {
    text: string;
    createdAt: any;
  };
}

@Component({
  selector: 'app-review',
  templateUrl: './review.page.html',
  styleUrls: ['./review.page.scss'],
})
export class ReviewPage implements OnInit {
  reviews: Observable<Review[]> = new Observable<Review[]>();
  restaurantId: string = '';
  isOwner: boolean = false;
  replyText: string = '';
  hasReviews: boolean = false;
  auth = getAuth();
  isLoading: boolean = false; 

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private firestore: Firestore
  ) { }

  ngOnInit() {
    console.log('ReviewPage initialized');
    this.route.params.subscribe(async params => {
      const id = params['id'];
      if (id) {
        this.restaurantId = id;
        if (this.auth.currentUser) {
          await this.checkOwnerStatus();
          this.loadReviews();
        } else {
          this.auth.onAuthStateChanged(async (user) => {
            if (user) {
              await this.checkOwnerStatus();
              this.loadReviews();
            } else {
              this.router.navigate(['/login']);
            }
          });
        }
      }
    });
  }

  loadReviews() {
    if (!this.restaurantId) {
      return;
    }
  
    this.isLoading = true; 
    const reviewsRef = collection(this.firestore, `restaurant/${this.restaurantId}/reviews`);
    const reviewsQuery = query(reviewsRef, orderBy('createdAt', 'desc'));
  
    this.reviews = collectionData(reviewsQuery, { idField: 'id' }).pipe(
      map(reviews => reviews as Review[]),
      tap(reviews => {
        this.hasReviews = reviews.length > 0;
        this.isLoading = false;
      }),
      catchError(error => {
        console.error('Error loading reviews:', error);
        this.isLoading = false; 
        return [];
      })
    );
  }

  async replyToReview(reviewId: string | undefined) {
    if (!reviewId || !this.replyText || !this.restaurantId) return;

    try {
      const reviewRef = doc(this.firestore, `restaurant/${this.restaurantId}/reviews/${reviewId}`);
      await updateDoc(reviewRef, {
        ownerReply: {
          text: this.replyText,
          createdAt: new Date()
        }
      });
      this.replyText = '';
    } catch (error) {
      console.error('Error replying to review:', error);
    }
  }

  async checkOwnerStatus() {
    if (!this.restaurantId || !this.auth.currentUser) return;

    try {
      const restaurantRef = doc(this.firestore, `restaurant/${this.restaurantId}`);
      const restaurantSnap = await getDoc(restaurantRef);
      
      if (restaurantSnap.exists()) {
        this.isOwner = restaurantSnap.data()['ownerId'] === this.auth.currentUser.uid;
      }
    } catch (error) {
      console.error('Error checking owner status:', error);
    }
  }

  formatDate(date: any): string {
    if (date?.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  }

  getStarArray(rating: number): number[] {
    return Array(rating).fill(0);
  }

  navigateToHome() {
    this.router.navigate(['/business/home']);
  }
}