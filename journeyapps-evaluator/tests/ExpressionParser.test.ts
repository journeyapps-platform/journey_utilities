import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConstantTokenExpression,
  FormatShorthandTokenExpression,
  FunctionTokenExpression,
  PrimitiveConstantTokenExpression,
  ShorthandTokenExpression,
  TokenExpressionParser
} from '../src';

declare module 'vitest' {
  export interface TestContext {
    parser: TokenExpressionParser;
  }
}

describe('Expression Parsing ', () => {
  beforeEach((context) => {
    context.parser = new TokenExpressionParser();
  });

  it('should parse PrimitiveConstantTokenExpression', ({ parser }) => {
    let result = parser.parse('3');
    expect(result).toBeInstanceOf(PrimitiveConstantTokenExpression);
    expect(result.expression).toEqual(3);

    result = parser.parse('true');
    expect(result).toBeInstanceOf(PrimitiveConstantTokenExpression);
    expect(result.expression).toEqual(true);
  });

  it('should parse ConstantTokenExpression', ({ parser }) => {
    let result = parser.parse('"foo"');
    expect(result).toBeInstanceOf(ConstantTokenExpression);
    expect(result.expression).toEqual('foo');

    result = parser.parse('{{cool}}');
    expect(result).toBeInstanceOf(ConstantTokenExpression);
    expect(result.expression).toEqual('{cool}');
  });

  it('should parse ShorthandTokenExpression', ({ parser }) => {
    let result = parser.parse('user.name');
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('user.name');

    result = parser.parse('user.name.first');
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('user.name.first');

    result = parser.parse('{user.name}');
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('user.name');

    result = parser.parse('foo');
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('foo');
  });

  it('should parse FunctionTokenExpression', ({ parser }) => {
    let result = parser.parse('foo()');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo()');

    result = parser.parse('$:foo()');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo()');

    result = parser.parse('{$:foo()}');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo()');

    result = parser.parse('$:myVar.foo()');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('myVar.foo()');
  });

  it('should parse FunctionTokenExpression with arguments', ({ parser }) => {
    let result = parser.parse<FunctionTokenExpression>('foo("bar", 3, true)');
    expect(result.functionName()).toEqual('foo');
    const args = result.arguments;
    expect(args).toEqual([
      new ConstantTokenExpression('bar'),
      new PrimitiveConstantTokenExpression(3),
      new PrimitiveConstantTokenExpression(true)
    ]);

    result = parser.parse<FunctionTokenExpression>('(function (input){ return input + "bar" })("foo")');
    expect(result.functionName()).toEqual('function (input){ return input + "bar" }');
    expect(result.arguments).toEqual([new ConstantTokenExpression('foo')]);

    result = parser.parse<FunctionTokenExpression>('foo(user.name.first)');
    expect(result.functionName()).toEqual('foo');
    expect(result.arguments).toEqual([new ShorthandTokenExpression('user.name.first')]);
  });

  it('should parse in-line expression to FunctionTokenExpression', ({ parser }) => {
    let result = parser.parse<FunctionTokenExpression>('$: user ? "Yes" : "No"');
    expect(result.expression).toEqual(
      '(function(test, consequent, alternate) { return test ? consequent : alternate; })(user, "Yes", "No")'
    );
    expect(result.arguments).toEqual([
      new ShorthandTokenExpression('user'),
      new ConstantTokenExpression('Yes'),
      new ConstantTokenExpression('No')
    ]);
  });

  it('should parse format specifiers', ({ parser }) => {
    let result = parser.parse('value:05');
    expect(result).toBeInstanceOf(FormatShorthandTokenExpression);
    expect(result.expression).toEqual('value');
    expect(result.format).toEqual('05');

    result = parser.parse('{value:.2f}');
    expect(result).toBeInstanceOf(FormatShorthandTokenExpression);
    expect(result.expression).toEqual('value');
    expect(result.format).toEqual('.2f');

    result = parser.parse('{product.price:.2f}');
    expect(result).toBeInstanceOf(FormatShorthandTokenExpression);
    expect(result.expression).toEqual('product.price');
    expect(result.format).toEqual('.2f');
  });
});
