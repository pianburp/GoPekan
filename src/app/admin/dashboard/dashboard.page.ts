import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';

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

  constructor(
    private firestore: Firestore,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      const restaurantsRef = collection(this.firestore, 'restaurant');
      const restaurantsSnapshot = await getDocs(restaurantsRef);
      
      this.totalRestaurants = restaurantsSnapshot.size;
      this.totalReviews = 0;
      this.restaurants = [];

      // Process each restaurant
      for (const restaurantDoc of restaurantsSnapshot.docs) {
        const restaurant = restaurantDoc.data() as Restaurant;
        
        // Get reviews subcollection for this restaurant
        const reviewsRef = collection(this.firestore, 'restaurant', restaurantDoc.id, 'reviews');
        const reviewsSnapshot = await getDocs(reviewsRef);
        
        const reviews = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Review));

        const totalReviews = reviews.length;
        this.totalReviews += totalReviews;

        const averageRating = reviews.length > 0
          ? reviews.reduce((acc, review) => acc + review.stars, 0) / reviews.length
          : 0;

        this.restaurants.push({
          name: restaurant.name,
          totalReviews: totalReviews,
          averageRating: Number(averageRating.toFixed(1))
        });
      }

      // Sort restaurants by average rating (highest first)
      this.restaurants.sort((a, b) => b.averageRating - a.averageRating);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  navigateToHome() {
    this.router.navigate(['admin/home']);
  }
}