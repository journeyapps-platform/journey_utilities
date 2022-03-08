import { view as _view } from '../../src/app/index';
import * as schema from '@journeyapps/parser-schema';
import { QueryType } from '@journeyapps/parser-schema';
import { Version } from '@journeyapps/parser-common';
import '@journeyapps/core-xml/domparser';
import * as xml from '@journeyapps/core-xml';
import * as evaluator from '@journeyapps/evaluator';

const schemaXml = require('../fixtures/schema2.xml').default;
const schema3Xml = require('../fixtures/schema3.xml').default;

declare function expect(cond): jasmine.Matchers<any> & {
  toHave(v);
  toHaveError(v);
  toHaveErrors(v: any[]);
};

function loadSchemaVersion(version) {
  var tschema = new schema.Schema().loadXml(version.v3 ? schema3Xml : schemaXml, { apiVersion: version });
  if (tschema.errors.length > 0) {
    throw new Error('Schema contains errors: ' + tschema.errors[0].message);
  }
  return tschema;
}

function parseVersion(version, schema, text, js) {
  var view = new _view.View('test', schema).parse(
    {
      xml: text,
      js: js
    },
    { apiVersion: version }
  );
  return view;
}

function loadSchema3() {
  return loadSchemaVersion(new Version('3.1'));
}

var useDomParsers = [true];

