import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroBars3,
  heroBars3BottomLeft,
  heroCalendarDays,
  heroChevronDown,
  heroChevronLeft,
  heroChevronRight,
  heroChevronUp,
  heroClock,
  heroDocumentDuplicate,
  heroDocumentText,
  heroEye,
  heroMagnifyingGlass,
  heroPlus,
  heroScale,
  heroSquares2x2,
  heroXMark,
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-calendar',
  imports: [CommonModule, NgIconComponent],
  templateUrl: './calendar.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  providers: [
    provideIcons({
      heroChevronRight,
      heroChevronLeft,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {
  // Inputs
  selectedDate = input<Date>(new Date());
  minDate = input<Date | null>(null);
  maxDate = input<Date | null>(null);

  // Outputs
  dateSelected = output<Date>();
  dateStringSelected = output<string>();

  // Internal state
  private currentMonth = signal<Date>(new Date());
  private lastClickedDate = signal<Date | null>(null);

  // Computed values
  days = computed(() => this.generateDaysForMonth(this.currentMonth()));
  monthName = computed(() => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    return this.currentMonth().toLocaleDateString('de-DE', options);
  });

  weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  // Methods
  previousMonth(): void {
    const current = new Date(this.currentMonth());
    current.setMonth(current.getMonth() - 1);
    this.currentMonth.set(current);
  }

  nextMonth(): void {
    const current = new Date(this.currentMonth());
    current.setMonth(current.getMonth() + 1);
    this.currentMonth.set(current);
  }

  selectDate(date: Date): void {
    this.lastClickedDate.set(date);
    this.dateSelected.emit(date);

    // Format the date as a string in German locale (DD.MM.YYYY)
    const dateString = date.toLocaleDateString('de-DE');
    this.dateStringSelected.emit(dateString);
  }

  isLastClickedDate(date: Date): boolean {
    const clicked = this.lastClickedDate();
    if (!clicked) return false;

    return (
      date.getDate() === clicked.getDate() &&
      date.getMonth() === clicked.getMonth() &&
      date.getFullYear() === clicked.getFullYear()
    );
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth().getMonth();
  }

  isSelectedDate(date: Date): boolean {
    const selected = this.selectedDate();
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  isDisabled(date: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();

    if (min && date < min) return true;
    if (max && date > max) return true;

    return false;
  }

  private generateDaysForMonth(month: Date): Date[] {
    const days: Date[] = [];

    // Create a new date object to avoid modifying the original
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDayOfMonth.getDay();
    // Adjust for Monday as first day of week (0 = Monday, 6 = Sunday)
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Add days from previous month to fill the first week
    const daysFromPrevMonth = firstDayOfWeek;
    const prevMonth = new Date(month.getFullYear(), month.getMonth(), 0);
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      days.push(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i));
    }

    // Add all days of current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push(new Date(month.getFullYear(), month.getMonth(), i));
    }

    // Add days from next month to complete the last week
    const daysFromNextMonth = 42 - days.length; // 6 rows of 7 days = 42
    for (let i = 1; i <= daysFromNextMonth; i++) {
      days.push(new Date(month.getFullYear(), month.getMonth() + 1, i));
    }

    return days;
  }
}
