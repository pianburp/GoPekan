import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap, catchError } from 'rxjs';
import { environment } from '../environments/environment';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Firestore, collection, doc, getDoc, getDocs, DocumentData } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

export interface Review {
  text: string;
  stars: number;
  timestamp: Date;
}

export interface ReviewAnalysis {
  restaurantName: string;
  summary: string;
  pros: string[];
  cons: string[];
  mood: {
    positive: number;
    neutral: number;
    negative: number;
  };
  predictedStars: number;
  trendPrediction: {
    expectedReviews: number;
    sentimentTrend: 'improving' | 'stable' | 'declining';
    confidence: number;
  };
}

interface RestaurantDocument extends DocumentData {
  id: string;
  ['reviews']: Review[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardReviewService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private firestore: Firestore,
    private auth: Auth
  ) {
    this.genAI = new GoogleGenerativeAI(environment.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async getRestaurantReviews(restaurantId: string): Promise<{reviews: Review[], restaurantName: string}> {
    try {
      // Check if user is authenticated
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }
      
      // First get the restaurant document
      const restaurantRef = doc(this.firestore, 'restaurant', restaurantId);
      const restaurantSnap = await getDoc(restaurantRef);
      
      if (!restaurantSnap.exists()) {
        throw new Error('Restaurant not found');
      }
  
      const restaurantData = restaurantSnap.data();
      const restaurantName = restaurantData['name'] || 'Unknown Restaurant';
  
      // Verify this user owns this restaurant
      if (restaurantData['ownerId'] !== currentUser.uid) {
        throw new Error('Not authorized to view this restaurant');
      }
      
      // Get the reviews subcollection
      const reviewsRef = collection(this.firestore, 'restaurant', restaurantId, 'reviews');
      const reviewsSnapshot = await getDocs(reviewsRef);
      
      const reviews: Review[] = [];
      reviewsSnapshot.forEach(doc => {
        const reviewData = doc.data();
        reviews.push({
          text: reviewData['text'],
          stars: reviewData['stars'],
          timestamp: reviewData['createdAt']?.toDate() || new Date(),
        });
      });
  
      return { reviews, restaurantName };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  async analyzeReviews(reviews: Review[]): Promise<ReviewAnalysis> {
    const sortedReviews = [...reviews].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  
    const prompt = `
      Analyze these restaurant reviews (ordered from newest to oldest) and provide:
      1. A concise summary of overall customer sentiment
      2. Key pros and cons
      3. Overall mood analysis (percentage of positive, neutral, and negative reviews)
      4. Predicted star rating based on recent trends
      5. Prediction for upcoming review volume and sentiment trends for next month, considering historical patterns
  
      Reviews with timestamps:
      ${sortedReviews.map(review => {
        const date = review.timestamp.toLocaleDateString();
        return `"${review.text}" - ${review.stars} stars (Posted: ${date})`;
      }).join('\n')}
  
      Additional context for analysis:
      - Total number of reviews: ${reviews.length}
      - Date range: ${new Date(Math.min(...reviews.map(r => r.timestamp.getTime()))).toLocaleDateString()} to ${new Date(Math.max(...reviews.map(r => r.timestamp.getTime()))).toLocaleDateString()}
      - Average reviews per month: ${(reviews.length / ((new Date().getTime() - Math.min(...reviews.map(r => r.timestamp.getTime()))) / (30 * 24 * 60 * 60 * 1000))).toFixed(1)}
  
      Respond ONLY with a JSON object (no markdown, no code blocks) using this structure:
      {
        "summary": "concise summary of overall sentiment, noting any recent changes in sentiment",
        "pros": ["pro1", "pro2"],
        "cons": ["con1", "con2"],
        "mood": {
          "positive": number (percentage between 0-100),
          "neutral": number (percentage between 0-100),
          "negative": number (percentage between 0-100)
        },
        "predictedStars": number,
        "trendPrediction": {
          "expectedReviews": number based on historical monthly average,
          "sentimentTrend": "improving/stable/declining based on recent vs older reviews",
          "confidence": number (percentage between 0-100, do not use decimal format, e.g. use 80 not 0.8)
        }
      }
    `;
  
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const cleanJson = text.replace(/```json\s*|\s*```/g, '').trim();
      const analysis = JSON.parse(cleanJson);
      
      // Ensure confidence is a proper percentage value
      if (analysis.trendPrediction.confidence < 1) {
        analysis.trendPrediction.confidence = Math.round(analysis.trendPrediction.confidence * 100);
      }
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing reviews:', error);
      throw error;
    }
  }

  getReviewAnalysis(restaurantId: string): Observable<ReviewAnalysis> {
    return from(this.getRestaurantReviews(restaurantId)).pipe(
      switchMap(({ reviews, restaurantName }) => {
        if (!reviews || reviews.length === 0) {
          throw new Error('No reviews found for this restaurant');
        }
        return from(this.analyzeReviews(reviews)).pipe(
          map(analysis => ({
            ...analysis,
            restaurantName
          }))
        );
      }),
      catchError((error: Error) => {
        console.error('Review analysis error:', error);
        throw error;
      })
    );
  }
}