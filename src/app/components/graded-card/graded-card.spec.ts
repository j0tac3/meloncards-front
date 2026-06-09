import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradedCard } from './graded-card';

describe('GradedCard', () => {
  let component: GradedCard;
  let fixture: ComponentFixture<GradedCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradedCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradedCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
