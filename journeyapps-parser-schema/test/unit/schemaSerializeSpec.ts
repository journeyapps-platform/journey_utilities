import { prettyText, parse } from '@journeyapps/core-xml';
import { Variable, toDOM, Schema } from '../../src';
import { FormatString } from '@journeyapps/evaluator';
import { Version } from '@journeyapps/parser-common';

const schema3_xml = require('../fixtures/schema3.xml').default;
const expectedOutput = require('../fixtures/schema_modified.xml').default;

describe('Schema toDOM', function () {
  it('should output a modified schema', function () {
    const schema = new Schema();
    schema.loadXml(schema3_xml, {
      apiVersion: new Version('4.0'),
      recordSource: true
    });

    const originalDoc = parse(schema3_xml);
    const originalPretty = prettyText(originalDoc);
    const outputText = prettyText(toDOM(schema));

    // Unchanged input should give unchanged output.
    expect(outputText).toEqual(originalPretty);

    // START MODIFICATIONS

    // Add fields
    schema.objects.building.addAttribute(new Variable('floors', schema.primitive('number')));
    schema.objects.building.addAttribute(new Variable('height', schema.primitive('number')));
    schema.objects.building.attributes.height.label = 'Height';

    // Delete model
    delete schema.objects.branch;

    // Change label
    schema.objects.worker.attributes.name.label = 'Full Name';

    // Change display
    schema.objects.building.displayFormat = new FormatString('Updated');

    // Delete field
    delete schema.objects.room.attributes.name;

    // END MODIFICATIONS

    const modifiedText = prettyText(toDOM(schema));
    expect(modifiedText).toEqual(expectedOutput);
  });
});
