import { describe, it, expect } from 'vitest';
import { ExpressionParser } from '../src/ExpressionParser';

describe('Expression Parsing ', () => {
  it('test', () => {
    const parser = new ExpressionParser();
    parser.compile('{}');
    parser.compile('3');
    parser.compile('true');
    parser.compile('"foo"');
    parser.compile('foo');
    parser.compile('foo()');
    parser.compile('$:foo()');
    parser.compile('{$:foo()}');
    parser.compile('user.name');
    parser.compile('{user.name}');
    parser.compile('{{cool}}');
    parser.compile('{value:.2f}');
    parser.compile('product.price:.2f');
    parser.compile('{product.price:.2f}');
    parser.compile('foo(user.name.first)');
    parser.compile('foo("bar", 3, true, {a: "bas"})');
    parser.compile('foo("bar",3,true,{a:"bas"})');
    parser.compile('(function (input){ return input + "bar" })("foo")');

    expect(true).toEqual(true);
  });
});
