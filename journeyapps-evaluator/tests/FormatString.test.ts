import { describe, it, expect } from 'vitest';
import {
  ConstantTokenExpression,
  FormatShorthandTokenExpression,
  FormatString,
  FunctionTokenExpression,
  PrimitiveConstantTokenExpression,
  ShorthandTokenExpression
} from '../src';
import { ObjectExpressionToken } from '../src/token-expressions/ObjectExpressionToken';

describe('FormatString', () => {
  it('should compile ConstantTokenExpressions', () => {
    expect(FormatString.compile('Plain text')).toEqual([new ConstantTokenExpression('Plain text', { start: 0 })]);

    expect(FormatString.compile('Plain 123')).toEqual([new ConstantTokenExpression('Plain 123', { start: 0 })]);

    // Missing end brace
    expect(FormatString.compile('{person.name')).toEqual([new ConstantTokenExpression('{person.name', { start: 0 })]);

    // Escaped value
    expect(FormatString.compile('{{person.name}}')).toEqual([
      new ConstantTokenExpression('{person.name}', { start: 0 })
    ]);
  });

  it('should compile ShorthandTokenExpressions', () => {
    expect(FormatString.compile('{person.name}')).toEqual([new ShorthandTokenExpression('person.name', { start: 0 })]);
  });

  it('should compile FormatShorthandTokenExpressions', () => {
    expect(FormatString.compile('R{price:.2f}!')).toEqual([
      new ConstantTokenExpression('R', { start: 0 }),
      new FormatShorthandTokenExpression('price', { format: '.2f', start: 1 }),
      new ConstantTokenExpression('!', { start: 12 })
    ]);
  });

  it('should compile mix of TokenExpressions', () => {
    expect(FormatString.compile('{{some text}} more {serial} {something.other:.2f} {$:foo("bar")}')).toEqual([
      new ConstantTokenExpression('{some text} more ', { start: 0 }),
      new ShorthandTokenExpression('serial', { start: 19 }),
      new ConstantTokenExpression(' ', { start: 27 }),
      new FormatShorthandTokenExpression('something.other', { format: '.2f', start: 28 }),
      new ConstantTokenExpression(' ', { start: 49 }),
      new FunctionTokenExpression('foo("bar")', { start: 50, arguments: [new ConstantTokenExpression('bar')] })
    ]);
  });

  describe('should compile FunctionTokenExpressions', () => {
    it('with no arguments', () => {
      expect(FormatString.compile('{$:foo()}')).toEqual([new FunctionTokenExpression('$:foo()', { start: 0 })]);
    });

    it('with an primitive argument', () => {
      expect(FormatString.compile('{$:foo(2)}')).toEqual([
        new FunctionTokenExpression('$:foo(2)', { start: 0, arguments: [new PrimitiveConstantTokenExpression(2)] })
      ]);
    });

    it('with an object argument', () => {
      expect(FormatString.compile('{ $:foo({myObject: 2}) }')).toEqual([
        new FunctionTokenExpression('$:foo({myObject: 2})', {
          start: 0,
          arguments: [
            new ObjectExpressionToken('{myObject: 2}', {
              properties: { myObject: new PrimitiveConstantTokenExpression(2) }
            })
          ]
        })
      ]);

      expect(FormatString.compile('{ $:foo({myObject: {b: 1}}) }')).toEqual([
        new FunctionTokenExpression('$:foo({myObject: {b: 1}})', {
          start: 0,
          arguments: [
            new ObjectExpressionToken('{myObject: {b: 1}}', {
              properties: {
                myObject: new ObjectExpressionToken('{b: 1}', {
                  properties: { b: new PrimitiveConstantTokenExpression(1) }
                })
              }
            })
          ]
        })
      ]);

      expect(FormatString.compile("{ $:fn({a: '}'}) }")).toEqual([
        new FunctionTokenExpression("$:fn({a: '}'})", {
          start: 0,
          arguments: [new ObjectExpressionToken("{a: '}'}", { properties: { a: new ConstantTokenExpression('}') } })]
        })
      ]);

      expect(FormatString.compile("{ $:fn({a: '{', b: '}'}) }")).toEqual([
        new FunctionTokenExpression("$:fn({a: '{', b: '}'})", {
          start: 0,
          arguments: [
            new ObjectExpressionToken("{a: '{', b: '}'}", {
              properties: { a: new ConstantTokenExpression('{'), b: new ConstantTokenExpression('}') }
            })
          ]
        })
      ]);
    });

    it('with a "{" argument', () => {
      // Ignore brackets in strings
      expect(FormatString.compile('{ $:foo("{") }')).toEqual([
        new FunctionTokenExpression('$:foo("{")', { start: 0, arguments: [new ConstantTokenExpression('{')] })
      ]);

      expect(FormatString.compile("{ $:foo('{turtles}') }")).toEqual([
        new FunctionTokenExpression("$:foo('{turtles}')", {
          start: 0,
          arguments: [new ConstantTokenExpression('{turtles}')]
        })
      ]);
    });

    it('with multiple arguments', () => {
      const [result] = FormatString.compile('{ $:foo(3, "xyz") }');
      expect(result).toBeInstanceOf(FunctionTokenExpression);
      expect(result.expression).toEqual('foo(3, "xyz")');
      expect((result as FunctionTokenExpression).functionName()).toEqual('foo');
      expect((result as FunctionTokenExpression).arguments).toEqual([
        new PrimitiveConstantTokenExpression(3),
        new ConstantTokenExpression('xyz')
      ]);
    });

    it('with mix of TokenExpressions', () => {
      expect(FormatString.compile('{$:foo(2)} {b}')).toEqual([
        new FunctionTokenExpression('$:foo(2)', { start: 0, arguments: [new PrimitiveConstantTokenExpression(2)] }),
        new ConstantTokenExpression(' ', { start: 10 }),
        new ShorthandTokenExpression('b', { start: 11 })
      ]);

      expect(FormatString.compile('{person.name} {$:foo()}')).toEqual([
        new ShorthandTokenExpression('person.name', { start: 0 }),
        new ConstantTokenExpression(' ', { start: 13 }),
        new FunctionTokenExpression('$:foo()', { start: 14 })
      ]);

      expect(FormatString.compile('A B C {$:foo()} X Y Z')).toEqual([
        new ConstantTokenExpression('A B C ', { start: 0 }),
        new FunctionTokenExpression('$:foo()', { start: 6 }),
        new ConstantTokenExpression(' X Y Z', { start: 15 })
      ]);
    });

    it('with incorrect usage of brackets', () => {
      // Incorrect usage of brackets, revert to constant
      expect(FormatString.compile('{$:foo({3, "xyz")}')).toEqual([
        new ConstantTokenExpression('{$:foo({3, "xyz")}', { start: 0 })
      ]);
    });
  });
});