useDomParsers.forEach(function (useDomParser) {
  describe('view parsing ' + (useDomParser ? '(domparser)' : '(native)'), function () {
    var version;
    var sometype, view, parser, schema, multipletype;

    beforeEach(function () {
      this.skipErrorPositions = !useDomParser;
    });

    // These cases are the same in all versions
    function parse(text, js?) {
      return parseVersion(version, loadSchema(), text, js);
    }

    function parsed(text) {
      var element = xml.parse(text).documentElement;
      parser = _view.parser(view, { version: version });
      return parser.parseComponent(element);
    }

    function parsedWithValidationRecording(text) {
      var element = xml.parse(text).documentElement;
      parser = _view.parser(view, {
        version: version,
        recordReferences: true
      });
      return parser.parseComponent(element);
    }

    function loadSchema() {
      return loadSchemaVersion(version);
    }

    function init(ver) {
      version = ver;
      schema = loadSchemaVersion(version);
      view = new _view.View('test', schema);

      view.type.addAttribute(schema.variable('somevar', 'text'));
      view.type.addAttribute(schema.variable('abool', 'boolean'));
      view.type.addAttribute(schema.variable('anint', 'integer'));
      view.type.addAttribute(schema.variable('photo', 'attachment'));
      view.type.addAttribute(schema.variable('multiple', 'multiple-choice'));
      view.type.addAttribute(schema.variable('multiply', 'multiple-choice-integer'));
      sometype = view.type.attributes.somevar.type;
      multipletype = view.type.attributes.multiple.type;
    }

    ['2.5', '3.1'].forEach(function (versionStr) {
      describe('View parsing in ' + versionStr, function () {
        beforeEach(function () {
          init(new Version(versionStr));
        });

        it('should parse a basic view', function () {
          var view = parse('<view title="Test"></view>');
          expect(view.errors).toEqual([]);
          expect(view.title.expression).toEqual('Test');
          expect(view.onBack).toBe(null);
          expect(view.onNavigate).toBe(null);
        });

        it('should parse a view with on-back', function () {
          var view = parse('<view title="Test" on-back="dismiss()"></view>');
          expect(view.errors).toEqual([]);
          expect(view.onBack).toBe('dismiss()');
        });

        it('should parse a view with on-navigate', function () {
          var view = parse('<view title="Test" on-navigate="$:foobar()"></view>');
          expect(view.errors).toEqual([]);
          expect(view.onNavigate).toBe('$:foobar()');
        });

        it('should parse a basic view with basic JavaScript', function () {
          var view = parse('<view title="Test"></view>', 'function init() { }');
          expect(view.errors).toEqual([]);
          expect(view.title.expression).toEqual('Test');
          expect(view.code).toEqual('function init() { }');
        });

        it('should parse links', function () {
          var view;
          if (version.v3) {
            view = parse(
              '<view title="Test">\n<var name="first" type="text" />\n<link path="test" name="test_link" />\n<link path="test2" name="test_link2" type="dismiss"><arg bind="first" /></link></view>'
            );
          } else {
            view = parse(
              '<view title="Test">\n<var name="first" type="string" />\n<link path="test" name="test_link" />\n<link path="test2" name="test_link2" type="dismiss"><arg bind="first" /></link></view>'
            );
          }

          expect(view.errors).toEqual([]);

          var link1 = view.links.test_link;
          expect(link1.name).toBe('test_link');
          expect(link1.path).toBe('test');
          expect(link1.type).toBe('normal');

          var link2 = view.links.test_link2;
          expect(link2.name).toBe('test_link2');
          expect(link2.path).toBe('test2');
          expect(link2.type).toBe('dismiss');
          expect(link2.args).toEqual(['first']);
        });

        it('should parse a sidebar', function () {
          var view = parse(
            '<view title="Test">\n<sidebar><item icon="test.png">Item 1</item><item state="disabled">Item 2</item></sidebar></view>'
          );
          expect(view.errors).toEqual([]);

          var items = view.sidebar.sidebarItems;
          expect(items.length).toEqual(2);
          expect(items[0].label).toEqual(evaluator.formatString('Item 1'));
          expect(items[0].icon).toEqual(evaluator.formatString('test.png'));
          expect(items[1].label).toEqual(evaluator.formatString('Item 2'));
          expect(items[1].state).toBe('disabled');

          expect(view.components.length).toBe(0);
        });

        it('should parse a sidebar with dynamic items', function () {
          var view = parse('<view title="Test">\n<sidebar items="$:getItems()"></sidebar></view>');
          expect(view.errors).toEqual([]);

          var staticItems = view.sidebar.sidebarItems;
          var dynamicItems = view.sidebar.generateItems;
          expect(staticItems.length).toEqual(0);
          expect(dynamicItems).toEqual('$:getItems()');
          expect(view.components.length).toBe(0);
        });

        it('should not allow static items if dynamic items are present', function () {
          var view = parse(
            '<view title="Test">\n<sidebar items="$:getItems()"><item icon="test.png">Item 1</item></sidebar></view>'
          );
          expect(view.errors).toHaveError({
            message: "The sidebar cannot have children if its 'items' attribute is set",
            type: 'error'
          });

          expect(view.components.length).toBe(0);
        });
      });
    });

    describe('v2 view parsing', function () {
      beforeEach(function () {
        init(new Version('2.5'));
      });

      it('should parse view variables', function () {
        var view = parse(
          '<view title="Test">\n<param name="pr" type="int" />\n<var name="first" type="string" />\n<var name="colour" type="enum"><option>Red</option><option>Yellow</option></var>\n</view>'
        );
        expect(view.errors).toEqual([]);

        expect(view.parameters.length).toBe(1);
        var param = view.parameters[0];
        expect(param.name).toBe('pr');
        expect(param.type.name).toBe('integer');

        expect(view.type.attributes.pr.type.name).toBe('integer');
        expect(view.type.attributes.first.type.name).toBe('text');
        expect(view.type.attributes.colour.type.name).toBe('single-choice-integer');

        var options = view.type.attributes.colour.type.options;
        expect(Object.keys(options).length).toBe(2);
        expect(options[0].label).toBe('Red');
        expect(options[1].label).toBe('Yellow');
      });

      it('should parse an object variable', function () {
        var view = parse('<view title="Test">\n<var name="object" type="asset" />\n</view>');
        expect(view.errors).toEqual([]);
        var object = view.type.attributes.object;

        expect(object.type.name).toBe('asset');
      });

      it('should parse a query variable', function () {
        var view = parse('<view title="Test">\n<var name="query" type="asset" array="true" />\n</view>');
        expect(view.errors).toEqual([]);
        const query = view.type.getAttribute<QueryType>('query');
        expect(query.type.name).toBe('query');
        expect(query.type.objectType.name).toBe('asset');
      });

      it('should record a binding with a parent (non-primitive parent, non-primitive child)', function () {
        var current = schema.variable('current', 'asset');
        view.type.addAttribute(current);

        var result = parsedWithValidationRecording('<text-input bind="current.room"/>');

        var recordingsPair = parser.fieldReferences[0];
        expect(recordingsPair[0].name).toEqual('current');
        expect(recordingsPair[0].isPrimitiveType).toEqual(false);

        expect(recordingsPair[1].name).toEqual('room');
        expect(recordingsPair[1].isPrimitiveType).toEqual(false);
      });

      it('should parse internal html fields', function () {
        expect(parsed('<html src="html/test.html"/>')).toHave({
          type: 'html',
          label: null,
          src: evaluator.formatString('html/test.html')
        });
      });

      it('should parse html fields', function () {
        expect(parsed('<html src="http://embark.mobi"/>')).toHave({
          type: 'html',
          label: null,
          src: evaluator.formatString('http://embark.mobi')
        });
      });

      it('should validate variable types', function () {
        var view = parse('<view title="Test">\n\n<var name="first" type="notvalid" />\n</view>');
        expect(view.errors).toHaveError({
          message: "Invalid type 'notvalid'",
          type: 'error'
        });

        // It is generally better if we consider the variable not defined at all if we cannot resolve the type
        // This simplifies other code using these variables.
        expect(view.type.attributes.first).toBe(undefined);
      });

      it('should validate query variable types', function () {
        var view = parse('<view title="Test">\n\n<var name="first" type="notvalid" array="true" />\n</view>');
        expect(view.errors).toHaveError({
          message: "Invalid type 'notvalid'",
          type: 'error'
        });
      });

      it('should not a allow a label on a variable', function () {
        var view = parse('<view title="Test">\n<var name="first" type="string" label="Test" />\n</view>');
        expect(view.errors).toHaveError({
          message: "Invalid attribute 'label'",
          type: 'warning',
          start: { line: 1, column: 32 }
        });
      });

      it('should not allow duplicate variables', function () {
        var view = parse(
          '<view title="Test">\n<var name="first" type="string"/>\n<var name="first" type="string"/>\n</view>'
        );
        expect(view.errors).toHaveError({
          message: "Variable 'first' is already defined",
          type: 'error',
          start: { line: 2, column: 11 }
        });
      });

      it('should require a variable name', function () {
        var view = parse('<view title="Test">\n<var type="string"/></view>');
        expect(view.errors).toHaveError({
          message: 'name is required',
          type: 'error'
        });
      });

      it('should require a variable type', function () {
        var view = parse('<view title="Test">\n<var name="test"/></view>');
        expect(view.errors).toHaveError({
          message: 'type is required',
          type: 'error'
        });
      });

      it('should throw one error on a blank variable type', function () {
        var view = parse('<view title="Test">\n<var name="test" type=""/></view>');
        expect(view.errors).toHaveError({
          message: 'type cannot be blank',
          type: 'error'
        });
      });

      it('should error on duplicate links', function () {
        var view = parse(
          '<view title="Test">\n<link path="test1" name="test_link" />\n<link path="test2" name="test_link" />\n</view>'
        );
        expect(view.errors).toHaveError({
          message: "Link 'test_link' is already defined",
          type: 'error'
        });

        var link1 = view.links.test_link;
        expect(link1.name).toBe('test_link');
        expect(link1.path).toBe('test1');
        expect(link1.type).toBe('normal');
      });

      it('should error on invalid link names', function () {
        var view = parse('<view title="Test">\n<link name="test link!" path="test" />\n</view>');
        expect(view.errors).toHaveError({
          message: 'Not a valid name',
          type: 'error',
          start: { line: 1, column: 12 }
        });
      });

      it('should warn on invalid link children', function () {
        var view = parse('<view title="Test">\n<link name="test_link" path="test"><something/>else</link>\n</view>');
        expect(view.errors).toHaveErrors([
          { message: "Invalid element 'something'", type: 'warning' },
          {
            message: 'Text is not allowed inside this element',
            type: 'warning'
          }
        ]);
      });
    });

    describe('v3 view parsing', function () {
      beforeEach(function () {
        init(new Version('3.1'));
      });

      function parsed(text) {
        var element = xml.parse(text).documentElement;
        parser = _view.parser(view, { version: version });
        return parser.parseComponent(element);
      }

      function parseSection(text) {
        // fake-root since it doesn't really matter, we're only interested parsing the individual children
        var element = xml.parse(`<fake-root>${text}</fake-root>`).documentElement;
        parser = _view.parser(view, { version: version });
        return xml.children(element).map((child) => {
          return parser.parseComponent(child);
        });
      }

      it('should parse a v3 query variable', function () {
        var view = parse('<view title="Test">\n<var name="query" type="query:asset" />\n</view>');
        expect(view.errors).toEqual([]);
        const query = view.type.getAttribute<QueryType>('query');

        expect(query.type.name).toBe('query');
        expect(query.type.objectType.name).toBe('asset');
      });

      // Components
      it('should parse html components with an id', function () {
        expect(parsed('<html id="my-id" src="http://embark.mobi"/>')).toHave({
          type: 'html',
          label: null,
          id: 'my-id',
          src: evaluator.formatString('http://embark.mobi')
        });
      });

      it('should parse multiple html components with a different ids', function () {
        const IDs = ['1', '2', '3', '4', '5'];
        let section = IDs.map((id) => `<html id="${id}" />`).join('');
        let result = parseSection(section);
        IDs.forEach((id, index) => {
          expect(result[index]).toHave({
            type: 'html',
            label: null,
            id: id
          });
        });
        expect(parser.getErrors()).toEqual([]);
      });

      it('should throw an error when multiple html components have the same id', function () {
        parseSection('<html id="my-id" /><html id="my-id" />');
        expect(parser.getErrors()).toHaveError({
          message: 'HTML component IDs must be unique',
          type: 'error'
        });
      });

      it('should throw an error when at least one html component has an id and the others do not', function () {
        parseSection('<html id="my-id" /><html />');
        expect(parser.getErrors()).toHaveError({
          message: 'If some HTML component has an ID, every HTML component must have an ID',
          type: 'error'
        });
      });

      it('should throw an error when at least one html component has an id and the others do not (other way around)', function () {
        parseSection('<html /><html id="my-id" />');
        expect(parser.getErrors()).toHaveError({
          message: 'If some HTML component has an ID, every HTML component must have an ID',
          type: 'error'
        });
      });

      it('should warn on an invalid component', function () {
        var view = parse('<view title="Test">\n<foo />\n</view>');
        expect(view.errors).toHaveError({
          message: "Invalid element 'foo'",
          type: 'warning'
        });
      });

      it('should warn on an invalid column children', function () {
        var view = parse('<view title="Test">\n<columns><column><foo /></column></columns>\n</view>');
        expect(view.errors).toHaveError({
          message: "Invalid element 'foo'",
          type: 'warning'
        });

        var view2 = parse('<view title="Test">\n<columns><notacolumn /></columns>\n</view>');
        expect(view2.errors).toHaveError({
          message: "Invalid element 'notacolumn'",
          type: 'warning'
        });
      });

      it('should infer links from JavaScript', function () {
        var js =
          'function goToOrders() { \n link.orders(); \n } \n function goToNewUser() { \n link.user.new(); \n function editOrderException() { \n link.order.exception.edit(); \n}';
        var view = parse('<view title="Test"></view>', js);
        expect(view.errors).toEqual([]);

        expect(view.getInferredLinks()).toEqual({
          orders: {
            type: 'normal',
            path: 'orders',
            inferred: true
          },
          'user/new': {
            type: 'normal',
            path: 'user/new',
            inferred: true
          },
          'order/exception/edit': {
            type: 'normal',
            path: 'order/exception/edit',
            inferred: true
          }
        });
      });

      it('should not infer commented out links from JavaScript', function () {
        // "first" and "third" are commented out, "second" should be included
        var js = 'function navigate() { \n //link.first(); \n link.second(); \n// link.third(); \n }';
        var view = parse('<view title="Test"></view>', js);
        expect(view.errors).toEqual([]);

        expect(view.getInferredLinks()).toEqual({
          second: {
            type: 'normal',
            path: 'second',
            inferred: true
          }
        });
      });
    });
  });
});

