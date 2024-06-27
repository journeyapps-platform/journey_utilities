import { describe, it, expect } from 'vitest';
import { deepMerge } from '../src';

describe('DeepMerge', () => {
  it('should merge', () => {
    expect(deepMerge({ a: {} }, { b: {} })).toEqual({ a: {}, b: {} });
    expect(deepMerge({ a: { b: { c: {} } }, d: {} }, { a: { e: {} } })).toEqual({ a: { b: { c: {} }, e: {} }, d: {} });
  });
});
