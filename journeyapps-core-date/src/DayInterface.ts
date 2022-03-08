export interface Day {
  /**
   * Start of the Day (00:00) in UTC.
   */
  toDate(): Date;

  toString(): string;

  toJSON(): string;

  toISOString(): string;

  valueOf(): number;

  /**
   * Start of the Day (00:00) in the local timezone.
   */
  startOfDay(): Date;

  /**
   * End of the Day (23:59:59.999) in the local timezone.
   */
  endOfDay(): Date;

  /**
   * @return a number representing the year, e.g. 2017
   */
  getYear(): number;

  /**
   * @return a number from 0-11 representing the month. 0 is January, 11 is December
   */
  getMonth(): number;

  /**
   * @return a number from 1-31 representing the day of month.
   */
  getDay(): number;

  /**
   * @return a number from 0-6 representing the day of week. 0 is Sunday, 6 is Saturday.
   */
  getDayOfWeek(): number;
}
