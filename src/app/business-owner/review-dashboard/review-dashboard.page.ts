import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DashboardReviewService, ReviewAnalysis } from '../../../services/review-dashboard.service';
import { Observable, catchError, finalize, from, of } from 'rxjs';

@Component({
  selector: 'app-review-dashboard',
  templateUrl: './review-dashboard.page.html',
  styleUrls: ['./review-dashboard.page.scss'],
})
export class ReviewDashboardPage implements OnInit {
  reviewAnalysis$: Observable<ReviewAnalysis | null>;
  loading = true;
  error: string | null = null;
  selectedRestaurantId: string | null = null; 

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private reviewService: DashboardReviewService
  ) {
    this.reviewAnalysis$ = of(null);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
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