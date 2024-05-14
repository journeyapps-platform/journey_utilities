import { describe, it, expect } from 'vitest';
import {
  actionableTokenExpression,
  ConstantTokenExpression,
  FormatShorthandTokenExpression,
  functionTokenExpression,
  FunctionTokenExpression,
  LegacyFunctionTokenExpression,
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
});

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
    const token = new FunctionTokenExpression('$:foo()', 5);
    expect(token.functionName()).toEqual('foo');
  });

  it('should give the function name where there are arguments', () => {
    const token = new FunctionTokenExpression('$:foo(5, "bar")', 5);
    expect(token.functionName()).toEqual('foo');
  });

  it('should be able to convert to a constant token expression without escape tags by default', () => {
    const token = new FunctionTokenExpression('$:foo()', 5);
    expect(token.expression).toEqual('foo()'); // safety check
    const constantToken = token.toConstant();
    expect(constantToken).toBeInstanceOf(ConstantTokenExpression);
    expect(constantToken.expression).toEqual('$:foo()');
    expect(constantToken.valueOf()).toEqual('$:foo()');
    expect(constantToken.start).toEqual(5);
  });

  it('should be able to convert to a constant token expression without escape tags', () => {
    const token = new FunctionTokenExpression('$:foo()', 5);
    expect(token.expression).toEqual('foo()'); // safety check
    const constantToken = token.toConstant(false);

    expect(constantToken).toBeInstanceOf(ConstantTokenExpression);
    expect(constantToken.expression).toEqual('$:foo()');
    expect(constantToken.valueOf()).toEqual('$:foo()');
    expect(constantToken.start).toEqual(5);
  });

  it('should be able to convert to a constant token expression with escape tags', () => {
    const token = new FunctionTokenExpression('$:foo()', 5);
    expect(token.expression).toEqual('foo()'); // safety check
    const constantToken = token.toConstant(true);
    expect(constantToken).toBeInstanceOf(ConstantTokenExpression);
    expect(constantToken.expression).toEqual('{$:foo()}');
    expect(constantToken.valueOf()).toEqual('{$:foo()}');
    expect(constantToken.start).toEqual(5);
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
    expect(token.expression).toEqual('foo'); // safety check
    const constantToken = token.toConstant();
    expect(constantToken).toBeInstanceOf(ConstantTokenExpression);
    expect(constantToken.expression).toEqual('foo');
    expect(constantToken.valueOf()).toEqual('foo');
    expect(constantToken.start).toEqual(5);
  });

  it('should be able to convert to a constant token expression without escape tags', () => {
    const token = new LegacyFunctionTokenExpression('foo', 5);
    expect(token.expression).toEqual('foo'); // safety check
    const constantToken = token.toConstant(false);
    expect(constantToken).toBeInstanceOf(ConstantTokenExpression);
    expect(constantToken.expression).toEqual('foo');
    expect(constantToken.valueOf()).toEqual('foo');
    expect(constantToken.start).toEqual(5);
  });

  it('should be able to convert to a constant token expression with escape tags', () => {
    const token = new LegacyFunctionTokenExpression('foo', 5);
    expect(token.expression).toEqual('foo'); // safety check
    const constantToken = token.toConstant(true);
    expect(constantToken).toBeInstanceOf(ConstantTokenExpression);
    expect(constantToken.expression).toEqual('{foo}');
    expect(constantToken.valueOf()).toEqual('{foo}');
    expect(constantToken.start).toEqual(5);
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

describe('functionTokenExpression', () => {
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

  it('should return a legacy token expression if explicitly allowed', () => {
    const token = functionTokenExpression('foo', true);
    expect(token).toBeInstanceOf(LegacyFunctionTokenExpression);
    expect(token.expression).toEqual('foo');
  });

  it('should return null for a legacy token expression when not allowed', () => {
    const token = functionTokenExpression('foo', false);
    expect(token).toBeNull();
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
