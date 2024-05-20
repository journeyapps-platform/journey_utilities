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
    let [result] = parser.parse('3');
    expect(result).toBeInstanceOf(PrimitiveConstantTokenExpression);
    expect(result.expression).toEqual('3');

    [result] = parser.parse('true');
    expect(result).toBeInstanceOf(PrimitiveConstantTokenExpression);
    expect(result.expression).toEqual('true');
  });

  it('should parse ConstantTokenExpression', ({ parser }) => {
    let [result] = parser.parse('"foo"');
    expect(result).toBeInstanceOf(ConstantTokenExpression);
    expect(result.expression).toEqual('foo');

    [result] = parser.parse('{{cool}}');
    expect(result).toBeInstanceOf(ConstantTokenExpression);
    expect(result.expression).toEqual('{cool}');
  });

  it('should parse ShorthandTokenExpression', ({ parser }) => {
    let [result] = parser.parse('user.name');
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('user.name');

    [result] = parser.parse('user.name.first');
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('user.name.first');

    [result] = parser.parse('{user.name}');
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('user.name');

    [result] = parser.parse('foo');
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('foo');
  });

  it('should parse FunctionTokenExpression', ({ parser }) => {
    let [result] = parser.parse('foo()');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo()');

    [result] = parser.parse('$:foo()');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo()');

    [result] = parser.parse('{$:foo()}');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo()');

    [result] = parser.parse('$:myVar.foo()');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('myVar.foo()');

    // TODO: Test parsing of function arguments to expressions
    [result] = parser.parse('foo("bar", 3, true, {a: "bas"})');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo("bar", 3, true, {a: "bas"})');

    [result] = parser.parse('(function (input){ return input + "bar" })("foo")');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('(function (input){ return input + "bar" })("foo")');

    [result] = parser.parse('foo(user.name.first)');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo(user.name.first)');
    // TODO: Test parsing of function arguments to expressions
  });

  it('should parse in-line expression to FunctionTokenExpression', ({ parser }) => {
    let [result] = parser.parse('$: true ? "Yes" : "No"');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual(
      '(function(test, consequent, alternate) { return test ? consequent : alternate; })(true, "Yes", "No")'
    );
    // TODO: Test parsing of function arguments to expressions
  });

  it('should parse format specifiers', ({ parser }) => {
    let [result] = parser.parse('{value:05}');
    expect(result).toBeInstanceOf(FormatShorthandTokenExpression);
    expect(result.expression).toEqual('value');
    expect(result.format).toEqual('05');

    [result] = parser.parse('{value:.2f}');
    expect(result).toBeInstanceOf(FormatShorthandTokenExpression);
    expect(result.expression).toEqual('value');
    expect(result.format).toEqual('.2f');

    [result] = parser.parse('{product.price:.2f}');
    expect(result).toBeInstanceOf(FormatShorthandTokenExpression);
    expect(result.expression).toEqual('product.price');
    expect(result.format).toEqual('.2f');
  });
});
