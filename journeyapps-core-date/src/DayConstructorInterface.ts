import { Day } from './DayInterface';

export interface DayConstructor {
  /**
   *
   * @param year number, e.g. 2001
   * @param month 0-11
   * @param day 1-31
   */
  new (year: number, month: number, day: number): Day;

  /**
   * Construct from a Date(time) object, using the date in the local timezone.
   */
  new (date: Date): Day;

  /**
   * Clone a Day object.
   */
  new (date: Day): Day;

  /**
   * Parse a date string, for example:
   *
   *   new Day("2014-02-15")
   *   new Day("2014-02-15T13:15")
   *   new Day("2014-02-15T13:15:11+02")
   *   new Day("2014-02-15T11:15:11Z")
   *
   * @param date - date string
   */
  new (date: string): Day;

  /**
   * Construct from a timestamp number.
   *
   * Must be at exactly 00:00 in UTC.
   *
   * @param date - timestamp in ms
   */
  new (date: number): Day;

  /**
   * Today in the current timezone.
   */
  new (): Day;

  /**
   * Today in the current timezone.
   */
  today(): Day;
  fromUTCDate(date: Date): Day;

  /**
   * Return true if the argument is a Day object.
   */
  isDay(obj: any): obj is Day;
}
