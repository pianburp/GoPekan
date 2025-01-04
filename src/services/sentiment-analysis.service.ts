import { Injectable } from '@angular/core';
import {
  GoogleGenerativeAI,
  GenerateContentResult,
} from '@google/generative-ai';
import { environment } from '../environments/environment';
import { Observable, from, mergeMap, map, catchError, throwError } from 'rxjs';

export interface SentimentAnalysis {
  overallSentiment: 'Positive' | 'Neutral' | 'Negative';
  score: number;
  summary: string;
  recommendations: string[];
}

export interface RestaurantSentiment {
  restaurantName: string;
  averageRating: number;
  totalReviews: number;
  sentiment: SentimentAnalysis;
}

@Injectable({
  providedIn: 'root',
})
export class SentimentAnalysisService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(environment.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });
  }

  private cleanJsonString(str: string): string {
    if (!str || typeof str !== 'string') {
      throw new Error('Empty or invalid response from API');
    }

    str = str.replace(/```(?:json)?\s*/g, '').replace(/`/g, '');
    str = str.trim();

    if (!str) {
      throw new Error('Empty response after cleaning');
    }

    return str;
  }

  analyzeSentiment(
    reviews: Array<{ text: string; stars: number }>,
    restaurantName: string
  ): Observable<SentimentAnalysis> {
    const prompt = `Role: You are a sentiment analysis expert who outputs only valid JSON.

Task: Analyze the following restaurant reviews and output a sentiment analysis in JSON format.

Restaurant: "${restaurantName}"

Reviews to analyze:
${reviews.map((review) => `- ${review.stars}★: "${review.text}"`).join('\n')}

Required Output Format (exact JSON structure required):
{
  "overallSentiment": "Positive" | "Neutral" | "Negative",
  "score": number from 0 to 100,
  "summary": "Brief analysis of overall sentiment",
  "recommendations": [
    "First specific recommendation based on reviews",
    "Second specific recommendation based on reviews"
  ]
}

Important: 
1. Respond ONLY with the JSON object
2. 'overallSentiment' must be exactly "Positive", "Neutral", or "Negative"
3. No additional text or formatting
4. No markdown
5. No explanation`;

    const safeGenerateContent = async () => {
      try {
        const result = await this.model.generateContent(prompt);
        const text = await result.response.text();
        return text;
      } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to generate sentiment analysis');
      }
    };

    return from(safeGenerateContent()).pipe(
      map((text: string) => {
        const cleanText = this.cleanJsonString(text);
        try {
          const parsedData = JSON.parse(
            cleanText
          ) as Partial<SentimentAnalysis>;

          if (
            !parsedData.overallSentiment ||
            !parsedData.score ||
            !parsedData.summary ||
            !Array.isArray(parsedData.recommendations)
          ) {
            throw new Error('Missing required fields in response');
          }

          const sentiment: SentimentAnalysis = {
            overallSentiment: this.normalizeOverallSentiment(
              parsedData.overallSentiment
            ),
            score: this.normalizeScore(parsedData.score),
            summary: String(parsedData.summary).trim(),
            recommendations: parsedData.recommendations
              .map((rec: string) => rec.trim())
              .filter((rec: string) => rec.length > 0),
          };

          return sentiment;
        } catch (error) {
          console.error('JSON parsing error:', error);
          console.error('Raw response:', text);
          console.error('Cleaned response:', cleanText);
          throw error;
        }
      }),
      catchError((error) => {
        if (reviews.length > 0) {
          const averageRating =
            reviews.reduce((acc, rev) => acc + rev.stars, 0) / reviews.length;
          const fallbackScore = (averageRating / 5) * 100;

          const fallbackAnalysis: SentimentAnalysis = {
            overallSentiment:
              fallbackScore >= 60
                ? 'Positive'
                : fallbackScore >= 40
                ? 'Neutral'
                : 'Negative',
            score: Math.round(fallbackScore),
            summary: `Analysis based on ${
              reviews.length
            } reviews with average rating of ${averageRating.toFixed(
              1
            )} stars.`,
            recommendations: [
              'Consider collecting more detailed customer feedback',
              'Monitor customer satisfaction trends regularly',
            ],
          };

          return from([fallbackAnalysis]);
        }
        return throwError(() => error);
      })
    );
  }

  private normalizeOverallSentiment(
    sentiment: string
  ): 'Positive' | 'Neutral' | 'Negative' {
    const normalized = sentiment.toLowerCase().trim();
    if (normalized.includes('positive')) return 'Positive';
    if (normalized.includes('negative')) return 'Negative';
    return 'Neutral';
  }

  private normalizeScore(score: any): number {
    let normalizedScore = Number(score);

    if (typeof score === 'string') {
      normalizedScore = Number(score.replace(/[^0-9.]/g, ''));
    }

    if (isNaN(normalizedScore)) {
      normalizedScore = 50;
    }

    normalizedScore = Math.min(100, Math.max(0, normalizedScore));
    return Math.round(normalizedScore);
  }

  getSentimentColor(score: number): string {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'danger';
  }
}
