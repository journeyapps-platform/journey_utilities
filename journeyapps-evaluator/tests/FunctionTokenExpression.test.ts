import { describe, it, expect } from 'vitest';

import {
  ConstantTokenExpression,
  functionTokenExpression,
  FunctionTokenExpression,
  LegacyFunctionTokenExpression,
  TokenExpression
} from '../src';

describe('FunctionTokenExpression', () => {
  it('should construct a TokenExpression', () => {
    const token = new FunctionTokenExpression('$:foo()', 3);
    expect(token).toBeInstanceOf(TokenExpression);
    expect(token.expression).toEqual('foo()');
    expect(token.start).toEqual(3);
    expect(token.format).toBeNull();
    expect(token.isConstant()).toEqual(false);
    expect(token.isShorthand()).toEqual(false);
    expect(token.isFunction()).toEqual(true);
  });

  it('should have the correct prefix', () => {
    // purely for safety, just testing the constant value
    expect(FunctionTokenExpression.PREFIX).toEqual('$:');
  });

  it('should remove the prefix from the expression', () => {
    const token = new FunctionTokenExpression('$:foo()', 5);
    expect(token.expression).toEqual('foo()');
    expect(token.start).toEqual(5);
  });

  it('should allow expressions without the prefix', () => {
    const token = new FunctionTokenExpression('foo()', 5);
    expect(token.expression).toEqual('foo()');
    expect(token.start).toEqual(5);
  });

  it('should give the function name', () => {
    const token = new FunctionTokenExpression('$:foo()');
    expect(token.functionName()).toEqual('foo');
  });

  it('should give the function name where there are arguments', () => {
    const token = new FunctionTokenExpression('$:foo(5, "bar")', 5);
    expect(token.functionName()).toEqual('foo');
  });

  it('should be able to convert to a constant token expression without escape tags by default', () => {
    const token = new FunctionTokenExpression('$:foo()', 5);
    const constantToken = token.toConstant();
    expect(constantToken).toBeInstanceOf(ConstantTokenExpression);
    expect(constantToken.expression).toEqual('$:foo()');
    expect(constantToken.valueOf()).toEqual('$:foo()');
    expect(constantToken.start).toEqual(5);
  });

  it('should be able to convert to a constant token expression with escape tags', () => {
    const token = new FunctionTokenExpression('$:foo()', 5);
    const constantToken = token.toConstant(true);
    expect(constantToken).toBeInstanceOf(ConstantTokenExpression);
    expect(constantToken.expression).toEqual('{$:foo()}');
    expect(constantToken.valueOf()).toEqual('{$:foo()}');
    expect(constantToken.start).toEqual(5);
  });

  describe('via functionTokenExpression()', () => {
    it('should return null for a null input', () => {
      expect(functionTokenExpression(null)).toBeNull();
    });

    it('should return a function token expression', () => {
      const token = functionTokenExpression('$:foo()');
      expect(token).toBeInstanceOf(FunctionTokenExpression);
      expect(token.expression).toEqual('foo()');
    });

    it('should return a legacy token expression', () => {
      const token = functionTokenExpression('foo');
      expect(token).toBeInstanceOf(LegacyFunctionTokenExpression);
      expect(token.expression).toEqual('foo');
    });

    it('should return null for a legacy token expression when not allowed', () => {
      const token = functionTokenExpression('foo', false);
      expect(token).toBeNull();
    });

    it('should return a legacy token expression if explicitly allowed', () => {
      const token = functionTokenExpression('foo', true);
      expect(token).toBeInstanceOf(LegacyFunctionTokenExpression);
      expect(token.expression).toEqual('foo');
    });
  });
});

describe('LegacyFunctionTokenExpression', () => {
  it('should construct a TokenExpression', () => {
    const token = new LegacyFunctionTokenExpression('foo', 3);
    expect(token).toBeInstanceOf(TokenExpression);
    expect(token.expression).toEqual('foo');
    expect(token.start).toEqual(3);
    expect(token.format).toBeNull();
    expect(token.isConstant()).toEqual(false);
    expect(token.isShorthand()).toEqual(false);
    expect(token.isFunction()).toEqual(true);
  });

  it('should be able to convert to a constant token expression without escape tags by default', () => {
    const token = new LegacyFunctionTokenExpression('foo', 5);
    const constantToken = token.toConstant();
    expect(constantToken).toBeInstanceOf(ConstantTokenExpression);
    expect(constantToken.expression).toEqual('foo');
    expect(constantToken.valueOf()).toEqual('foo');
    expect(constantToken.start).toEqual(5);
  });

  it('should be able to convert to a constant token expression with escape tags', () => {
    const token = new LegacyFunctionTokenExpression('foo', 5);
    const constantToken = token.toConstant(true);
    expect(constantToken).toBeInstanceOf(ConstantTokenExpression);
    expect(constantToken.expression).toEqual('{foo}');
    expect(constantToken.valueOf()).toEqual('{foo}');
    expect(constantToken.start).toEqual(5);
  });
});
