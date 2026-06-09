import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RigidCaseCard } from './rigid-case-card';

describe('RigidCaseCard', () => {
  let component: RigidCaseCard;
  let fixture: ComponentFixture<RigidCaseCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RigidCaseCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RigidCaseCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
