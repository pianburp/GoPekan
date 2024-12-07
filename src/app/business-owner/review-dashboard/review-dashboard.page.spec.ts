import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewDashboardPage } from './review-dashboard.page';

describe('ReviewDashboardPage', () => {
  let component: ReviewDashboardPage;
  let fixture: ComponentFixture<ReviewDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
