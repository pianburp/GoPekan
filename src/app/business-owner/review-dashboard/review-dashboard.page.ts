import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth, onAuthStateChanged, User, Unsubscribe } from '@angular/fire/auth';
import { DashboardReviewService, ReviewAnalysis } from '../../../services/review-dashboard.service';
import { Observable, catchError, finalize, from, of, Subscription } from 'rxjs';

@Component({
  selector: 'app-review-dashboard',
  templateUrl: './review-dashboard.page.html',
  styleUrls: ['./review-dashboard.page.scss'],
})
export class ReviewDashboardPage implements OnInit, OnDestroy {
  reviewAnalysis$: Observable<ReviewAnalysis | null>;
  loading = true;
  error: string | null = null;
  selectedRestaurantId: string | null = null;
  private currentUser: User | null = null;
  private authUnsubscribe: Unsubscribe | null = null;
  private routeSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private reviewService: DashboardReviewService
  ) {
    this.reviewAnalysis$ = of(null);
  }

  ngOnInit() {
    // Set up auth state listener
    this.authUnsubscribe = onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        // User is signed in
        this.currentUser = user;
        // Subscribe to route params only when authenticated
        this.subscribeToRouteParams();
      } else {
        // User is signed out
        this.currentUser = null;
        this.reviewAnalysis$ = of(null);
        this.error = null;
        // Clean up route subscription
        if (this.routeSubscription) {
          this.routeSubscription.unsubscribe();
          this.routeSubscription = null;
        }
        // Redirect to login
        this.router.navigate(['/login']);
      }
    }, (error) => {
      console.error('Auth state error:', error);
      this.error = 'Authentication error occurred';
      this.loading = false;
    });
  }

  ngOnDestroy() {
    // Clean up all subscriptions when component is destroyed
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  private subscribeToRouteParams() {
    this.routeSubscription = this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.selectedRestaurantId = id;
        this.loadReviewAnalysis(id);
      } else {
        this.error = 'No restaurant ID provided';
        this.loading = false;
      }
    });
  }

  private loadReviewAnalysis(restaurantId: string) {
    // Check if user is authenticated before loading data
    if (!this.currentUser) {
      this.error = 'Please sign in to view review analysis';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;
    
    this.reviewAnalysis$ = this.reviewService.getReviewAnalysis(restaurantId).pipe(
      catchError((error: Error) => {
        console.error('Error in component:', error);
        this.error = error.message || 'Failed to load review analysis. Please try again later.';
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
      })
    );
  }

  navigateToHome() {
    this.router.navigate(['business/dashboard']);
  }

  // Helper methods for template
  getMoodColor(percentage: number): string {
    if (percentage >= 70) return 'text-green-500';
    if (percentage >= 40) return 'text-yellow-500';
    return 'text-red-500';
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'improving': return '↗️';
      case 'declining': return '↘️';
      default: return '→';
    }
  }
}