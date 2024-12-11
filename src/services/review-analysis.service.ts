import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { environment } from '../environments/environment';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Timestamp } from '@angular/fire/firestore';

export interface Review {
  text: string;
  stars: number;
  createdAt: Timestamp;
}

export interface ReviewAnalysis {
  summary: string;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  strengths: string[];
  weaknesses: string[];
  predictedRating: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewAnalysisService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(environment.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  private buildPrompt(reviews: Review[]): string {
    return `Analyze these restaurant reviews and provide a comprehensive analysis:

    Reviews:
    ${reviews.map(review => `- Rating: ${review.stars}/5 stars
      Review: ${review.text}`).join('\n\n')}
    
    Please provide your analysis in exactly this format:

    SUMMARY:
    [One paragraph summarizing the overall customer sentiment and experience]

    SENTIMENT:
    Positive: [X]%
    Negative: [Y]%
    Neutral: [Z]%

    STRENGTHS:
    - [List 3-4 key strengths]

    WEAKNESSES:
    - [List 3-4 areas for improvement]

   PREDICTED RATING:
    [Calculate a star rating between 1-5 based on the sentiment percentages: 
    - If positive% is dominant, rating should be between 4-5
    - If neutral% is dominant, rating should be between 2.5-3.5
    - If negative% is dominant, rating should be between 1-2
    Provide the final number with one decimal place]`;
  }

  private parseResponse(responseText: string): ReviewAnalysis {
    const sections = responseText.split('\n\n');
    
    const summarySection = sections.find(s => s.includes('SUMMARY:'))?.replace('SUMMARY:', '').trim() || '';
    const sentimentSection = sections.find(s => s.includes('SENTIMENT:')) || '';
    const strengthsSection = sections.find(s => s.includes('STRENGTHS:')) || '';
    const weaknessesSection = sections.find(s => s.includes('WEAKNESSES:')) || '';
    const ratingSection = sections.find(s => s.includes('PREDICTED RATING:')) || '';
  
    const sentimentMatches = sentimentSection.match(/\d+(\.\d+)?/g)?.map(Number) || [0, 0, 0];
    const predictedRating = parseFloat(ratingSection.replace('PREDICTED RATING:', '').trim()) || 0;
  
    return {
      summary: summarySection,
      sentiment: {
        positive: sentimentMatches[0] || 0,
        negative: sentimentMatches[1] || 0,
        neutral: sentimentMatches[2] || 0
      },
      strengths: this.parseListItems(strengthsSection),
      weaknesses: this.parseListItems(weaknessesSection),
      predictedRating
    };
  }

  private parseListItems(section: string): string[] {
    return section
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim());
  }

  analyzeReviews(reviews: Review[]): Observable<ReviewAnalysis> {
    return from((async () => {
      try {
        const prompt = this.buildPrompt(reviews);
        const result = await this.model.generateContent(prompt);
        const responseText = result.response.text();
        return this.parseResponse(responseText);
      } catch (error) {
        console.error('Error analyzing reviews:', error);
        throw error;
      }
    })());
  }
}