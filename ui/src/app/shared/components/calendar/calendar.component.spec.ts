import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarComponent } from './calendar.component';

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the current month and year', () => {
    const currentDate = new Date();
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    const expectedMonthYear = currentDate.toLocaleDateString('de-DE', options);

    const headerElement = fixture.nativeElement.querySelector('h2');
    expect(headerElement.textContent).toContain(expectedMonthYear);
  });

  it('should navigate to previous month when previous button is clicked', () => {
    const currentDate = new Date();
    const previousMonth = new Date(currentDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const prevButton = fixture.nativeElement.querySelector('button[aria-label="Vorheriger Monat"]');
    prevButton.click();
    fixture.detectChanges();

    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    const expectedMonthYear = previousMonth.toLocaleDateString('de-DE', options);

    const headerElement = fixture.nativeElement.querySelector('h2');
    expect(headerElement.textContent).toContain(expectedMonthYear);
  });

  it('should navigate to next month when next button is clicked', () => {
    const currentDate = new Date();
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const nextButton = fixture.nativeElement.querySelector('button[aria-label="Nächster Monat"]');
    nextButton.click();
    fixture.detectChanges();

    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    const expectedMonthYear = nextMonth.toLocaleDateString('de-DE', options);

    const headerElement = fixture.nativeElement.querySelector('h2');
    expect(headerElement.textContent).toContain(expectedMonthYear);
  });

  it('should emit selected date when a day is clicked', () => {
    const today = new Date();
    const spy = spyOn(component.dateSelected, 'emit');

    // Find a day button that's in the current month
    const dayButtons = fixture.nativeElement.querySelectorAll('.calendar-day');
    const currentMonthDayButton = Array.from(dayButtons).find(
      (button: any) => !button.classList.contains('text-gray-400'),
    ) as HTMLElement;

    currentMonthDayButton.click();

    expect(spy).toHaveBeenCalled();
  });

  it('should emit selected date as string when a day is clicked', () => {
    const spy = spyOn(component.dateStringSelected, 'emit');

    // Find a day button that's in the current month
    const dayButtons = fixture.nativeElement.querySelectorAll('.calendar-day');
    const currentMonthDayButton = Array.from(dayButtons).find(
      (button: any) => !button.classList.contains('text-gray-400'),
    ) as HTMLElement;

    // Get the day number from the button
    const dayNumber = parseInt(currentMonthDayButton.textContent!.trim());

    // Create a date object for the expected date
    const expectedDate = new Date();
    expectedDate.setDate(dayNumber);

    currentMonthDayButton.click();

    // Verify the dateStringSelected output was emitted
    expect(spy).toHaveBeenCalled();

    // Verify the emitted value is a string in the expected format (DD.MM.YYYY)
    const emittedValue = spy.calls.mostRecent().args[0];
    expect(typeof emittedValue).toBe('string');
    expect(emittedValue).toBe(expectedDate.toLocaleDateString('de-DE'));
  });
});
