import * as schema from '@journeyapps/parser-schema';
import { Version } from '@journeyapps/parser-common';
import '@journeyapps/core-xml/domparser';
const schema3Xml = require('../fixtures/schema3.xml').default;
const syncRulesXml = require('../fixtures/sync_rules.xml').default;
import { Parser } from '../../src/app/syncRulesParser';
import { Serializer } from '../../src/app/syncRules2Parser';
import * as xml from '@journeyapps/core-xml';

declare function expect(
  cond
): jasmine.Matchers<any> & {
  toHave(v);
  toHaveError(v);
  toHaveErrors(v: any[]);
};

var v3 = new Version('3.1');
describe('sync rule xml parsing', function () {
  var testSchema;

  beforeAll(function () {
    testSchema = new schema.Schema().loadXml(schema3Xml, { apiVersion: v3 });
  });

  it('should parse the full sync rules, and migrate', function () {
    var parser = new Parser(testSchema);
    var syncRules = parser.parse(syncRulesXml);
    expect(syncRules.errors).toEqual([]);

    let text = new Serializer(syncRules).toText();
    expect(text).toEqual(`<?xml version="1.0" encoding="UTF-8"?>
<sync version="2">
    <bucket via="self"/>
    <bucket via="self/assets[condition lte 5]">
        <has-many name="parts"/>
    </bucket>
    <bucket via="self/branch"/>
    <bucket via="self[branch != null]"/>
    <global-bucket>
        <model name="category"/>
        <model name="responsible_personnel" condition="archived != true"/>
    </global-bucket>
    <global-bucket via="self[branch != null]">
        <model name="category"/>
    </global-bucket>
</sync>`);
  });

  it('should migrate empty sync rules', function () {
    var parser = new Parser(testSchema);
    var syncRules = parser.parse(`
            <?xml version="1.0" encoding="UTF-8"?>
            <sync></sync>
        `);
    expect(syncRules.errors).toEqual([]);
    let text = new Serializer(syncRules).toText();
    expect(text).toEqual(`<?xml version="1.0" encoding="UTF-8"?>
<sync version="2">
    <global-bucket>
        <all-models/>
    </global-bucket>
</sync>`);
  });

  it('should error if the root is invalid', function () {
    var parser = new Parser(testSchema);
    var syncRules = parser.parse('<not-sync></not-sync>');
    expect(syncRules.errors).toHaveError({
      message: '<sync> root tag expected',
      type: 'error',
      start: { line: 0, column: 1 },
      end: { line: 0, column: 9 }
    });
  });

  it('should warn if there are invalid children', function () {
    var parser = new Parser(testSchema);
    var syncRules = parser.parse('<sync>\n<invalid-child />\n</sync>');
    expect(syncRules.errors).toHaveError({
      message: "Invalid element 'invalid-child'",
      type: 'warning',
      start: { line: 1, column: 1 },
      end: { line: 1, column: 14 }
    });
  });

  it('should warn if user does not contain type', function () {
    var parser = new Parser(testSchema);
    var syncRules = parser.parse('<sync>\n<user />\n</sync>');
    expect(syncRules.errors).toHaveError({
      message: 'type is required',
      type: 'error',
      start: { line: 1, column: 1 },
      end: { line: 1, column: 5 }
    });
  });

  it('should error if user type is invalid', function () {
    var parser = new Parser(testSchema);
    var syncRules = parser.parse("<sync>\n<user type='foobar' />\n</sync>");
    expect(syncRules.errors).toHaveError({
      message: "'foobar' is not defined",
      type: 'error',
      start: { line: 1, column: 12 },
      end: { line: 1, column: 18 }
    });
  });

  it('should error if has_many rel is invalid', function () {
    var parser = new Parser(testSchema);
    var syncRules = parser.parse("<sync>\n<user type='worker'>\n<relationship has_many='foobar' /></user></sync>");
    expect(syncRules.errors).toHaveError({
      message: "'foobar' is not defined",
      type: 'error',
      start: { line: 2, column: 24 },
      end: { line: 2, column: 30 }
    });
  });

  it('should error if belongs_to rel is invalid', function () {
    var parser = new Parser(testSchema);
    var syncRules = parser.parse("<sync>\n<user type='worker'>\n<relationship belongs_to='foobar' /></user></sync>");
    expect(syncRules.errors).toHaveError({
      message: "'foobar' is not defined",
      type: 'error',
      start: { line: 2, column: 26 },
      end: { line: 2, column: 32 }
    });
  });

  it('should error if nested has_many rel is invalid', function () {
    var parser = new Parser(testSchema);
    var syncRules = parser.parse(
      "<sync>\n<user type='worker'>\n<relationship has_many='assets'>\n<relationship has_many='foobar' /></relationship></user></sync>"
    );
    expect(syncRules.errors).toHaveError({
      message: "'foobar' is not defined",
      type: 'error',
      start: { line: 3, column: 24 },
      end: { line: 3, column: 30 }
    });
  });
});
