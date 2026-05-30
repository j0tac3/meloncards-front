import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionModalComponent } from './collection-modal';

describe('CollectionModal', () => {
  let component: CollectionModalComponent;
  let fixture: ComponentFixture<CollectionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CollectionModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollectionModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
