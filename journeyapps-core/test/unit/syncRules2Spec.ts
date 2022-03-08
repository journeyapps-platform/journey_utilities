import * as schema from '@journeyapps/parser-schema';
import { Version } from '@journeyapps/parser-common';
import '@journeyapps/core-xml/domparser';

const schema3Xml = require('../fixtures/schema3.xml').default;
const syncRulesXml = require('../fixtures/sync_rules2.xml').default;

import { Parser } from '../../src/app/syncRulesParser';
import { Serializer } from '../../src/app/syncRules2Parser';

var v4 = new Version('4.0');

declare function expect(
  cond
): jasmine.Matchers<any> & {
  toHave(v);
  toHaveError(v);
  toHaveErrors(v: any[]);
};

describe('sync rule 2 xml parsing', function () {
  var testSchema;
  var parser;

  beforeAll(() => {
    testSchema = new schema.Schema().loadXml(schema3Xml, { apiVersion: v4 });
  });

  beforeEach(() => {
    parser = new Parser(testSchema, 'worker');
  });

  it('should parse the full sync rules and convert to text', function () {
    var syncRules = parser.parse(syncRulesXml);
    expect(syncRules.errors).toEqual([]);

    let text = new Serializer(syncRules).toText();
    expect(text).toEqual(`<?xml version="1.0" encoding="UTF-8"?>
<sync version="2">
    <bucket via="assets">
        <has-many name="parts"/>
    </bucket>
    <bucket via="self[branch != null]/assets">
        <has-many name="parts" condition="archived == false"/>
    </bucket>
    <bucket via="branch"/>
    <global-bucket>
        <model name="category"/>
        <model name="responsible_personnel" condition="name != null"/>
    </global-bucket>
</sync>`);
  });

  it('should error if not version 2', function () {
    var syncRules = parser.parse("<sync version='3'></sync>");
    expect(syncRules.errors).toHaveError({
      message: 'version must be "1" or "2"',
      type: 'error'
    });
  });

  it('should warn if there are invalid children', function () {
    var syncRules = parser.parse("<sync version='2'>\n<invalid-child />\n</sync>");
    expect(syncRules.errors).toHaveError({
      message: "Invalid element 'invalid-child'",
      type: 'warning',
      start: { line: 1, column: 1 },
      end: { line: 1, column: 14 }
    });
  });

  it('should error if bucket does not contain via', function () {
    var syncRules = parser.parse("<sync version='2'>\n<bucket />\n</sync>");
    expect(syncRules.errors).toHaveError({
      message: 'via is required',
      type: 'error',
      start: { line: 1, column: 1 },
      end: { line: 1, column: 7 }
    });
  });

  it('should error on invalid via name', function () {
    var syncRules = parser.parse("<sync version='2'>\n<bucket via='notthis' />\n</sync>");
    expect(syncRules.errors).toHaveError({
      message: "'notthis' is not defined",
      type: 'error',
      start: { line: 1, column: 13 },
      end: { line: 1, column: 20 }
    });
  });

  it('should error on invalid via condition field', function () {
    var syncRules = parser.parse(`<sync version='2'>\n<bucket via="assets[notthis != null]" />\n</sync>`);
    expect(syncRules.errors).toHaveError({
      message: "'notthis' is not defined",
      type: 'error',
      start: { line: 1, column: 13 },
      end: { line: 1, column: 36 }
    });
  });

  it('should error on invalid via condition format', function () {
    var syncRules = parser.parse(`<sync version='2'>\n<bucket via="assets[notthis]" />\n</sync>`);
    expect(syncRules.errors).toHaveError({
      message: 'Invalid condition: notthis',
      type: 'error',
      start: { line: 1, column: 13 },
      end: { line: 1, column: 28 }
    });
  });

  it('should error on invalid via condition operator', function () {
    var syncRules = parser.parse(`<sync version='2'>\n<bucket via="assets[make === null]" />\n</sync>`);
    expect(syncRules.errors).toHaveError({
      message: "Invalid operator: '==='",
      type: 'error',
      start: { line: 1, column: 13 },
      end: { line: 1, column: 34 }
    });
  });

  it('should error on invalid secondary via', function () {
    var syncRules = parser.parse("<sync version='2'>\n<bucket via='assets/notthis' />\n</sync>");
    expect(syncRules.errors).toHaveError({
      message: "'notthis' is not defined",
      type: 'error',
      start: { line: 1, column: 13 },
      end: { line: 1, column: 27 }
    });
  });

  it('should error on invalid bucket child', function () {
    var syncRules = parser.parse(`<sync version='2'>
            <bucket via='assets'>
                <has-many name="notthis" />
            </bucket>
        </sync>`);
    expect(syncRules.errors).toHaveError({
      message: "'notthis' is not defined",
      type: 'error',
      start: { line: 2, column: 32 },
      end: { line: 2, column: 39 }
    });
  });

  it('should error on invalid global-bucket via', function () {
    var syncRules = parser.parse("<sync version='2'>\n<global-bucket via='notthis' />\n</sync>");
    expect(syncRules.errors).toHaveError({
      message: "'notthis' is not defined",
      type: 'error',
      start: { line: 1, column: 20 },
      end: { line: 1, column: 27 }
    });
  });

  it('should error on invalid global-bucket child', function () {
    var syncRules = parser.parse(`<sync version='2'>
            <global-bucket>
                <model name="notthis" />
            </global-bucket>
        </sync>`);
    expect(syncRules.errors).toHaveError({
      message: "'notthis' is not defined",
      type: 'error',
      start: { line: 2, column: 29 },
      end: { line: 2, column: 36 }
    });
  });
});
