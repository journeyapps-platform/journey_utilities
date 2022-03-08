import { isPureDate, pureDate } from '../../src/utils';

describe('date functions', function () {
  it('should check pure dates', function () {
    expect(isPureDate(new Date('2014-04-21'))).toBe(true);
    expect(isPureDate(new Date('2014-04-21T00:00:00.0Z'))).toBe(true);
    expect(isPureDate(new Date('2014-04-21T00:00:00.1Z'))).toBe(false);
    expect(isPureDate(new Date('2014-04-21T00:00:01.0Z'))).toBe(false);
    expect(isPureDate(new Date('2014-04-21T00:01:00.0Z'))).toBe(false);
    expect(isPureDate(new Date('2014-04-21T01:00:00.0Z'))).toBe(false);
  });

  it('should make dates pure', function () {
    // Already a pure date
    expect(pureDate(new Date('2014-04-21T00:00:00.0Z')).toISOString()).toBe('2014-04-21T00:00:00.000Z');

    // Times in local timezone
    expect(pureDate(new Date(2014, 3, 21)).toISOString()).toBe('2014-04-21T00:00:00.000Z');
    expect(pureDate(new Date(2014, 3, 21, 0, 0, 0)).toISOString()).toBe('2014-04-21T00:00:00.000Z');
    expect(pureDate(new Date(2014, 3, 21, 23, 59, 59)).toISOString()).toBe('2014-04-21T00:00:00.000Z');
  });
});