describe('view json', function () {
  it('should convert a view to json', function () {
    var schema = loadSchema3();
    var view = new _view.View('test', schema);
    view.type.addAttribute(schema.variable('somevar', 'text'));
    view.type.addAttribute(schema.variable('nr', 'integer'));
    view.type.addAttribute(schema.queryVariable('assets', 'asset'));
    view.type.addAttribute(schema.variable('someAsset', 'asset'));
    view.parameters.push(view.type.attributes.nr);
    view.addLink({
      name: 'link1',
      path: 'some/path',
      type: 'normal',
      ondismiss: null,
      args: ['somevar']
    });

    expect(view.toJSON()).toEqual({
      onBack: null,
      onNavigate: null,
      variables: {
        somevar: {
          name: 'somevar',
          type: 'text'
        },
        nr: {
          name: 'nr',
          type: 'integer'
        },
        assets: {
          name: 'assets',
          type: 'query',
          object: 'asset'
        },
        someAsset: {
          name: 'someAsset',
          type: 'asset'
        }
      },
      parameters: ['nr'],
      links: {
        link1: {
          name: 'link1',
          path: 'some/path',
          type: 'normal',
          ondismiss: null,
          args: ['somevar']
        }
      }
    });
  });

  it('should parse a view from json', function () {
    var json = {
      variables: {
        somevar: {
          type: 'text'
        },
        nr: {
          type: 'integer'
        },
        assets: {
          type: 'query',
          object: 'asset'
        },
        asset: {
          type: 'asset'
        }
      },
      parameters: ['nr', 'asset'],
      links: {
        link1: {
          name: 'link1',
          path: 'some/path',
          type: 'normal',
          ondismiss: null,
          args: ['somevar']
        }
      }
    };

    var schema = loadSchema3();
    var view = new _view.View('test', schema);

    var parser = _view.jsonParser(view);
    parser.parse(json);

    expect(Object.keys(view.type.attributes)).toEqual(['somevar', 'nr', 'assets', 'asset']);
    expect(view.type.attributes.somevar.type.name).toBe('text');
    expect(view.type.attributes.assets.type.name).toBe('query');
    expect(view.type.getAttribute<QueryType>('assets').type.objectType.name).toBe('asset');
    // expect(view.type.attributes.assets.type.objectType.name).toBe('asset');
    expect(view.type.attributes.asset.type.name).toBe('asset');

    expect(view.parameters).toEqual([view.type.attributes.nr, view.type.attributes.asset]);

    expect(Object.keys(view.links)).toEqual(['link1']);
    expect(Object.keys(view.link_functions)).toEqual(['link1']);
    expect(view.links.link1).toEqual({
      name: 'link1',
      path: 'some/path',
      type: 'normal',
      ondismiss: null,
      args: ['somevar']
    });
  });
});

describe('strip code comments', function () {
  it('should strip simple comments from code', function () {
    var originalCode =
      'function one() {\n var x = 1;\n }\n \n //function two() {\n //      var y = 2;\n //}  \n \n function three() {\n var z = 3;\n }';
    var expectedCleanCode = 'function one() {\n var x = 1;\n }\n \n \n function three() {\n var z = 3;\n }';
    var cleanCode = _view.stripCodeComments(originalCode);
    expect(cleanCode).toBe(expectedCleanCode);
  });
});
