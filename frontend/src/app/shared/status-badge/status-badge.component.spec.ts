import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create the badge', () => {
    expect(component).toBeTruthy();
  });

  it('should render correct class for PLACED and ORDERED', () => {
    component.status = 'PLACED';
    fixture.detectChanges();
    expect(component.getBadgeClass()).toBe('badge-info');

    component.status = 'ORDERED';
    fixture.detectChanges();
    expect(component.getBadgeClass()).toBe('badge-info');
  });

  it('should render correct class for PENDING', () => {
    component.status = 'PENDING';
    fixture.detectChanges();
    expect(component.getBadgeClass()).toBe('badge-neutral');
  });

  it('should render correct class for SHIPPED', () => {
    component.status = 'SHIPPED';
    fixture.detectChanges();
    expect(component.getBadgeClass()).toBe('badge-purple');
  });

  it('should render correct class for DELIVERED / RECEIVED', () => {
    component.status = 'DELIVERED';
    fixture.detectChanges();
    expect(component.getBadgeClass()).toBe('badge-success');

    component.status = 'RECEIVED';
    fixture.detectChanges();
    expect(component.getBadgeClass()).toBe('badge-success');
  });

  it('should render correct class for CANCELLED', () => {
    component.status = 'CANCELLED';
    fixture.detectChanges();
    expect(component.getBadgeClass()).toBe('badge-danger');
  });
});
