import { describe, it, expect } from 'vitest';
import { Version } from '../src';

describe('Version', function () {
  it('should construct without a patch', function () {
    var version = new Version('3.16');
    expect(version.major).toBe(3);
    expect(version.minor).toBe(16);
    expect(version.patch).toBe(null);
    expect(version.v3).toBe(true);
    expect(version.v2).toBe(false);
    expect(version.toString()).toBe('3.16');
    expect(version.valueOf()).toBe('3.16');
  });

  it('should construct with a patch', function () {
    var version = new Version('3.16.2');
    expect(version.major).toBe(3);
    expect(version.minor).toBe(16);
    expect(version.patch).toBe(2);
    expect(version.v3).toBe(true);
    expect(version.v2).toBe(false);
    expect(version.toString()).toBe('3.16.2');

    expect(new Version('3.16.0').toString()).toBe('3.16.0');
  });

  it('should v3', function () {
    expect(new Version('3.16.2').v3).toBe(true);
    expect(new Version('3.16.2').v2).toBe(false);
    expect(new Version('3.16').v3).toBe(true);
    expect(new Version('3.16').v2).toBe(false);
    expect(new Version('4.16').v3).toBe(true);
    expect(new Version('4.16').v2).toBe(false);
    expect(new Version('2.16.0').v3).toBe(false);
    expect(new Version('2.16.0').v2).toBe(true);
  });

  it('should compare', function () {
    expect(new Version('3.16.2').compareTo(new Version('3.16.2'))).toBe(0);
    expect(new Version('3.16.1').compareTo(new Version('3.16.2'))).toBe(-1);
    expect(new Version('3.16.2').compareTo(new Version('3.16.1'))).toBe(1);
    expect(new Version('3.16.20').compareTo(new Version('3.16.5'))).toBe(1);

    expect(new Version('3.16.2').compareTo(new Version('3.16'))).toBe(1);
    expect(new Version('3.16.0').compareTo(new Version('3.16'))).toBe(1);
    expect(new Version('3.16').compareTo(new Version('3.16.2'))).toBe(-1);
    expect(new Version('3.16').compareTo(new Version('3.16.0'))).toBe(-1);
    expect(new Version('3.16').compareTo(new Version('3.16'))).toBe(0);

    expect(new Version('3.17.2').compareTo(new Version('3.16.3'))).toBe(1);
    expect(new Version('3.16.3').compareTo(new Version('3.17.2'))).toBe(-1);

    expect(new Version('4.14.1').compareTo(new Version('3.16.3'))).toBe(1);
    expect(new Version('3.16.3').compareTo(new Version('4.14.1'))).toBe(-1);
  });
});
