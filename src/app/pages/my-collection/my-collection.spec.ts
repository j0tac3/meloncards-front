import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyCollection } from './my-collection';

describe('MyCollection', () => {
  let component: MyCollection;
  let fixture: ComponentFixture<MyCollection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCollection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyCollection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
