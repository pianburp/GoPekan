import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperatingPage } from './operating.page';

describe('OperatingPage', () => {
  let component: OperatingPage;
  let fixture: ComponentFixture<OperatingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OperatingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
