import { describe, expect, it } from 'vitest';
import {
  actionableTokenExpression,
  ConstantTokenExpression,
  FormatShorthandTokenExpression,
  FunctionTokenExpression,
  PrimitiveConstantTokenExpression,
  ShorthandTokenExpression,
  TokenExpression
} from '../src';

describe('TokenExpression', () => {
  it('should be abstract', () => {
    let token = null;
    const construction = () => {
      token = new (TokenExpression as any)('xyz', 4);
    };
    expect(construction).toThrowError();
    expect(token).toBeNull();
  });
});

describe('ConstantTokenExpression', () => {
  it('should construct a TokenExpression', () => {
    const token = new ConstantTokenExpression('XYZ', 3);
    expect(token).toBeInstanceOf(TokenExpression);
    expect(token.expression).toEqual('XYZ');
    expect(token.valueOf()).toEqual('XYZ');
    expect(token.start).toEqual(3);
    expect(token.format).toBeNull();
    expect(token.isConstant()).toEqual(true);
    expect(token.isShorthand()).toEqual(false);
    expect(token.isFunction()).toEqual(false);
  });

  it('should concat expression', () => {
    const token = new ConstantTokenExpression('foo', 3);
    const token2 = token.concat(new ConstantTokenExpression('bar'));
    expect(token2.expression).toEqual('foobar');
    expect(token2.start).toEqual(3);
  });

  it('should construct PrimitiveConstantTokenExpression', () => {
    const token = new PrimitiveConstantTokenExpression('true');
    expect(token.isPrimitive).toEqual(true);
    expect(token.expression).toEqual('true');
  });
});

describe('ShorthandTokenExpression', () => {
  it('should construct a TokenExpression', () => {
    const token = new ShorthandTokenExpression('person.name', 3);
    expect(token).toBeInstanceOf(TokenExpression);
    expect(token.expression).toEqual('person.name');
    expect(token.start).toEqual(3);
    expect(token.format).toBeNull();
    expect(token.isConstant()).toEqual(false);
    expect(token.isShorthand()).toEqual(true);
    expect(token.isFunction()).toEqual(false);
  });
});

describe('FormatShorthandTokenExpression', () => {
  it('should construct a TokenExpression', () => {
    const token = new FormatShorthandTokenExpression('product.price', '.2f', 3);
    expect(token).toBeInstanceOf(TokenExpression);
    expect(token.expression).toEqual('product.price');
    expect(token.start).toEqual(3);
    expect(token.format).toEqual('.2f');
    expect(token.isConstant()).toEqual(false);
    expect(token.isShorthand()).toEqual(true);
    expect(token.isFunction()).toEqual(false);
  });
});

describe('actionableTokenExpression', () => {
  it('should return null for a null input', () => {
    expect(actionableTokenExpression(null)).toBeNull();
  });

  it('should return a function token expression', () => {
    const token = actionableTokenExpression('$:foo()');
    expect(token).toBeInstanceOf(FunctionTokenExpression);
    expect(token.expression).toEqual('foo()');
  });

  it('should return a shorthand token expression', () => {
    const token = actionableTokenExpression('person.name');
    expect(token).toBeInstanceOf(ShorthandTokenExpression);
    expect(token.expression).toEqual('person.name');
  });

  it('should return a format shorthand token expression', () => {
    const token = actionableTokenExpression('product.price:.2f');
    expect(token).toBeInstanceOf(FormatShorthandTokenExpression);
    expect(token.expression).toEqual('product.price');
    expect(token.format).toEqual('.2f');
  });
});
