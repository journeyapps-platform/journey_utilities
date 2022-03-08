import * as blackmontapp from '../../src/app/index';
import * as schema from '@journeyapps/parser-schema';
import { SingleChoiceIntegerPrimitive, Variable } from '@journeyapps/parser-schema';
import * as evaluator from '@journeyapps/evaluator';
const view = blackmontapp.view;
import { parse } from '@journeyapps/core-xml';

describe('FormatString', function () {
  var scope;

  var personType, companyType;

  beforeEach(function () {
    var s = new schema.Schema();

    var categoryType = new schema.ObjectType('category');
    categoryType.addAttribute(s.variable('name', 'text'));
    categoryType.displayFormat = new evaluator.FormatString('{name}');

    companyType = new schema.ObjectType('company');
    companyType.addAttribute(s.variable('name', 'text'));
    companyType.addAttribute(new schema.Variable('category', categoryType));
    companyType.displayFormat = new evaluator.FormatString('{name} {category}');

    personType = new schema.ObjectType('person');
    personType.addAttribute(s.variable('name', 'text'));
    personType.addAttribute(s.variable('surname', 'text'));
    personType.addAttribute(new schema.Variable('company', companyType));
    personType.displayFormat = new evaluator.FormatString('{name}');

    var viewType = new view.ViewType();
    viewType.addAttribute(s.variable('name', 'text'));
    viewType.addAttribute(s.variable('serial', 'integer'));
    viewType.addAttribute(s.variable('pi', 'decimal'));
    viewType.addAttribute(s.variable('one', 'decimal'));
    viewType.addAttribute(s.variable('person', personType));
    var colours = s.variable<SingleChoiceIntegerPrimitive>('colour', 'single-choice-integer');
    colours.type.setOptionLabels(['Red', 'Green', 'Blue']);
    viewType.addAttribute((colours as unknown) as Variable);

    scope = {
      type: viewType,
      person: {
        type: personType,
        name: 'Peter',
        surname: null,
        toString: function () {
          return 'Custom String';
        }
      },
      name: 'Test',
      serial: 12345,
      pi: 3.14159265359,
      one: 1.0,
      colour: 1 // Green
    };
  });

  it('should compile expressions', function () {
    expect(evaluator._compile('Plain text')).toEqual([new evaluator.ConstantTokenExpression('Plain text', 0)]);

    expect(evaluator._compile('Plain 123')).toEqual([new evaluator.ConstantTokenExpression('Plain 123', 0)]);

    expect(evaluator._compile('{{person.name}}')).toEqual([new evaluator.ConstantTokenExpression('{person.name}', 0)]);

    expect(evaluator._compile('{person.name}')).toEqual([new evaluator.ShorthandTokenExpression('person.name', 0)]);

    expect(evaluator._compile('R{price:.2f}!')).toEqual([
      new evaluator.ConstantTokenExpression('R', 0),
      new evaluator.FormatShorthandTokenExpression('price', '.2f', 1),
      new evaluator.ConstantTokenExpression('!', 12)
    ]);

    expect(evaluator._compile('{{some text}} more {serial} {something.other:format}')).toEqual([
      new evaluator.ConstantTokenExpression('{some text} more ', 0),
      new evaluator.ShorthandTokenExpression('serial', 19),
      new evaluator.ConstantTokenExpression(' ', 27),
      new evaluator.FormatShorthandTokenExpression('something.other', 'format', 28)
    ]);

    expect(evaluator._compile('{$:foo()}')).toEqual([new evaluator.FunctionTokenExpression('$:foo()', 0)]);

    expect(evaluator._compile('{$:foo({myObject: 2})}')).toEqual([
      new evaluator.FunctionTokenExpression('$:foo({myObject: 2})', 0)
    ]);

    expect(evaluator._compile('{$:foo({myObject: {b: 1}})}')).toEqual([
      new evaluator.FunctionTokenExpression('$:foo({myObject: {b: 1}})', 0)
    ]);

    // Ignore brackets in strings
    expect(evaluator._compile('{$:foo("{")}')).toEqual([new evaluator.FunctionTokenExpression('$:foo("{")', 0)]);

    expect(evaluator._compile('{$:foo({myObject: 2})} {b}')).toEqual([
      new evaluator.FunctionTokenExpression('$:foo({myObject: 2})', 0),
      new evaluator.ConstantTokenExpression(' ', 22),
      new evaluator.ShorthandTokenExpression('b', 23)
    ]);

    expect(evaluator._compile('{$:foo(3, "xyz")}')).toEqual([
      new evaluator.FunctionTokenExpression('$:foo(3, "xyz")', 0)
    ]);

    // More complicated examples
    expect(evaluator._compile("{$:fn({a: '}'})}")).toEqual([
      new evaluator.FunctionTokenExpression("$:fn({a: '}'})", 0)
    ]);

    expect(evaluator._compile("{$:fn({a: '{', b: '}'})}")).toEqual([
      new evaluator.FunctionTokenExpression("$:fn({a: '{', b: '}'})", 0)
    ]);

    expect(evaluator._compile("{$:foo('{turtles}')}")).toEqual([
      new evaluator.FunctionTokenExpression("$:foo('{turtles}')", 0)
    ]);

    // Incorrect usage of brackets, revert to constant
    expect(evaluator._compile('{$:foo({3, "xyz")}')).toEqual([
      new evaluator.ConstantTokenExpression('{$:foo({3, "xyz")}', 0)
    ]);

    expect(evaluator._compile('{person.name} {$:foo()}')).toEqual([
      new evaluator.ShorthandTokenExpression('person.name', 0),
      new evaluator.ConstantTokenExpression(' ', 13),
      new evaluator.FunctionTokenExpression('$:foo()', 14)
    ]);

    expect(evaluator._compile('A B C {$:foo()} X Y Z')).toEqual([
      new evaluator.ConstantTokenExpression('A B C ', 0),
      new evaluator.FunctionTokenExpression('$:foo()', 6),
      new evaluator.ConstantTokenExpression(' X Y Z', 15)
    ]);
  });

  it('should validate expressions', function () {
    expect(new evaluator.FormatString('{name}').validate(personType)).toEqual([]);
    expect(new evaluator.FormatString('{company.name}').validate(personType)).toEqual([]);

    expect(new evaluator.FormatString('{namez}').validate(personType)).toEqual([
      { start: 1, end: 6, type: 'error', message: "'namez' is not defined" }
    ]);

    expect(new evaluator.FormatString('{company.namez}').validate(personType)).toEqual([
      {
        start: 1,
        end: 14,
        type: 'error',
        message: "'company.namez' is not defined"
      }
    ]);

    expect(new evaluator.FormatString('{namez:2f}').validate(personType)).toEqual([
      { start: 1, end: 6, type: 'error', message: "'namez' is not defined" }
    ]);

    expect(new evaluator.FormatString('Name: {{}} {name} Error: {error}').validate(personType)).toEqual([
      { start: 26, end: 31, type: 'error', message: "'error' is not defined" }
    ]);

    expect(new evaluator.FormatString('{?name}').validate(personType)).toEqual([
      {
        start: 1,
        end: 2,
        type: 'warning',
        message: 'Usage of ? in expressions is deprecated.'
      }
    ]);
  });

  it('should extract an empty relationship structure', function () {
    var fs = new evaluator.FormatString('{name}');
    expect(fs.extractRelationshipStructure(personType)).toEqual({});
  });

  it('should extract a simple relationship structure', function () {
    var fs = new evaluator.FormatString('{company.name}');
    expect(fs.extractRelationshipStructure(personType)).toEqual({
      company: {}
    });
  });

  it('should extract another relationship structure', function () {
    var fs = new evaluator.FormatString('{company.category}');
    expect(fs.extractRelationshipStructure(personType)).toEqual({
      company: { category: {} }
    });
  });

  it('should recursively extract a relationship structure', function () {
    var fs = new evaluator.FormatString('{company}');
    expect(fs.extractRelationshipStructure(personType)).toEqual({
      company: { category: {} }
    });
  });

  it('should not repeat', function () {
    var fs = new evaluator.FormatString('{company} {company.category} {company.category.name}');
    expect(fs.extractRelationshipStructure(personType)).toEqual({
      company: { category: {} }
    });
  });

  it('should handle repeats', function () {
    companyType.displayFormat = new evaluator.FormatString('{name}');
    var fs = new evaluator.FormatString('{company.category.name} {company.category} {company}');
    expect(fs.extractRelationshipStructure(personType)).toEqual({
      company: { category: {} }
    });
  });

  it('should handle more repeats', function () {
    companyType.displayFormat = new evaluator.FormatString('{name}');
    var fs = new evaluator.FormatString('{company.category.name} {company.category} {company.name}');
    expect(fs.extractRelationshipStructure(personType)).toEqual({
      company: { category: {} }
    });
  });

  it('should handle bad input', function () {
    var fs = new evaluator.FormatString('{something.else} {company.what.is.this}');
    expect(fs.extractRelationshipStructure(personType)).toEqual({
      company: {}
    });
  });

  it('should merge results', function () {
    companyType.displayFormat = new evaluator.FormatString('{name}');
    var fs = new evaluator.FormatString('{company.category.name} {company.category} {company}');
    expect(
      fs.extractRelationshipStructure(personType, undefined, {
        company: { test: {} }
      })
    ).toEqual({ company: { test: {}, category: {} } });
  });

  it('should handle recursive display names', function () {
    var theSchema = new schema.Schema();

    function xml(text) {
      return parse(text).documentElement;
    }

    var element = xml(
      '<object name="asset" label="Asset">' +
        '<attribute name="serial_number" label="Serial Number" type="string" />' +
        '<belongs_to name="asset" type="asset"/>' +
        '<display format="Asset: {asset}" />' +
        '</object>'
    );

    var parser = schema.parser2(theSchema);
    var assetType = parser.parseObjectType(element);
    theSchema.objects[assetType.name] = assetType;
    parser.parseBelongsTo(assetType, element);
    parser.parseDisplay(assetType, element);
    expect(parser.getErrors()).toEqual([]);

    // It is not important what exactly the structure is, as long as it doesn't throw an error
    var structure = assetType.displayFormat.extractRelationshipStructure(assetType);
    expect(typeof structure).toBe('object');
  });

  it('should deepMerge', function () {
    var deepMerge = evaluator._deepMerge;
    expect(deepMerge({ a: {} }, { b: {} })).toEqual({ a: {}, b: {} });
    expect(deepMerge({ a: { b: { c: {} } }, d: {} }, { a: { e: {} } })).toEqual({ a: { b: { c: {} }, e: {} }, d: {} });
  });
});
