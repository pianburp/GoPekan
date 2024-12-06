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
  private readonly MAX_REQUESTS_PER_MINUTE = 60; // Adjust based on your API quota
  private readonly COOLDOWN_PERIOD = 60000; // 1 minute in milliseconds

  constructor() {
    this.genAI = new GoogleGenerativeAI(environment.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      // Check rate limiting
      if (this.requestCounter >= this.MAX_REQUESTS_PER_MINUTE) {
        await new Promise(resolve => setTimeout(resolve, this.COOLDOWN_PERIOD));
        this.requestCounter = 0;
      }

      const prompt = `Analyze the sentiment of the following review text and provide a score between -1 (most negative) and 1 (most positive), and a label (positive, neutral, or negative).
      
      Review: "${text}"
      
      Important: Only respond with a JSON object. No markdown, no code blocks, no additional text. Just the pure JSON object in this exact format:
      { "score": number, "label": "positive" | "neutral" | "negative" }`;

      this.requestCounter++;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text().trim();
      
      // Remove any markdown code block indicators and extra whitespace
      const cleanedResponse = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const sentimentResult = JSON.parse(cleanedResponse);

      // Validate the response format
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
        // Wait and retry once on rate limit error
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.analyzeSentiment(text);
      }
      // Return neutral sentiment as fallback
      return { score: 0, label: 'neutral' };
    }
  }

  async analyzeReviewsBatch(reviews: Review[]): Promise<SentimentResult[]> {
    const results: SentimentResult[] = [];
    const batchSize = 5; // Process 5 reviews at a time
    
    for (let i = 0; i < reviews.length; i += batchSize) {
      const batch = reviews.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(review => this.analyzeSentiment(review.text))
      );
      results.push(...batchResults);
      
      // Add a small delay between batches to prevent rate limiting
      if (i + batchSize < reviews.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
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