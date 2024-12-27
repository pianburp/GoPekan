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
  ownerReply?: {
    text: string;
    createdAt: any;
  };
}

interface RestaurantStatus {
  status: 'open' | 'closing-soon' | 'closed';
  message: string;
  nextOpenTime?: string;
}

interface HoursData {
  open: string;
  close: string;
  isOpen: boolean;
  spanNextDay?: boolean;
  holidayNote?: string;
}

interface OperatingHours {
  [key: string]: HoursData;
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
  operatingHours?: OperatingHours;
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
  operatingHours: OperatingHours | null = null;
  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
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
  
  getDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
  }

  calculateAverageRating(): void {
    if (this.reviews.length === 0) {
      this.averageRating = 0;
      return;
    }
    
    const sum = this.reviews.reduce((acc, review) => acc + review.stars, 0);
    this.averageRating = Number((sum / this.reviews.length).toFixed(1));
  }

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
        this.operatingHours = restaurantData.operatingHours || null;
        
        if (restaurantData.coordinates) {
          this.restaurantLocation = {
            latitude: restaurantData.coordinates.latitude,
            longitude: restaurantData.coordinates.longitude
          };
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
  
    const loading = await this.loadingCtrl.create({
      message: 'Loading reviews and analysis...'
    });
  
    try {
      await loading.present();
  
      const reviewsRef = collection(this.firestore, 'restaurant', this.restaurantId, 'reviews');     
      const querySnapshot = await getDocs(reviewsRef);
      
      this.reviews = querySnapshot.docs.map(doc => {
        const data = doc.data() as Review;
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt
        };
      });
  
      this.reviews.sort((a, b) => {
        return b.createdAt.seconds - a.createdAt.seconds;
      });
      
      this.totalReviews = this.reviews.length;
      this.calculateAverageRating();
      
      if (this.reviews.length > 0) {
        this.isAnalyzing = true;
        try {
          this.reviewAnalysisService.analyzeReviews(this.reviews)
            .subscribe({
              next: (analysis) => {
                this.reviewAnalysis = analysis;
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

  getDayDisplayName(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }

  getFormattedHours(hours: HoursData): string {
    if (!hours.isOpen) return 'Closed';
    let timeStr = `${hours.open} - ${hours.close}`;
    if (hours.spanNextDay) {
      timeStr += ' (next day)';
    }
    if (hours.holidayNote) {
      timeStr += ` (${hours.holidayNote})`;
    }
    return timeStr;
  }

  isOpen24Hours(): boolean {
    if (!this.operatingHours) return false;
    return this.days.every(day => {
      const hours = this.operatingHours?.[day];
      return hours?.isOpen && hours?.open === '00:00' && hours?.close === '23:59';
    });
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
  getRestaurantStatus(): RestaurantStatus {
    if (!this.operatingHours) {
      return { status: 'closed', message: 'Status unknown' };
    }

    if (this.isOpen24Hours()) {
      return { status: 'open', message: 'Open 24 hours' };
    }

    const now = new Date();
    const currentDay = this.days[now.getDay() === 0 ? 6 : now.getDay() - 1]; // Convert to Monday-based index
    const currentHours = this.operatingHours[currentDay];

    if (!currentHours || !currentHours.isOpen) {
      return this.getNextOpenTime(now);
    }

    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const [openHour, openMinute] = currentHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = currentHours.close.split(':').map(Number);

    // Convert current time to minutes for easier comparison
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    // Handle cases where closing time is on the next day
    const isSpanningNextDay = currentHours.spanNextDay;
    const adjustedCloseMinutes = isSpanningNextDay ? closeMinutes + 24 * 60 : closeMinutes;
    const adjustedCurrentMinutes = currentMinutes < openMinutes && isSpanningNextDay ? 
      currentMinutes + 24 * 60 : currentMinutes;

    // Check if restaurant is open
    if (adjustedCurrentMinutes >= openMinutes && adjustedCurrentMinutes < adjustedCloseMinutes) {
      // Check if closing soon (within 60 minutes)
      const minutesUntilClose = adjustedCloseMinutes - adjustedCurrentMinutes;
      if (minutesUntilClose <= 60) {
        return {
          status: 'closing-soon',
          message: `Closing soon (in ${minutesUntilClose} minutes)`
        };
      }
      return { status: 'open', message: 'Open now' };
    }

    return this.getNextOpenTime(now);
  }

  private getNextOpenTime(now: Date): RestaurantStatus {
    let checkDate = new Date(now);
    let daysChecked = 0;

    while (daysChecked < 7) {
      const dayIndex = checkDate.getDay() === 0 ? 6 : checkDate.getDay() - 1;
      const dayName = this.days[dayIndex];
      const hours = this.operatingHours![dayName];

      if (hours && hours.isOpen) {
        const nextOpenTime = hours.open;
        const formattedDay = daysChecked === 0 ? 'today' : 
                            daysChecked === 1 ? 'tomorrow' : 
                            this.getDayDisplayName(dayName);
        
        return {
          status: 'closed',
          message: 'Closed now',
          nextOpenTime: `Opens ${formattedDay} at ${nextOpenTime}`
        };
      }

      checkDate.setDate(checkDate.getDate() + 1);
      daysChecked++;
    }

    return { status: 'closed', message: 'Temporarily closed' };
  }
}
