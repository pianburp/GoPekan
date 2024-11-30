import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, getDocs, Timestamp, doc, getDoc } from '@angular/fire/firestore';
import { LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ReviewAnalysisService, ReviewAnalysis, Review as AnalysisReview } from '../../../services/review-analysis.service';

interface Review {
  text: string;
  stars: number;
  userId: string;
  createdAt: Timestamp;
  id?: string;
}

interface Restaurant {
  name: string;
  desc: string;
  address: string;
  phone: string;
  type: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

@Component({
  selector: 'app-review',
  templateUrl: './review.page.html',
  styleUrls: ['./review.page.scss'],
})
export class ReviewPage implements OnInit {
  restaurantId: string;
  reviews: Review[] = [];
  restaurantName: string = '';
  restaurantDesc: string = '';
  restaurantAddress: string = '';
  restaurantPhone: string = '';
  restaurantType: string = '';
  averageRating: number = 0;
  totalReviews: number = 0;
  restaurantLocation: { latitude: number; longitude: number } | null = null;
  reviewAnalysis: ReviewAnalysis | null = null;
  isAnalyzing: boolean = false;
  displayedReviews: any[] = [];
  private readonly pageSize = 5;
  private currentPage = 1;

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router,
    private reviewAnalysisService: ReviewAnalysisService 
  ) {
    this.restaurantId = this.route.snapshot.paramMap.get('id') || '';
  }

  async ngOnInit() {
    await this.loadRestaurantDetails();
    await this.loadReviews();
    this.updateDisplayedReviews();
  }

  private updateDisplayedReviews() {
    const endIndex = this.currentPage * this.pageSize;
    this.displayedReviews = this.reviews.slice(0, endIndex);
  }

  showMoreReviews() {
    this.currentPage++;
    this.updateDisplayedReviews();
  }
  
  // Helper method to safely get Date from Timestamp
  getDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
  }

  // Helper method to calculate average rating
  calculateAverageRating(): void {
    if (this.reviews.length === 0) {
      this.averageRating = 0;
      return;
    }
    
    const sum = this.reviews.reduce((acc, review) => acc + review.stars, 0);
    this.averageRating = Number((sum / this.reviews.length).toFixed(1));
  }

  // Helper method to get star array for template
  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, index) => index < Math.round(rating) ? 1 : 0);
  }

  async loadRestaurantDetails() {
    if (!this.restaurantId) return;

    try {
      const restaurantRef = doc(this.firestore, 'restaurant', this.restaurantId);
      const restaurantSnap = await getDoc(restaurantRef);
      
      if (restaurantSnap.exists()) {
        const restaurantData = restaurantSnap.data() as Restaurant;
        this.restaurantName = restaurantData.name;
        this.restaurantDesc = restaurantData.desc;
        this.restaurantAddress = restaurantData.address;
        this.restaurantPhone = restaurantData.phone;
        this.restaurantType = restaurantData.type;
        
        // Handle the coordinates data
        if (restaurantData.coordinates) {
          this.restaurantLocation = {
            latitude: restaurantData.coordinates.latitude,
            longitude: restaurantData.coordinates.longitude
          };
          console.log('Restaurant coordinates loaded:', this.restaurantLocation);
        } else {
          console.warn('No coordinates available for this restaurant');
          this.restaurantLocation = null;
        }
      }
    } catch (error) {
      console.error('Error loading restaurant details:', error);
      this.restaurantLocation = null;
    }
  }

  async loadReviews() {
    if (!this.restaurantId) {
      console.log('No restaurantId provided');
      return;
    }
  
    console.log('Loading reviews for restaurant:', this.restaurantId);
    const loading = await this.loadingCtrl.create({
      message: 'Loading reviews and analysis...'
    });
  
    try {
      await loading.present();
  
      const reviewsRef = collection(this.firestore, 'restaurant', this.restaurantId, 'reviews');
      console.log('Reviews reference created');
      
      const querySnapshot = await getDocs(reviewsRef);
      console.log('Got query snapshot, number of reviews:', querySnapshot.size);
      
      this.reviews = querySnapshot.docs.map(doc => {
        const data = doc.data() as Review;
        console.log('Raw review data:', data);
        
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt
        };
      });
  
      // Sort reviews by date (most recent first)
      this.reviews.sort((a, b) => {
        return b.createdAt.seconds - a.createdAt.seconds;
      });
      
      // Update metrics
      this.totalReviews = this.reviews.length;
      this.calculateAverageRating();
      
      // Automatically analyze reviews if there are any
      if (this.reviews.length > 0) {
        this.isAnalyzing = true;
        try {
          this.reviewAnalysisService.analyzeReviews(this.reviews)
            .subscribe({
              next: (analysis) => {
                this.reviewAnalysis = analysis;
                console.log('Review analysis completed:', analysis);
              },
              error: async (error) => {
                console.error('Error analyzing reviews:', error);
                const alert = await this.alertCtrl.create({
                  header: 'Analysis Error',
                  message: 'Unable to analyze reviews. Please try refreshing the page.',
                  buttons: ['OK']
                });
                await alert.present();
              },
              complete: () => {
                this.isAnalyzing = false;
              }
            });
        } catch (error) {
          console.error('Error in analyzeReviews:', error);
          this.isAnalyzing = false;
        }
      }
      
      console.log('Final processed reviews:', this.reviews);
  
    } catch (error) {
      console.error('Error loading reviews:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Unable to load reviews. Please try again later.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      await loading.dismiss();
    }
  }

  navigateToHome() {
    this.router.navigate(['/user/home']);
  }
  async analyzeReviews() {
    if (this.reviews.length === 0) {
      const alert = await this.alertCtrl.create({
        header: 'No Reviews',
        message: 'There are no reviews to analyze.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Analyzing reviews...'
    });

    try {
      await loading.present();
      this.isAnalyzing = true;

      this.reviewAnalysisService.analyzeReviews(this.reviews)
        .subscribe({
          next: (analysis) => {
            this.reviewAnalysis = analysis;
            console.log('Review analysis completed:', analysis);
          },
          error: async (error) => {
            console.error('Error analyzing reviews:', error);
            const alert = await this.alertCtrl.create({
              header: 'Analysis Error',
              message: 'Unable to analyze reviews. Please try again later.',
              buttons: ['OK']
            });
            await alert.present();
          },
          complete: () => {
            this.isAnalyzing = false;
            loading.dismiss();
          }
        });
    } catch (error) {
      console.error('Error in analyzeReviews:', error);
      loading.dismiss();
      this.isAnalyzing = false;
    }
  }
  
}