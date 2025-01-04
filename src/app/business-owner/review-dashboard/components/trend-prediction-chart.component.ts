// trend-prediction-chart.component.ts
import { Component, OnInit, ElementRef, ViewChild, Input, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { ReviewAnalysis } from '../../../../services/review-dashboard.service';

@Component({
  selector: 'app-trend-prediction-chart',
  template: `
    <div class="chart-container">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      height: 300px;
      width: 100%;
      margin: 20px 0;
    }
  `]
})
export class TrendPredictionChartComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('chartCanvas') private chartCanvas!: ElementRef;
  @Input() analysis: ReviewAnalysis | null = null;
  
  private chart: Chart | undefined;

  ngOnInit() {
    // Initial setup if needed
  }

  ngAfterViewInit() {
    if (this.analysis) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['analysis'] && !changes['analysis'].firstChange && this.chartCanvas) {
      if (this.chart) {
        this.chart.destroy();
      }
      if (this.analysis) {
        this.createChart();
      }
    }
  }

  private createChart() {
    if (!this.analysis) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    // Calculate predicted sentiment value based on trend
    const currentSentiment = this.analysis.mood.positive;
    let predictedSentiment = currentSentiment;
    
    switch (this.analysis.trendPrediction.sentimentTrend) {
      case 'improving':
        predictedSentiment = Math.min(100, currentSentiment + 10);
        break;
      case 'declining':
        predictedSentiment = Math.max(0, currentSentiment - 10);
        break;
      // 'stable' keeps the same value
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(154, 193, 252, 0.4)');
    gradient.addColorStop(1, 'rgba(154, 193, 252, 0)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Current', 'Next Month'],
        datasets: [{
          label: 'Sentiment Trend',
          data: [currentSentiment, predictedSentiment],
          borderColor: '#9ac1fc',
          backgroundColor: gradient,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#9ac1fc',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#ffffff'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            callbacks: {
              label: (context) => `Sentiment: ${context.parsed.y.toFixed(1)}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ffffff',
              callback: (value) => `${value}%`
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ffffff'
            }
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}