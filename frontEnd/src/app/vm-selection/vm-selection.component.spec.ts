import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VmSelectionComponent } from './vm-selection.component';

describe('VmSelectionComponent', () => {
  let component: VmSelectionComponent;
  let fixture: ComponentFixture<VmSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VmSelectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VmSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
