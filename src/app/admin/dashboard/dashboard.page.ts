import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { SentimentAnalysisService, RestaurantSentiment } from '../../../services/sentiment-analysis.service';
import { firstValueFrom } from 'rxjs';
import { PopoverController } from '@ionic/angular';
import { SentimentPopoverComponent } from './components/sentiment-popover.component';

interface Restaurant {
  name: string;
  desc: string;
  id: string;
  imageUrl?: string;
  isVerified: boolean;
  ownerId: string;
}

interface RatingCounts {
  [key: string]: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  totalRestaurants: number = 0;
  totalReviews: number = 0;
  restaurants: Array<{
    name: string;
    totalReviews: number;
    averageRating: number;
    isVerified: boolean;
  }> = [];
  restaurantSentiments: RestaurantSentiment[] = [];
  loadingSentiment = false;

  ratingChart: any;
  distributionChart: any;

  constructor(
    private firestore: Firestore,
    private router: Router,
    private sentimentService: SentimentAnalysisService,
    private popoverController: PopoverController
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  async presentSentimentPopover(event: Event, restaurant: RestaurantSentiment) {
    const popover = await this.popoverController.create({
      component: SentimentPopoverComponent,
      componentProps: {
        restaurant: restaurant
      },
      event: event,
      translucent: true,
      size: 'auto'
    });
  
    await popover.present();
  }

  async loadDashboardData() {
    try {
      this.loadingSentiment = true;
      const restaurantsRef = collection(this.firestore, 'restaurant');
      const restaurantsSnapshot = await getDocs(restaurantsRef);
      
      let verifiedRestaurantsData = [];
      this.totalReviews = 0;
      this.restaurants = [];
      this.restaurantSentiments = [];
      
      const ratingCounts: RatingCounts = {
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0
      };

      for (const restaurantDoc of restaurantsSnapshot.docs) {
        const restaurant = restaurantDoc.data() as Restaurant;
        
        if (restaurant.isVerified) {
          const reviewsRef = collection(this.firestore, 'restaurant', restaurantDoc.id, 'reviews');
          const reviewsSnapshot = await getDocs(reviewsRef);
          
          const reviews = reviewsSnapshot.docs.map(doc => ({
            text: doc.data()['text'] || '',
            stars: doc.data()['stars'] || 0
          }));

          if (reviews.length > 0) {
            try {
              const sentiment = await firstValueFrom(
                this.sentimentService.analyzeSentiment(reviews, restaurant.name)
              );

              const averageRating = reviews.reduce((acc, review) => acc + review.stars, 0) / reviews.length;

              this.restaurantSentiments.push({
                restaurantName: restaurant.name,
                averageRating: Number(averageRating.toFixed(1)),
                totalReviews: reviews.length,
                sentiment
              });

              reviews.forEach(review => {
                const ratingKey = review.stars.toString();
                if (ratingKey in ratingCounts) {
                  ratingCounts[ratingKey]++;
                }
              });

              verifiedRestaurantsData.push({
                name: restaurant.name,
                totalReviews: reviews.length,
                averageRating: Number(averageRating.toFixed(1)),
                isVerified: true
              });

              this.totalReviews += reviews.length;
            } catch (error) {
              console.error(`Error analyzing sentiment for ${restaurant.name}:`, error);
            }
          }
        }
      }

      this.totalRestaurants = verifiedRestaurantsData.length;
      this.restaurants = verifiedRestaurantsData.sort((a, b) => b.averageRating - a.averageRating);

      setTimeout(() => {
        this.createRatingChart();
        this.createDistributionChart(ratingCounts);
      }, 100);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.loadingSentiment = false;
    }
  }

  createRatingChart(): void {
    const ctx = document.getElementById('ratingChart') as HTMLCanvasElement;
    if (this.ratingChart) {
      this.ratingChart.destroy();
    }

    this.ratingChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.restaurants.map(r => r.name),
        datasets: [
          {
            label: 'Average Rating',
            data: this.restaurants.map(r => r.averageRating),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Total Reviews',
            data: this.restaurants.map(r => r.totalReviews),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createDistributionChart(ratingCounts: RatingCounts): void {
    const ctx = document.getElementById('distributionChart') as HTMLCanvasElement;
    if (this.distributionChart) {
      this.distributionChart.destroy();
    }

    this.distributionChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['1★', '2★', '3★', '4★', '5★'],
        datasets: [{
          data: Object.values(ratingCounts),
          backgroundColor: [
            '#FF4444',
            '#FFBB33',
            '#00C851',
            '#33B5E5',
            '#2BBBAD'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

  navigateToHome(): void {
    this.router.navigate(['admin/home']);
  }

  getSentimentColor(score: number): string {
    return this.sentimentService.getSentimentColor(score);
  }
}