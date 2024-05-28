import { describe, it, expect } from 'vitest';

import {
  ConstantTokenExpression,
  functionTokenExpression,
  FunctionTokenExpression,
  LegacyFunctionTokenExpression,
  PrimitiveConstantTokenExpression,
  TokenExpression
} from '../src';

describe('FunctionTokenExpression', () => {
  it('should parse expression without prefix', () => {
    const token = FunctionTokenExpression.parse('foo()');
    expect(token.expression).toEqual('foo()');
    expect(token.functionName()).toEqual('foo');
    expect(token.arguments).toEqual([]);
    expect(token.format).toBeNull();
    expect(token.isConstant()).toEqual(false);
    expect(token.isShorthand()).toEqual(false);
    expect(token.isFunction()).toEqual(true);
  });

  it('should parse expression with prefix', () => {
    const token = FunctionTokenExpression.parse('$:foo()');
    expect(token.expression).toEqual('foo()');
    expect(token.functionName()).toEqual('foo');
    expect(token.arguments).toEqual([]);
    expect(token.format).toBeNull();
    expect(token.isConstant()).toEqual(false);
    expect(token.isShorthand()).toEqual(false);
    expect(token.isFunction()).toEqual(true);
  });

  it('should parse expression with arguments', () => {
    const token = FunctionTokenExpression.parse('$:foo(5, "bar")');
    expect(token.expression).toEqual('foo(5, "bar")');
    expect(token.functionName()).toEqual('foo');
    expect(token.arguments).toEqual([
      new PrimitiveConstantTokenExpression({ expression: 5 }),
      new ConstantTokenExpression({ expression: 'bar' })
    ]);
  });

  it('should parse expression without brackets', () => {
    const token = FunctionTokenExpression.parse('$:foo');
    expect(token).toBeInstanceOf(FunctionTokenExpression);
    expect(token.expression).toEqual('foo');
    expect(token.isShorthand()).toEqual(false);
    expect(token.functionName()).toEqual('foo');
    expect(token.stringify()).toEqual('$:foo()');
  });

  it('should parse expression without function specifier or brackets', () => {
    const token = FunctionTokenExpression.parse('foo');
    expect(token).toBeInstanceOf(FunctionTokenExpression);
    expect(token.expression).toEqual('foo');
    expect(token.isShorthand()).toEqual(true);
    expect(token.functionName()).toEqual('foo');
    expect(token.stringify()).toEqual('foo');
  });

  it('should be able to convert to a constant token expression without escape tags by default', () => {
    const token = new FunctionTokenExpression({ expression: '$:foo()', start: 5 });
    const constantToken = token.toConstant();
    expect(constantToken).toBeInstanceOf(ConstantTokenExpression);
    expect(constantToken.expression).toEqual('$:foo()');
    expect(constantToken.valueOf()).toEqual('$:foo()');
    expect(constantToken.start).toEqual(5);
  });

  it('should be able to convert to a constant token expression with escape tags', () => {
    const token = new FunctionTokenExpression({ expression: '$:foo()', start: 5 });
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
    const token = new LegacyFunctionTokenExpression({ expression: 'foo', start: 3 });
    expect(token).toBeInstanceOf(TokenExpression);
    expect(token.expression).toEqual('foo');
    expect(token.start).toEqual(3);
    expect(token.format).toBeNull();
    expect(token.isConstant()).toEqual(false);
    expect(token.isShorthand()).toEqual(false);
    expect(token.isFunction()).toEqual(true);
  });

  it('should be able to convert to a constant token expression without escape tags by default', () => {
    const token = new LegacyFunctionTokenExpression({ expression: 'foo', start: 5 });
    const constantToken = token.toConstant();
    expect(constantToken).toBeInstanceOf(ConstantTokenExpression);
    expect(constantToken.expression).toEqual('foo');
    expect(constantToken.valueOf()).toEqual('foo');
    expect(constantToken.start).toEqual(5);
  });

  it('should be able to convert to a constant token expression with escape tags', () => {
    const token = new LegacyFunctionTokenExpression({ expression: 'foo', start: 5 });
    const constantToken = token.toConstant(true);
    expect(constantToken).toBeInstanceOf(ConstantTokenExpression);
    expect(constantToken.expression).toEqual('{foo}');
    expect(constantToken.valueOf()).toEqual('{foo}');
    expect(constantToken.start).toEqual(5);
  });
});
