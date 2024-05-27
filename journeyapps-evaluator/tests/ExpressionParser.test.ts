import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConstantTokenExpression,
  FormatShorthandTokenExpression,
  FunctionTokenExpression,
  PrimitiveConstantTokenExpression,
  ShorthandTokenExpression,
  TokenExpressionParser
} from '../src';
import { FormatStringContext } from '../src/context/FormatStringContext';

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
    let result = parser.parse({ source: '3' });
    expect(result).toBeInstanceOf(PrimitiveConstantTokenExpression);
    expect(result.expression).toEqual(3);

    result = parser.parse({ source: 'true' });
    expect(result).toBeInstanceOf(PrimitiveConstantTokenExpression);
    expect(result.expression).toEqual(true);
  });

  it('should parse ConstantTokenExpression', ({ parser }) => {
    let result = parser.parse({ source: '"foo"' });
    expect(result).toBeInstanceOf(ConstantTokenExpression);
    expect(result.expression).toEqual('foo');

    result = parser.parse({ source: '{{cool}}' });
    expect(result).toBeInstanceOf(ConstantTokenExpression);
    expect(result.expression).toEqual('{cool}');
  });

  it('should parse ShorthandTokenExpression', ({ parser }) => {
    let result = parser.parse({ source: 'user.name' });
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('user.name');

    result = parser.parse({ source: 'user.name.first' });
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('user.name.first');

    result = parser.parse({ source: '{user.name}' });
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('user.name');

    result = parser.parse({ source: 'foo' });
    expect(result).toBeInstanceOf(ShorthandTokenExpression);
    expect(result.expression).toEqual('foo');
  });

  it('should parse FunctionTokenExpression', ({ parser }) => {
    let result = parser.parse({ source: 'foo()' });
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo()');

    result = parser.parse({ source: '$:foo()' });
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo()');

    result = parser.parse({ source: '{$:foo()}' });
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('foo()');

    result = parser.parse({ source: '$:myVar.foo()' });
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('myVar.foo()');

    result = parser.parse({ source: '$:myVar' });
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('myVar');

    result = parser.parse({ source: '$:journey.version' });
    expect(result).toBeInstanceOf(FunctionTokenExpression);
    expect(result.expression).toEqual('journey.version');
  });

  it('should parse FunctionTokenExpression with arguments', ({ parser }) => {
    let result = parser.parse<FunctionTokenExpression>({ source: 'foo("bar", 3, true)' });
    expect(result.functionName()).toEqual('foo');
    const args = result.arguments;
    expect(args).toEqual([
      new ConstantTokenExpression({ expression: 'bar' }),
      new PrimitiveConstantTokenExpression({ expression: 3 }),
      new PrimitiveConstantTokenExpression({ expression: true })
    ]);

    result = parser.parse<FunctionTokenExpression>({ source: '(function (input){ return input + "bar" })("foo")' });
    expect(result.functionName()).toEqual('function (input){ return input + "bar" }');
    expect(result.arguments).toEqual([new ConstantTokenExpression({ expression: 'foo' })]);

    result = parser.parse<FunctionTokenExpression>({ source: 'foo(user.name.first)' });
    expect(result.functionName()).toEqual('foo');
    expect(result.arguments).toEqual([new ShorthandTokenExpression({ expression: 'user.name.first' })]);
  });

  it('should parse in-line expression to FunctionTokenExpression', ({ parser }) => {
    let result = parser.parse<FunctionTokenExpression>({ source: '$: user ? "Yes" : "No"' });
    expect(result.expression).toEqual(
      '(function(test, consequent, alternate) { return test ? consequent : alternate; })(user, "Yes", "No")'
    );
    expect(result.arguments).toEqual([
      new ShorthandTokenExpression({ expression: 'user' }),
      new ConstantTokenExpression({ expression: 'Yes' }),
      new ConstantTokenExpression({ expression: 'No' })
    ]);
  });

  it('should parse format specifiers', ({ parser }) => {
    let result = parser.parse({ source: 'value:05', context: new FormatStringContext() });
    expect(result).toBeInstanceOf(FormatShorthandTokenExpression);
    expect(result.expression).toEqual('value');
    expect(result.format).toEqual('05');

    result = parser.parse({ source: '{value:.2f}', context: new FormatStringContext() });
    expect(result).toBeInstanceOf(FormatShorthandTokenExpression);
    expect(result.expression).toEqual('value');
    expect(result.format).toEqual('.2f');

    result = parser.parse({ source: '{product.price:.2f}', context: new FormatStringContext() });
    expect(result).toBeInstanceOf(FormatShorthandTokenExpression);
    expect(result.expression).toEqual('product.price');
    expect(result.format).toEqual('.2f');
  });
});
