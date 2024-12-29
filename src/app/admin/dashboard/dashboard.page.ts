import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Chart } from 'chart.js/auto';

interface Restaurant {
  name: string;
  desc: string;
  id: string;
  imageUrl?: string;
  isVerified: boolean;
  ownerId: string;
}

interface Review {
  id: string;
  createdAt: Date;
  ownerReply?: string;
  stars: number;
  text: string;
  userid: string;
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
  }> = [];

  ratingChart: any;
  distributionChart: any;
  averageRating: number = 0;

  constructor(
    private firestore: Firestore,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

async loadDashboardData() {
    try {
      const restaurantsRef = collection(this.firestore, 'restaurant');
      const restaurantsSnapshot = await getDocs(restaurantsRef);
      
      this.totalRestaurants = restaurantsSnapshot.size;
      this.totalReviews = 0;
      let totalStars = 0;
      this.restaurants = [];
      
      // Initialize with proper typing
      const ratingCounts: RatingCounts = {
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0
      };

      // Process each restaurant
      for (const restaurantDoc of restaurantsSnapshot.docs) {
        const restaurant = restaurantDoc.data() as Restaurant;
        
        const reviewsRef = collection(this.firestore, 'restaurant', restaurantDoc.id, 'reviews');
        const reviewsSnapshot = await getDocs(reviewsRef);
        
        const reviews = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Review));

        const totalReviews = reviews.length;
        this.totalReviews += totalReviews;

        reviews.forEach(review => {
          const ratingKey = review.stars.toString();
          if (ratingKey in ratingCounts) {
            ratingCounts[ratingKey]++;
            totalStars += review.stars;
          }
        });

        const averageRating = reviews.length > 0
          ? reviews.reduce((acc, review) => acc + review.stars, 0) / reviews.length
          : 0;

        this.restaurants.push({
          name: restaurant.name,
          totalReviews: totalReviews,
          averageRating: Number(averageRating.toFixed(1))
        });
      }

      this.averageRating = this.totalReviews > 0 
        ? Number((totalStars / this.totalReviews).toFixed(1))
        : 0;

      // Sort restaurants by average rating
      this.restaurants.sort((a, b) => b.averageRating - a.averageRating);

      // Create charts
      setTimeout(() => {
        this.createRatingChart();
        this.createDistributionChart(ratingCounts);
      }, 100);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  createRatingChart() {
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

  createDistributionChart(ratingCounts: any) {
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

  navigateToHome() {
    this.router.navigate(['admin/home']);
  }
}