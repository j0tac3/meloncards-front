import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sets } from './sets';

describe('Sets', () => {
  let component: Sets;
  let fixture: ComponentFixture<Sets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sets]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
