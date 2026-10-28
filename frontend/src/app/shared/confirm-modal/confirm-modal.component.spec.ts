import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should not display modal dialog when isOpen is false', () => {
    component.isOpen = false;
    fixture.detectChanges();
    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(backdrop).toBeNull();
  });

  it('should display modal dialog with title and message when isOpen is true', () => {
    component.isOpen = true;
    component.title = 'Confirm Cancellation';
    component.message = 'Are you sure you want to cancel this order?';
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(backdrop).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.modal-title').textContent).toContain('Confirm Cancellation');
    expect(fixture.nativeElement.querySelector('.modal-message').textContent).toContain('Are you sure you want to cancel this order?');
  });

  it('should emit confirm event when confirm button is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();

    const confirmSpy = vi.spyOn(component.confirm, 'emit');
    component.onConfirm();
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should emit cancel event when cancel button is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();

    const cancelSpy = vi.spyOn(component.cancel, 'emit');
    component.onCancel();
    expect(cancelSpy).toHaveBeenCalled();
  });
});
