/* eslint-disable no-new */

import { Day } from '../../src/Day';

const moment = require('moment');

describe('Day', function () {
  it('should be a value and a type', function () {
    // Explicit type annotation, to test that it can be used as a type.
    var today: Day = new Day();
  });

  it('should construct today by default', function () {
    var today = new Day();
    var now = new Date();
    expect(today.toDate().getUTCFullYear()).toEqual(now.getFullYear());
    expect(today.toDate().getUTCMonth()).toEqual(now.getMonth());
    expect(today.toDate().getUTCDate()).toEqual(now.getDate());
    expect(today.toDate().getUTCHours()).toEqual(0);
    expect(today.toDate().getUTCMinutes()).toEqual(0);
    expect(today.toDate().getUTCSeconds()).toEqual(0);
    expect(today.toDate().getUTCMilliseconds()).toEqual(0);
  });

  it('should construct today explicitly', function () {
    var today = Day.today();
    var now = new Date();
    expect(today.toDate().getUTCFullYear()).toEqual(now.getFullYear());
    expect(today.toDate().getUTCMonth()).toEqual(now.getMonth());
    expect(today.toDate().getUTCDate()).toEqual(now.getDate());
    expect(today.toDate().getUTCHours()).toEqual(0);
    expect(today.toDate().getUTCMinutes()).toEqual(0);
    expect(today.toDate().getUTCSeconds()).toEqual(0);
    expect(today.toDate().getUTCMilliseconds()).toEqual(0);
  });

  it('should construct a Day from a date string', function () {
    var day = new Day('2014-11-24');
    expect(day.toDate().toISOString()).toEqual('2014-11-24T00:00:00.000Z');
  });

  it('should construct a Day from a UTC date', function () {
    var day = Day.fromUTCDate(new Date(Date.UTC(2014, 11, 24)));
    expect(day.toDate().toISOString()).toEqual('2014-12-24T00:00:00.000Z');
  });

  it('should construct a Day from a number', function () {
    expect(new Day(1416787200000).toDate().toISOString()).toEqual('2014-11-24T00:00:00.000Z');
    expect(function () {
      new Day(1416787200001);
    }).toThrow(new Error('Invalid Day'));
    expect(function () {
      new Day(1416787199999);
    }).toThrow(new Error('Invalid Day'));
    expect(function () {
      new Day(1416787201000);
    }).toThrow(new Error('Invalid Day'));
    expect(function () {
      new Day(1416787260000);
    }).toThrow(new Error('Invalid Day'));
    expect(function () {
      new Day(1416790800000);
    }).toThrow(new Error('Invalid Day'));
  });

  it('should construct a Day from a datetime string', function () {
    // No explit timezone
    expect(new Day('2014-11-24T00:00').toDate().toISOString()).toEqual('2014-11-24T00:00:00.000Z');
    expect(new Day('2014-11-24T23:59').toDate().toISOString()).toEqual('2014-11-24T00:00:00.000Z');

    // UTC
    expect(new Day('2014-11-24T00:00Z').toDate().toISOString()).toEqual('2014-11-24T00:00:00.000Z');
    expect(new Day('2014-11-24T23:59Z').toDate().toISOString()).toEqual('2014-11-24T00:00:00.000Z');

    // Specific timezone
    expect(new Day('2014-11-24T00:00+02').toDate().toISOString()).toEqual('2014-11-24T00:00:00.000Z');
    expect(new Day('2014-11-24T23:59+02').toDate().toISOString()).toEqual('2014-11-24T00:00:00.000Z');
  });

  it('should construct a Day from numbers', function () {
    expect(new Day(2014, 10, 24).toDate().toISOString()).toEqual('2014-11-24T00:00:00.000Z');
  });

  it('should construct a Day from a local date', function () {
    var start = new Date(2014, 10, 24, 0, 0, 0);
    var end = new Date(2014, 10, 24, 23, 59, 59);
    expect(new Day(start).toDate().toISOString()).toEqual('2014-11-24T00:00:00.000Z');
    expect(new Day(end).toDate().toISOString()).toEqual('2014-11-24T00:00:00.000Z');
  });

  it('should toString()', function () {
    var day = new Day('2014-11-24');
    expect(day.toString()).toEqual('2014-11-24');
  });

  it('should toISOString()', function () {
    var day = new Day('2014-11-24');
    expect(day.toISOString()).toEqual('2014-11-24');
  });

  it('should toJSON()', function () {
    var day = new Day('2014-11-24');
    expect(day.toJSON()).toEqual('2014-11-24');

    expect(JSON.stringify({ birthday: '2014-11-24' })).toEqual('{"birthday":"2014-11-24"}');
  });

  it('should valueOf()', function () {
    var day = new Day('2014-11-24');
    expect(day.valueOf()).toEqual(1416787200000);
    expect(+day).toEqual(1416787200000);
  });

  it('should startOfDay()', function () {
    var day = new Day('2014-11-24');
    expect(day.startOfDay()).toEqual(new Date(2014, 10, 24, 0, 0, 0));
  });

  it('should endOfDay()', function () {
    var day = new Day('2014-11-24');
    expect(day.endOfDay()).toEqual(new Date(2014, 10, 24, 23, 59, 59, 999));
  });

  it('should clone a Day', function () {
    var day = new Day('2014-11-24');
    var clone = new Day(day);
    expect(clone).toEqual(day);
    expect(clone.toString()).toEqual('2014-11-24');
  });

  it('should convert to moment', function () {
    var m = moment(new Day('2014-11-24').toDate());
    expect(m.utc().format()).toEqual('2014-11-24T00:00:00Z');
  });
});
