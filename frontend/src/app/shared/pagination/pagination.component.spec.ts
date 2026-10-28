import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
  });

  it('should create pagination component', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate totalPages, startIndex, and endIndex accurately', () => {
    component.page = 2;
    component.pageSize = 10;
    component.total = 35;
    fixture.detectChanges();

    expect(component.totalPages).toBe(4);
    expect(component.startIndex).toBe(11);
    expect(component.endIndex).toBe(20);
  });

  it('should clamp endIndex to total on the last page', () => {
    component.page = 4;
    component.pageSize = 10;
    component.total = 35;
    fixture.detectChanges();

    expect(component.startIndex).toBe(31);
    expect(component.endIndex).toBe(35);
  });

  it('should emit pageChange when navigating to a valid page', () => {
    component.page = 1;
    component.pageSize = 10;
    component.total = 30;
    fixture.detectChanges();

    let emittedPage: number | undefined;
    component.pageChange.subscribe(p => emittedPage = p);

    component.goToPage(2);
    expect(emittedPage).toBe(2);
  });

  it('should not emit pageChange when target page is out of bounds or same page', () => {
    component.page = 1;
    component.pageSize = 10;
    component.total = 30;
    fixture.detectChanges();

    const spy = vi.spyOn(component.pageChange, 'emit');

    component.goToPage(0);
    component.goToPage(1);
    component.goToPage(4);

    expect(spy).not.toHaveBeenCalled();
  });
});
