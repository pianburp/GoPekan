import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddReviewPage } from './add-review.page';

describe('AddReviewPage', () => {
  let component: AddReviewPage;
  let fixture: ComponentFixture<AddReviewPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddReviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
