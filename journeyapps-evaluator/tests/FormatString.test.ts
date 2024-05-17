import { describe, it, expect } from 'vitest';
import {
  ConstantTokenExpression,
  FormatShorthandTokenExpression,
  FormatString,
  FunctionTokenExpression,
  ShorthandTokenExpression
} from '../src';

describe('FormatString', () => {
  it('should compile ConstantTokenExpressions', () => {
    expect(FormatString.compile('Plain text')).toEqual([new ConstantTokenExpression('Plain text', 0)]);

    expect(FormatString.compile('Plain 123')).toEqual([new ConstantTokenExpression('Plain 123', 0)]);

    // Missing end brace
    expect(FormatString.compile('{person.name')).toEqual([new ConstantTokenExpression('{person.name', 0)]);

    // Escaped value
    expect(FormatString.compile('{{person.name}}')).toEqual([new ConstantTokenExpression('{person.name}', 0)]);
  });

  it('should compile ShorthandTokenExpressions', () => {
    expect(FormatString.compile('{person.name}')).toEqual([new ShorthandTokenExpression('person.name', 0)]);
  });

  it('should compile FormatShorthandTokenExpressions', () => {
    expect(FormatString.compile('R{price:.2f}!')).toEqual([
      new ConstantTokenExpression('R', 0),
      new FormatShorthandTokenExpression('price', '.2f', 1),
      new ConstantTokenExpression('!', 12)
    ]);
  });

  it('should compile mix of TokenExpressions', () => {
    expect(FormatString.compile('{{some text}} more {serial} {something.other:format} {$:foo("bar")}')).toEqual([
      new ConstantTokenExpression('{some text} more ', 0),
      new ShorthandTokenExpression('serial', 19),
      new ConstantTokenExpression(' ', 27),
      new FormatShorthandTokenExpression('something.other', 'format', 28),
      new ConstantTokenExpression(' ', 52),
      new FunctionTokenExpression('foo("bar")', 53)
    ]);
  });

  describe('should compile FunctionTokenExpressions', () => {
    it('with no arguments', () => {
      expect(FormatString.compile('{$:foo()}')).toEqual([new FunctionTokenExpression('$:foo()', 0)]);
    });

    it('with an primitive argument', () => {
      expect(FormatString.compile('{$:foo(2)}')).toEqual([new FunctionTokenExpression('$:foo(2)', 0)]);
    });

    it('with an object argument', () => {
      expect(FormatString.compile('{ $:foo({myObject: 2}) }')).toEqual([
        new FunctionTokenExpression('$:foo({myObject: 2})', 0)
      ]);

      expect(FormatString.compile('{ $:foo({myObject: {b: 1}}) }')).toEqual([
        new FunctionTokenExpression('$:foo({myObject: {b: 1}})', 0)
      ]);

      expect(FormatString.compile("{ $:fn({a: '}'}) }")).toEqual([new FunctionTokenExpression("$:fn({a: '}'})", 0)]);

      expect(FormatString.compile("{ $:fn({a: '{', b: '}'}) }")).toEqual([
        new FunctionTokenExpression("$:fn({a: '{', b: '}'})", 0)
      ]);
    });

    it('with a "{" argument', () => {
      // Ignore brackets in strings
      expect(FormatString.compile('{ $:foo("{") }')).toEqual([new FunctionTokenExpression('$:foo("{")', 0)]);

      expect(FormatString.compile("{ $:foo('{turtles}') }")).toEqual([
        new FunctionTokenExpression("$:foo('{turtles}')", 0)
      ]);
    });

    it('with multiple arguments', () => {
      expect(FormatString.compile('{ $:foo(3, "xyz") }')).toEqual([new FunctionTokenExpression('$:foo(3, "xyz")', 0)]);
    });

    it('with mix of TokenExpressions', () => {
      expect(FormatString.compile('{$:foo({myObject: 2})} {b}')).toEqual([
        new FunctionTokenExpression('$:foo({myObject: 2})', 0),
        new ConstantTokenExpression(' ', 22),
        new ShorthandTokenExpression('b', 23)
      ]);

      expect(FormatString.compile('{person.name} {$:foo()}')).toEqual([
        new ShorthandTokenExpression('person.name', 0),
        new ConstantTokenExpression(' ', 13),
        new FunctionTokenExpression('$:foo()', 14)
      ]);

      expect(FormatString.compile('A B C {$:foo()} X Y Z')).toEqual([
        new ConstantTokenExpression('A B C ', 0),
        new FunctionTokenExpression('$:foo()', 6),
        new ConstantTokenExpression(' X Y Z', 15)
      ]);
    });

    it('with incorrect usage of brackets', () => {
      // Incorrect usage of brackets, revert to constant
      expect(FormatString.compile('{$:foo({3, "xyz")}')).toEqual([
        new ConstantTokenExpression('{$:foo({3, "xyz")}', 0)
      ]);
    });
  });
});
