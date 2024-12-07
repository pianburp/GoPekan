import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Review {
  text: string;
  stars: number;
  createdAt: Date;
}

export interface SentimentResult {
  score: number;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardSentimentService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private requestCounter = 0;
  private readonly MAX_REQUESTS_PER_MINUTE = 1800; 
  private readonly COOLDOWN_PERIOD = 60000; 
  private lastResetTime = Date.now();

  constructor() {
    this.genAI = new GoogleGenerativeAI(environment.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  private resetCounterIfNeeded() {
    const now = Date.now();
    if (now - this.lastResetTime >= this.COOLDOWN_PERIOD) {
      this.requestCounter = 0;
      this.lastResetTime = now;
    }
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      this.resetCounterIfNeeded();

      // Check rate limiting
      if (this.requestCounter >= this.MAX_REQUESTS_PER_MINUTE) {
        const waitTime = this.COOLDOWN_PERIOD - (Date.now() - this.lastResetTime);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCounter = 0;
        this.lastResetTime = Date.now();
      }

      const prompt = `Analyze the sentiment of the following review text and provide a score between -1 (most negative) and 1 (most positive), and a label (positive, neutral, or negative).
      
      Review: "${text}"
      
      Important: Only respond with a JSON object. No markdown, no code blocks, no additional text. Just the pure JSON object in this exact format:
      { "score": number, "label": "positive" | "neutral" | "negative" }`;

      this.requestCounter++;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text().trim();
      
      const cleanedResponse = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const sentimentResult = JSON.parse(cleanedResponse);

      if (!this.isValidSentimentResult(sentimentResult)) {
        throw new Error('Invalid sentiment result format');
      }

      return sentimentResult;
    } catch (error: unknown) {
      console.error('Error analyzing sentiment:', error);
      if (
        error instanceof Error && 
        (error.message.includes('429') || error.message.includes('quota'))
      ) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.analyzeSentiment(text);
      }
      return { score: 0, label: 'neutral' };
    }
  }

  async analyzeReviewsBatch(reviews: Review[]): Promise<SentimentResult[]> {
    const results: SentimentResult[] = [];
    const batchSize = 25; // Increased from 5 to 25 for faster processing
    
    for (let i = 0; i < reviews.length; i += batchSize) {
      const batch = reviews.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(review => this.analyzeSentiment(review.text))
      );
      results.push(...batchResults);
      
      // Reduced delay between batches since we have higher quota
      if (i + batchSize < reviews.length) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Reduced from 1000ms to 100ms
      }
    }
    
    return results;
  }

  analyzeReviews(reviews: Review[]): Observable<SentimentResult[]> {
    return from(this.analyzeReviewsBatch(reviews));
  }

  private isValidSentimentResult(result: any): result is SentimentResult {
    return (
      typeof result === 'object' &&
      typeof result.score === 'number' &&
      result.score >= -1 &&
      result.score <= 1 &&
      typeof result.label === 'string' &&
      ['positive', 'neutral', 'negative'].includes(result.label)
    );
  }
}