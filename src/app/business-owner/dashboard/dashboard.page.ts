import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, query, where, getDocs, doc, DocumentData } from '@angular/fire/firestore';
import { LoadingController, AlertController, PopoverController } from '@ionic/angular';
import { DashboardSentimentService, SentimentResult } from '../../../services/dashboard-sentiment.service';

interface Restaurant {
  id: string;
  name: string;
  desc: string;
  ownerId: string;
}

interface Review {
  id: string;
  stars: number;
  text: string;
  sentiment?: {
    score: number;
    label: string;
  };
}

interface RestaurantMetrics {
  restaurantId: string;
  restaurantName: string;
  totalReviews: number;
  averageRating: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topKeywords: string[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
  restaurants: Restaurant[] = [];
  restaurantMetrics: RestaurantMetrics[] = [];
  isLoading = false;

  constructor(
    private router: Router,
    private auth: Auth,
    private firestore: Firestore,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private popoverController: PopoverController,
    private sentimentService: DashboardSentimentService
  ) {}

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      this.isLoading = true;
      const loading = await this.loadingCtrl.create({
        message: 'Loading dashboard...'
      });
      await loading.present();

      // Get current user
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }

      // Get restaurants owned by user
      const restaurantsRef = collection(this.firestore, 'restaurant');  // Changed from 'restaurants' to 'restaurant' to match security rules
      const q = query(restaurantsRef, where('ownerId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      this.restaurants = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Restaurant));

      // Get metrics for each restaurant
      this.restaurantMetrics = await Promise.all(
        this.restaurants.map(restaurant => this.getRestaurantMetrics(restaurant))
      );

      await loading.dismiss();
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      this.showError('Failed to load dashboard data');
      this.isLoading = false;
    }
  }

  async getRestaurantMetrics(restaurant: Restaurant): Promise<RestaurantMetrics> {
    // Get reviews for the restaurant
    const reviewsRef = collection(doc(this.firestore, 'restaurant', restaurant.id), 'reviews');
    const reviewsSnapshot = await getDocs(reviewsRef);
    const reviews = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Review));

    // Calculate metrics
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((acc, review) => acc + review.stars, 0) / totalReviews || 0;

    // Perform sentiment analysis for each review
    const reviewsWithSentiment = await Promise.all(
      reviews.map(async review => {
        const sentiment = await this.analyzeSentiment(review.text);
        return { ...review, sentiment };
      })
    );

    // Calculate sentiment distribution
    const sentimentDistribution = reviewsWithSentiment.reduce(
      (acc, review) => {
        if (review.sentiment?.score >= 0.3) acc.positive++;
        else if (review.sentiment?.score <= -0.3) acc.negative++;
        else acc.neutral++;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    // Extract top keywords (simple implementation - can be enhanced)
    const topKeywords = this.extractTopKeywords(reviews.map(r => r.text));

    return {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      totalReviews,
      averageRating,
      sentimentDistribution,
      topKeywords
    };
  }

  private async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      const result = await this.sentimentService.analyzeSentiment(text);
      return result;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return { score: 0, label: 'neutral' };
    }
  }

  extractTopKeywords(texts: string[]): string[] {
    // Combine all texts
    const combinedText = texts.join(' ').toLowerCase();
    
    // Remove common words and split into words
    const commonWords = new Set(['the', 'and', 'is', 'in', 'to', 'a', 'of', 'for', 'with']);
    const words = combinedText.split(/\W+/).filter(word => 
      word.length > 2 && !commonWords.has(word)
    );

    // Count word frequency
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sort by frequency and take top 10
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  navigateToHome() {
    this.router.navigate(['business/home']);
  }

  navigateToReviewDashboard(restaurantId: string) {
    if (restaurantId) {
      this.router.navigate([`/business/review-dashboard/${restaurantId}`]);
    }
  }
}