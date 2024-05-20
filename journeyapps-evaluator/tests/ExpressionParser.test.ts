import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConstantTokenExpression,
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
    let [result] = parser.compile('3');
    expect(result).toBeInstanceOf(PrimitiveConstantTokenExpression);
    expect(result.expression).toEqual('3');

    [result] = parser.compile('true');
    expect(result).toBeInstanceOf(PrimitiveConstantTokenExpression);
    expect(result.expression).toEqual('true');
  });

  it('should parse ConstantTokenExpression', ({ parser }) => {
    let [result] = parser.compile('"foo"');
    expect(result).toBeInstanceOf(ConstantTokenExpression);
    expect(result.expression).toEqual('foo');

    [result] = parser.compile('{{cool}}');
    expect(result).toBeInstanceOf(ConstantTokenExpression);
    expect(result.expression).toEqual('{cool}');
  });

  it('should parse ShorthandTokenExpression', ({ parser }) => {
    let [result] = parser.compile('user.name');
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('user.name');

    [result] = parser.compile('user.name.first');
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('user.name.first');

    [result] = parser.compile('{user.name}');
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('user.name');

    [result] = parser.compile('foo');
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('foo');
  });

  it('should parse FunctionTokenExpression', ({ parser }) => {
    let [result] = parser.compile('foo()');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo()');

    [result] = parser.compile('$:foo()');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo()');

    [result] = parser.compile('{$:foo()}');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo()');

    [result] = parser.compile('$:myVar.foo()');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('myVar.foo()');

    // TODO: Test parsing of function arguments to expressions
    [result] = parser.compile('foo("bar", 3, true, {a: "bas"})');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo("bar", 3, true, {a: "bas"})');

    [result] = parser.compile('(function (input){ return input + "bar" })("foo")');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('(function (input){ return input + "bar" })("foo")');

    [result] = parser.compile('foo(user.name.first)');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo(user.name.first)');
    // TODO: Test parsing of function arguments to expressions
  });

  it('should parse in-line expression to FunctionTokenExpression', ({ parser }) => {
    let [result] = parser.compile('$: true ? "Yes" : "No"');
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual(
      '(function(test, consequent, alternate) { return test ? consequent : alternate; })(true, "Yes", "No")'
    );
    // TODO: Test parsing of function arguments to expressions
  });

  it('test', () => {
    // parser.compile('{}');
    // parser.compile('3');
    // parser.compile('true');
    // parser.compile('"foo"');
    // parser.compile('foo');
    // parser.compile('foo()');
    // parser.compile('$:foo()');
    // parser.compile('{$:foo()}');
    // parser.compile('$: true ? "Yes" : "No"');
    // parser.compile('$:viewvar.foo()');
    // parser.compile('user.name');
    // parser.compile('user.name.first');
    // parser.compile('{user.name}');
    // parser.compile('{cool}');
    // parser.compile('{{cool}}');
    // parser.compile('{value:.2f}');
    // parser.compile('product.price:.2f');
    // parser.compile('{product.price:.2f}');
    // parser.compile('foo(user.name.first)');
    // parser.compile('foo("bar", 3, true, {a: "bas"})');
    // parser.compile('foo("bar",3,true,{a:"bas"})');
    // parser.compile('(function (input){ return input + "bar" })("foo")');

    expect(true).toEqual(true);
  });
});
