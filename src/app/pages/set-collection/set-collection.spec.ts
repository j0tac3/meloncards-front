import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetCollection } from './set-collection';

describe('SetCollection', () => {
  let component: SetCollection;
  let fixture: ComponentFixture<SetCollection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetCollection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetCollection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
