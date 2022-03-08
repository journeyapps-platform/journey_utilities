import { Schema, parser2, parser3, jsonParser, parseJsonField, primitives } from '../../src/index';
import { Version } from '@journeyapps/parser-common';
import * as blackmontapp_xml from '@journeyapps/core-xml';
import '@journeyapps/core-xml/domparser';

const schema2_xml = require('../fixtures/schema2.xml').default;
const schema3_xml = require('../fixtures/schema3.xml').default;
const schema3BadgeCountXml = require('../fixtures/schema3-badge-count.xml').default;
const v3 = new Version('3.1');
const v2 = new Version('2.0');

declare function expect(
  cond
): jasmine.Matchers<any> & {
  toHave(v);
  toHaveError(v);
  toHaveErrors(v: any[]);
};

describe('json parsing', function () {
  it('should parse an object', function () {
    var s = new Schema();
    var parser = jsonParser(s);
    parser.parse({
      objects: {
        asset: {
          label: 'Asset',
          display: 'something',
          attributes: {
            serial: {
              type: 'text',
              label: 'Serial Number',
              spec: 'number'
            },
            colours: {
              type: 'single-choice-integer',
              label: 'Colours',
              options: [
                { value: 0, label: 'Red', index: 1 },
                { value: 3, label: 'Green', index: 0 }
              ]
            }
          },
          belongsTo: {
            container: {
              type: 'room',
              foreignName: 'assets'
            }
          }
        },
        room: {
          label: 'Room',
          display: 'Something',
          attributes: {},
          belongsTo: {}
        }
      }
    });

    var asset = s.objects.asset;
    var room = s.objects.room;

    expect(asset.label).toBe('Asset');
    expect(asset.attributes.serial.type.spec).toBe('number');
    expect(asset.attributes.colours.type.options[3].label).toBe('Green');
    expect(asset.attributes.colours.type.options[0].index).toBe(1);
    expect(asset.attributes.colours.type.options[3].index).toBe(0);

    var rel = asset.belongsTo.container;
    expect(rel.objectType).toBe(asset);
    expect(rel.foreignType).toBe(room);
    expect(rel.foreignName).toEqual('assets');
    expect(rel.type).toEqual('one-to-many');

    expect(room.hasMany.assets).toBe(rel);
  });

  it('should parse a field', function () {
    var field = parseJsonField({
      name: 'serial_number',
      type: 'text',
      label: 'Serial Number',
      spec: 'number',
      subType: 'signed-number'
    });

    expect(field.name).toBe('serial_number');
    expect(field.type.name).toBe('text');
    expect(field.type.spec).toBe('number');
    expect(field.type.subType).toBe('signed-number');

    // TODO: test options
  });

  it('should parse a date field', function () {
    let field = parseJsonField({
      name: 'day',
      type: 'date'
    });

    expect(field.name).toBe('day');
    expect(field.type.name).toBe('date');
    expect(field.type.isDay).toBe(false);

    expect(field.toJSON()).toEqual({ name: 'day', type: 'date' });
  });

  it('should parse a date field (isDay: true)', function () {
    let field = parseJsonField({
      name: 'day',
      type: 'date',
      isDay: true
    });

    expect(field.name).toBe('day');
    expect(field.type.name).toBe('date');
    expect(field.type.isDay).toBe(true);
    expect(field.toJSON()).toEqual({ name: 'day', type: 'date', isDay: true });
  });

  it('should parse a date field (isDay: false)', function () {
    let field = parseJsonField({
      name: 'day',
      type: 'date',
      isDay: false
    });

    expect(field.name).toBe('day');
    expect(field.type.name).toBe('date');
    expect(field.type.isDay).toBe(false);
    expect(field.toJSON()).toEqual({ name: 'day', type: 'date' });
  });
});

var useDomParsers = [true];

useDomParsers.forEach(function (useDomParser) {
  describe('xml schema parsing ' + (useDomParser ? '(domparser)' : '(native)'), function () {
    beforeEach(function () {
      this.skipErrorPositions = !useDomParser;
    });

    function xml(text) {
      return blackmontapp_xml.parse(text).documentElement;
    }

    it('should load a v2 string attribute', function () {
      var attr = parser2(new Schema()).parseField(
        xml('<attribute name="serial_number" label="Serial Number" type="string" spec="text.name"/>')
      );
      expect(attr.name).toBe('serial_number');
      expect(attr.label).toBe('Serial Number');
      expect(attr.type.name).toEqual('text');
      expect(attr.type.spec).toEqual('text.name');
    });

    it('should load a v3 string attribute', function () {
      var attr = parser3(new Schema()).parseField(
        xml('<field name="serial_number" label="Serial Number" type="text:name" />')
      );
      expect(attr.name).toBe('serial_number');
      expect(attr.label).toBe('Serial Number');
      expect(attr.type.name).toEqual('text');
      expect(attr.type.spec).toEqual('text.name');
      expect(attr.type.subType).toEqual('name');
    });

    it('should load an enum attribute', function () {
      var attr = parser2(new Schema()).parseField(
        xml(
          '<attribute name="colours" label="Colours" type="enum">' +
            '<option>Red</option>' +
            '<option>Green</option>' +
            '<option>Blue</option>' +
            '<option>Black</option>' +
            '<option>Yellow</option>' +
            '<option>Purple</option>' +
            '<option>Brown</option>' +
            '<option>Pink</option>' +
            '<option>Grey</option>' +
            '<option>White</option>' +
            '<option>Magenta</option>' +
            '</attribute>'
        )
      );
      expect(attr.type.name).toEqual('single-choice-integer');
      expect(attr.type.hasOptions).toBe(true);
      expect(attr.type.multipleOptions).toBe(false);
      expect(Object.keys(attr.type.options).length).toEqual(11);
      expect(attr.type.options[0].label).toEqual('Red');
      expect(attr.type.options[0].index).toEqual(0);
      expect(attr.type.options[1].label).toEqual('Green');
      expect(attr.type.options[1].index).toEqual(1);
      expect(attr.type.options[2].label).toEqual('Blue');
      expect(attr.type.options[2].index).toEqual(2);
      expect(attr.type.options[9].label).toEqual('White');
      expect(attr.type.options[9].index).toEqual(9);
      expect(attr.type.options[10].label).toEqual('Magenta');
      expect(attr.type.options[10].index).toEqual(10);

      // Confirm ordering
      expect(Object.keys(attr.type.options)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    });

    it('should load a single-choice attribute', function () {
      var attr = parser3(new Schema()).parseField(
        xml(
          '<field name="colours" label="Colours" type="single-choice">' +
            '<option key="red">Red</option>' +
            '<option key="green">Green</option>' +
            '<option key="blue">Blue</option>' +
            '<option key="black">Black</option>' +
            '<option key="yellow">Yellow</option>' +
            '<option key="purple">Purple</option>' +
            '<option key="brown">Brown</option>' +
            '<option key="pink">Pink</option>' +
            '<option key="grey">Grey</option>' +
            '<option key="white">White</option>' +
            '<option key="magenta">Magenta</option>' +
            '</field>'
        )
      );
      expect(attr.type.name).toEqual('single-choice');
      expect(attr.type.hasOptions).toBe(true);
      expect(attr.type.multipleOptions).toBe(false);
      expect(Object.keys(attr.type.options).length).toEqual(11);
      expect(attr.type.options.red.label).toEqual('Red');
      expect(attr.type.options.red.index).toEqual(0);
      expect(attr.type.options.green.label).toEqual('Green');
      expect(attr.type.options.green.index).toEqual(1);
      expect(attr.type.options.blue.label).toEqual('Blue');
      expect(attr.type.options.blue.index).toEqual(2);

      // Confirm ordering
      expect(Object.keys(attr.type.options)).toEqual([
        'red',
        'green',
        'blue',
        'black',
        'yellow',
        'purple',
        'brown',
        'pink',
        'grey',
        'white',
        'magenta'
      ]);

      expect(attr.type.toJSON().options).toEqual([
        { value: 'red', label: 'Red', index: 0 },
        { value: 'green', label: 'Green', index: 1 },
        { value: 'blue', label: 'Blue', index: 2 },
        { value: 'black', label: 'Black', index: 3 },
        { value: 'yellow', label: 'Yellow', index: 4 },
        { value: 'purple', label: 'Purple', index: 5 },
        { value: 'brown', label: 'Brown', index: 6 },
        { value: 'pink', label: 'Pink', index: 7 },
        { value: 'grey', label: 'Grey', index: 8 },
        { value: 'white', label: 'White', index: 9 },
        { value: 'magenta', label: 'Magenta', index: 10 }
      ]);
    });

    it('should load a boolean attribute', function () {
      var attr = parser3(new Schema()).parseField(
        xml(
          '<field name="confirm" label="Confirm" type="boolean">' +
            '<option key="true">OK</option>' +
            '<option key="false">Cancel</option>' +
            '</field>'
        )
      );
      expect(attr.type.name).toEqual('boolean');
      expect(attr.type.hasOptions).toBe(true);
      expect(attr.type.multipleOptions).toBe(false);
      expect(Object.keys(attr.type.options)).toEqual(['true', 'false']);
      expect(attr.type.options['true'].label).toEqual('OK');
      expect(attr.type.options['true'].value).toEqual(true);
      expect(attr.type.options['true'].index).toEqual(0);
      expect(attr.type.options['false'].label).toEqual('Cancel');
      expect(attr.type.options['false'].value).toEqual(false);
      expect(attr.type.options['false'].index).toEqual(1);
    });

    it('should load a boolean attribute with defaults', function () {
      var attr = parser3(new Schema()).parseField(xml('<field name="confirm" label="Confirm" type="boolean"/>'));
      expect(attr.type.name).toEqual('boolean');
      expect(attr.type.hasOptions).toBe(true);
      expect(attr.type.multipleOptions).toBe(false);
      expect(Object.keys(attr.type.options)).toEqual(['false', 'true']);
      expect(attr.type.options['true'].label).toEqual('Yes');
      expect(attr.type.options['true'].index).toEqual(1);
      expect(attr.type.options['false'].label).toEqual('No');
      expect(attr.type.options['false'].index).toEqual(0); // false defaults to first element
    });

    it('should load a multiple-choice attribute', function () {
      var attr = parser3(new Schema()).parseField(
        xml(
          '<field name="colours" label="Colours" type="multiple-choice">' +
            '<option key="red">Red</option>' +
            '<option key="green">Green</option>' +
            '<option key="blue">Blue</option>' +
            '</field>'
        )
      );
      expect(attr.type.name).toEqual('multiple-choice');
      expect(attr.type.hasOptions).toBe(true);
      expect(attr.type.multipleOptions).toBe(true);
      expect(Object.keys(attr.type.options).length).toEqual(3);
      expect(attr.type.options.red.label).toEqual('Red');
      expect(attr.type.options.red.index).toEqual(0);
      expect(attr.type.options.green.label).toEqual('Green');
      expect(attr.type.options.green.index).toEqual(1);
      expect(attr.type.options.blue.label).toEqual('Blue');
      expect(attr.type.options.blue.index).toEqual(2);
    });

    it('should load a multiple-choice-integer attribute', function () {
      var attr = parser3(new Schema()).parseField(
        xml(
          '<field name="colours" label="Colours" type="multiple-choice-integer">' +
            '<option key="1">Red</option>' +
            '<option key="3">Green</option>' +
            '<option>Blue</option>' +
            '</field>'
        )
      );
      expect(attr.type.name).toEqual('multiple-choice-integer');
      expect(attr.type.hasOptions).toBe(true);
      expect(attr.type.multipleOptions).toBe(true);
      expect(Object.keys(attr.type.options).length).toEqual(3);
      expect(attr.type.options[1].label).toEqual('Red');
      expect(attr.type.options[1].index).toEqual(0);
      expect(attr.type.options[3].label).toEqual('Green');
      expect(attr.type.options[3].index).toEqual(1);
      expect(attr.type.options[4].label).toEqual('Blue');
      expect(attr.type.options[4].index).toEqual(2);
    });

    it('should load an object', function () {
      var assetType = parser2(new Schema()).parseObjectType(
        xml(
          '<object name="asset" label="Asset">' +
            '<attribute name="serial_number" label="Serial Number" type="string" />' +
            '<display format="{make} {model} [{serial_number}]" />' +
            '</object>'
        )
      );

      expect(assetType.name).toBe('asset');
      expect(assetType.label).toBe('Asset');

      var serial = assetType.getVariable('serial_number');
      expect(serial).not.toEqual(null);
      expect(serial.name).toEqual('serial_number');
      expect(serial.label).toEqual('Serial Number');
      expect(serial.type instanceof primitives.text).toBe(true);
    });

    ['2', '3'].forEach(function (v) {
      it('should load a v' + v + ' schema from an xml string', function () {
        var s;
        if (v == '2') {
          s = new Schema().loadXml(schema2_xml, { apiVersion: v2 });
        } else if (v == '3') {
          s = new Schema().loadXml(schema3_xml, { apiVersion: v3 });
        }

        expect(s.errors).toEqual([]);

        var assetType = s.getType('asset');
        expect(assetType).not.toEqual(null);
        expect(assetType.label).toBe('Asset');

        expect(assetType.indexes).toEqual([
          { on: ['worker'], name: 'owner', databases: ['app', 'cloud'], keys: [{ field: 'worker', dir: 1 }] },
          {
            on: ['make', 'model'],
            name: 'make_model',
            databases: ['app', 'cloud'],
            keys: [
              { field: 'make', dir: 1 },
              { field: 'model', dir: 1 }
            ]
          }
        ]);

        var roomType = s.getType('room');
        expect(roomType).not.toEqual(null);

        var rel = assetType.belongsTo.room;
        expect(rel).not.toEqual(null);
        expect(rel.name).toEqual('room');
        expect(rel.objectType).toEqual(assetType);
        expect(rel.foreignType).toEqual(roomType);
        expect(rel.foreignName).toEqual('assets');
        expect(rel.type).toEqual('one-to-many');

        expect(roomType.hasMany.assets).toBe(rel);

        var roomAttr = assetType.getAttribute('room');
        expect(roomAttr.name).toBe('room');
        expect(roomAttr.type.name).toBe('room');
        expect(roomAttr.relationship).toBe('room');

        var roomIdAttr = assetType.getAttribute('room_id');
        expect(roomIdAttr.name).toBe('room_id');
        expect(roomIdAttr.type.name).toBe('text');
        expect(roomIdAttr.relationship).toBe('room');

        var assetsAttr = roomType.getAttribute('assets');
        expect(assetsAttr.name).toBe('assets');
        expect(assetsAttr.type.name).toBe('query');
        expect(assetsAttr.type.objectType.name).toBe('asset');

        const photoAttr = assetType.getAttribute('photo');
        expect(photoAttr.type.media).toBe('image/jpeg');
        if (v == '3') {
          expect(photoAttr.type.autoDownload).toBe(true);
        }

        const signatureAttr = assetType.getAttribute('tnc_signature');
        expect(signatureAttr.type.media).toBe('image/svg+xml');
        if (v == '3') {
          expect(signatureAttr.type.autoDownload).toBe(false);
        }

        var attributeKeys = Object.keys(roomType.getAttributes()).sort();
        expect(attributeKeys).toEqual([
          'assets',
          'barcode',
          'building',
          'building_id',
          'id',
          'name',
          'personnel',
          'personnel_id'
        ]);

        var barcodeAttr = assetType.getAttribute('barcode');
        expect(barcodeAttr.type.spec).toBe('text.email');
      });
    });

    it('should load a notify-user definition for a model', function () {
      var s = new Schema().loadXml(schema3_xml, { apiVersion: v3 });

      expect(s.errors).toEqual([]);

      var workerType = s.getType('worker');
      expect(workerType).not.toEqual(null); // sanity check

      var notification = s.getType('order_notification');
      expect(notification).not.toEqual(null); // sanity check
      expect(notification.notifyUsers).not.toEqual(null);
      expect(notification.notifyUsers.length).toEqual(1);
      expect(notification.notifyUsers[0].message).not.toEqual(null);
      expect(notification.notifyUsers[0].received).toEqual('received_at');
      expect(notification.notifyUsers[0].recipient).toEqual('worker');
      expect(notification.notifyUsers[0].badgeCount).toEqual(null);
    });

    it('should a notify-user definition for a model with badge count', function () {
      var s = new Schema().loadXml(schema3BadgeCountXml, { apiVersion: v3 });

      expect(s.errors).toEqual([]);

      var workerType = s.getType('worker');
      expect(workerType).not.toEqual(null); // sanity check

      var notification = s.getType('order_notification');
      expect(notification).not.toEqual(null); // sanity check
      expect(notification.notifyUsers).not.toEqual(null);
      expect(notification.notifyUsers.length).toEqual(1);
      expect(notification.notifyUsers[0].message).not.toEqual(null);
      expect(notification.notifyUsers[0].received).toEqual('received_at');
      expect(notification.notifyUsers[0].recipient).toEqual('worker');
      expect(notification.notifyUsers[0].badgeCount).toEqual('badge_count');
    });

    it('should load a ready webhook definition for a model', function () {
      var s = new Schema().loadXml(schema3_xml, { apiVersion: v3 });

      expect(s.errors).toEqual([]);

      var assetType = s.getType('asset');
      expect(assetType).not.toEqual(null); // sanity check

      expect(assetType.webhooks).not.toEqual(null);
      expect(assetType.webhooks.length).toEqual(2);

      // first webhook for asset model
      var webhook = assetType.webhooks[0];
      expect(webhook).not.toEqual(null);
      expect(webhook.type).toEqual('ready');
      expect(webhook.name).toEqual('ready_asset');
      expect(webhook.fields).not.toEqual(null);
      expect(webhook.fields.length).toEqual(3);

      var webhookField = webhook.fields[0];
      expect(webhookField).not.toEqual(null);
      expect(webhookField.name).toEqual('room');
      expect(webhookField.embed).toEqual(true);
      expect(webhookField.required).toEqual(true); // default value

      webhookField = webhook.fields[1];
      expect(webhookField).not.toEqual(null);
      expect(webhookField.name).toEqual('photo');
      expect(webhookField.embed).toEqual(true); // default value
      expect(webhookField.required).toEqual(false);
      expect(webhookField.state).toEqual('present'); // default value

      webhookField = webhook.fields[2];
      expect(webhookField).not.toEqual(null);
      expect(webhookField.name).toEqual('tnc_signature');
      expect(webhookField.embed).toEqual(false);
      expect(webhookField.required).toEqual(true);
      expect(webhookField.state).toEqual('uploaded');

      // second webhook for asset model
      webhook = assetType.webhooks[1];
      expect(webhook).not.toEqual(null);
      expect(webhook.type).toEqual('ready');
      expect(webhook.name).toEqual('ready_asset2');

      expect(webhook.fields).not.toEqual(null);
      expect(webhook.fields.length).toEqual(0);
    });

    it('should load an update webhook definition for a model', function () {
      var s = new Schema().loadXml(schema3_xml, { apiVersion: v3 });

      expect(s.errors).toEqual([]);

      var roomType = s.getType('room');
      expect(roomType).not.toEqual(null); // sanity check

      expect(roomType.webhooks).not.toEqual(null);
      expect(roomType.webhooks.length).toEqual(1);

      var webhook = roomType.webhooks[0];
      expect(webhook).not.toEqual(null);
      expect(webhook.type).toEqual('update');
      expect(webhook.name).toEqual('update_room');

      expect(webhook.fields).not.toEqual(null);
      expect(webhook.fields.length).toEqual(0);
    });

    it('should load a webhook with an explicit receiver', function () {
      var s = new Schema().loadXml(schema3_xml, { apiVersion: v3 });
      expect(s.errors).toEqual([]);

      var part = s.getType('part');
      expect(part).not.toEqual(null); // sanity check

      expect(part.webhooks).not.toEqual(null);
      expect(part.webhooks.length).toEqual(4);

      expect(part.webhooks[0].name).toEqual('cloudcode_part_ready_helloworld');
      expect(part.webhooks[1].name).toEqual('pdfmailer_part_update_helloworld');
      expect(part.webhooks[2].name).toEqual('cloudcode_part_update_helloworld');
      expect(part.webhooks[3].name).toEqual('overridden_name');
    });

    it('should give helpful errors for webhooks', function () {
      var f;

      function schema_for(wh_def) {
        var x =
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<data-model>\n' +
          '  <model name="worker" label="Worker">\n' +
          '    <field name="name" label="Name" type="text" />\n' +
          '    <display>{name}</display>\n' +
          '    ' +
          wh_def +
          '\n' +
          '  </model>\n' +
          '</data-model>\n';

        var s = new Schema().loadXml(x, { apiVersion: v3 });

        return {
          schema: s,
          hook: s.getType('worker').webhooks[0],
          errors: s.errors.map(function (e) {
            return e.message;
          })
        };
      }

      f = schema_for('<webhook type="ready" receiver="hello" action="world"/>');
      expect(f.errors).toContain('webhook receiver must be "cloudcode" or "pdfmailer" when specified');

      f = schema_for('<webhook type="ready" />');
      expect(f.errors).toEqual([]);

      f = schema_for('<webhook type="update" receiver="cloudcode" />');
      expect(f.errors).toContain('webhook action required when receiver is specified');

      f = schema_for('<webhook type="update" receiver="cloudcode" action="" />');
      expect(f.errors).toContain('webhook action required when receiver is specified');

      f = schema_for('<webhook type="update" action="hello" />');
      expect(f.errors).toContain('webhook action is not allowed unless receiver is specified');

      f = schema_for('<webhook type="update" receiver="pdfmailer" action="hello" />');
      expect(f.errors).toEqual([]);

      f = schema_for('<webhook type="update" receiver="pdfmailer" action="hello" name="helloWorld" />');
      expect(f.errors).toEqual([]);

      f = schema_for('<webhook type="update" receiver="cloudcode" action="hello" />');
      expect(f.errors).toEqual([]);
    });

    // Errors

    function parseSchema(text, options?) {
      return new Schema().loadXml(text, options);
    }

    it('should report an error when the root element is not <schema>', function () {
      var schema = parseSchema('<somethingelse></somethingelse>', {
        apiVersion: v2
      });
      expect(schema.errors).toHaveError({
        message: '<schema> root tag expected',
        type: 'error',
        start: { line: 0, column: 1 },
        end: { line: 0, column: 14 }
      });
    });

    it('should report an error when the root element is not <data-model> in v3 schema', function () {
      var schema = parseSchema('<somethingelse></somethingelse>', {
        apiVersion: v3
      });
      expect(schema.errors).toHaveError({
        message: '<data-model> root tag expected',
        type: 'error',
        start: { line: 0, column: 1 },
        end: { line: 0, column: 14 }
      });
    });

    it('should report a warning when there are children other than <object>', function () {
      var schema = parseSchema(
        '<schema><object name="test" label="Test"><display format="Test" /></object><somechild /></schema>'
      );
      expect(schema.errors).toHaveError({
        message: "Invalid element 'somechild'",
        type: 'warning'
      });
    });

    it('should require at least one object type', function () {
      var schema = parseSchema('<schema></schema>');
      expect(schema.errors).toHaveError({
        message: 'At least one model is required',
        type: 'error'
      });
    });

    it('should validate the order of elements in <object>', function () {
      var schema = parseSchema(
        '<schema><object name="test" label="Test"><display format="Test" /><attribute name="t" type="string" label="T" /></object></schema>'
      );
      expect(schema.errors).toHaveError({
        message: 'Elements must be in this order: attributes, relationships, display, notify-user, indices, webhooks',
        type: 'error'
      });
    });

    it('should require a display element', function () {
      var schema = parseSchema('<schema><object name="test" label="Test"></object></schema>');
      expect(schema.errors).toHaveError({
        message: '<display> is required',
        type: 'error'
      });
    });

    it('should not allow more than one display element', function () {
      var schema = parseSchema(
        '<schema><object name="test" label="Test"><display format="Test" /><display format="Test" /></object></schema>'
      );
      expect(schema.errors).toHaveError({
        message: 'Only one <display> element is allowed',
        type: 'warning'
      });
    });

    it('should validate <display> attributes', function () {
      var schema = parseSchema(
        '<schema><object name="test" label="Test"><display something="wrong" /></object></schema>'
      );
      expect(schema.errors).toHaveErrors([{ message: "Invalid attribute 'something'", type: 'warning' }]);
    });

    it('should validate that an <object> element has no other children', function () {
      var schema = parseSchema(
        '<schema><object name="test" label="Test"><somethingelse /> <display format="Test" /></object></schema>'
      );
      expect(schema.errors).toHaveError({
        message: "Invalid element 'somethingelse'",
        type: 'warning'
      });
    });

    it('should validate attributes on <object> elements', function () {
      var schema = parseSchema(
        '<schema><object something="invalid" label=""><display format="Test" /></object></schema>'
      );
      expect(schema.errors).toHaveErrors([
        { message: "Invalid attribute 'something'", type: 'warning' },
        { message: 'name is required', type: 'error' }
      ]);
    });

    it('should validate attribute types', function () {
      var schema = parseSchema(
        '<schema><object name="test" label="Test">\n<attribute name="t" type="somethingelse" label="Test" />\n<display format="Test" /></object></schema>'
      );
      expect(schema.errors).toHaveError({
        message: "Invalid type 'somethingelse'",
        type: 'error'
      });
    });

    it('should not allow pure v2 attribute types in v3 schema', function () {
      var schema = parseSchema(
        '<data-model><model name="test" label="Test">\n<field name="t" type="string" label="Test" />\n<display format="Test" /></model></data-model>',
        { apiVersion: v3 }
      );
      expect(schema.errors).toHaveError({
        message: "Invalid type 'string'",
        type: 'error'
      });
    });

    it('should validate a missing attribute type', function () {
      var schema = parseSchema(
        '<schema><object name="test" label="Test">\n<attribute name="t" label="Test" />\n<display format="Test" /></object></schema>'
      );
      expect(schema.errors).toHaveError({
        message: 'type is required',
        type: 'error'
      });
    });

    it('should validate attachment media in v2 schema', function () {
      var schema = parseSchema(
        '<schema><object name="test" label="Test">\n<attribute name="t" type="attachment" media="application/octet-stream" label="Test"/>\n<display format="Test" /></object></schema>',
        { apiVersion: v2 }
      );
      expect(schema.errors).toHaveError({
        message: "media must be 'any', or one of the specific allowed mime types.",
        type: 'error'
      });
    });

    it('should validate attachment media in v3 schema', function () {
      var schema = parseSchema(
        '<data-model><model name="test" label="Test">\n<field name="t" type="attachment" media="application/octet-stream" label="Test"/>\n<display format="Test" /></model></data-model>',
        { apiVersion: v3 }
      );
      expect(schema.errors).toHaveError({
        message: "media must be 'any', or one of the specific allowed mime types.",
        type: 'error'
      });
    });

    it('should allow not blank attachment media in v3 schema', function () {
      var schema = parseSchema(
        '<data-model><model name="test" label="Test">\n<field name="t" type="attachment" label="Test"/>\n<display format="Test" /></model></data-model>',
        { apiVersion: v3 }
      );
      expect(schema.errors).toHaveError({
        message: 'Include media="" with a specific mime type, or media="any" for any of the allowed types.',
        type: 'error'
      });
    });

    it('should handle broken xml', function () {
      var schema = parseSchema('<schema broken></schema>');
      expect(schema.errors.length).toBe(1);
    });

    it('should error on duplicate object names', function () {
      var schema = parseSchema(
        '<schema>\n<object name="test" label="Test"><display format="Test" /></object>\n<object name="test" label="Test"><display format="Test" /></object></schema>'
      );

      expect(schema.errors).toHaveError({
        message: "Model 'test' is already defined",
        type: 'error',
        start: { line: 2, column: 14 }
      });
    });

    it('should error on an unknown string spec', function () {
      var schema = parseSchema(
        '<schema>\n<object name="test" label="Test">\n<attribute spec="text.whatisthis" name="t" type="string" label="test"/>\n<display format="Test" /></object></schema>'
      );

      expect(schema.errors).toHaveError({
        message: 'Invalid spec',
        type: 'error',
        start: { line: 2, column: 17 }
      });
    });

    it('should error on an unknown string format', function () {
      var schema = parseSchema(
        '<data-model>\n<model name="test" label="Test">\n<field name="t" type="text:whatisthis" label="test"/>\n<display format="Test" /></model></data-model>',
        { apiVersion: v3 }
      );

      expect(schema.errors).toHaveError({
        message: "'whatisthis' is not a valid string format",
        type: 'error',
        start: { line: 2, column: 22 }
      });
    });

    it('should validate object names', function () {
      var schema = parseSchema(
        '<schema>\n<object name="my test" label="Test"><display format="Test" /></object></schema>'
      );

      expect(schema.errors).toHaveError({
        message: 'Not a valid name',
        type: 'error'
      });
    });

    it('should report an error for reserved object names', function () {
      var schema = parseSchema(
        '<schema><object name="account" label="Account"><display format="Test" /></object></schema>'
      );
      expect(schema.errors).toHaveError({
        message: "Reserved model name 'account'",
        type: 'error'
      });
    });

    it('should error on duplicate attribute names', function () {
      var schema = parseSchema(
        '<schema>\n<object name="test" label="Test"><attribute name="t" type="string" label="Test" />\n<attribute name="t" type="string" label="Test" /><display format="Test" /></object></schema>'
      );

      expect(schema.errors).toHaveError({
        message: "Attribute 't' is already defined",
        type: 'error',
        start: { line: 2, column: 17 }
      });
    });

    it('should validate belongs_to attributes', function () {
      var schema = parseSchema(
        '<schema>\n<object name="test" label="Test">\n<belongs_to something="wrong" /><display format="Test" /></object></schema>'
      );
      expect(schema.errors).toHaveErrors([
        {
          message: "Invalid attribute 'something'",
          type: 'warning'
        },
        {
          message: 'type is required',
          type: 'error'
        }
      ]);
    });

    it('should error on an invalid belongs_to', function () {
      var schema = parseSchema(
        '<schema>\n<object name="test" label="Test">\n<belongs_to type="another" /><display format="Test" /></object></schema>'
      );

      expect(schema.errors).toHaveError({
        message: "Object 'another' is not defined",
        type: 'error',
        start: { line: 2, column: 18 }
      });
    });

    it('should error on an belongs_to with pure v3 syntax', function () {
      var schema = parseSchema(
        '<data-model>\n<model name="test" label="Test">\n<belongs_to type="test" /><display format="Test" /></model></data-model>',
        { apiVersion: v3 }
      );

      expect(schema.errors).toHaveError({
        message: "Invalid element 'belongs_to'",
        type: 'warning'
      });
    });

    it('should validate has_many attributes', function () {
      var schema = parseSchema(
        '<schema>\n<object name="test" label="Test">\n<has_many something="wrong" /><display format="Test" /></object></schema>'
      );
      expect(schema.errors).toHaveErrors([
        {
          message: "Invalid attribute 'something'",
          type: 'warning'
        },
        {
          message: 'type is required',
          type: 'error'
        },
        {
          message: 'name is required',
          type: 'error'
        }
      ]);
    });

    it('should error on an invalid has_many', function () {
      var schema = parseSchema(
        '<schema>\n<object name="test" label="Test">\n<has_many name="others" type="another" /><display format="Test" /></object></schema>'
      );

      expect(schema.errors).toHaveError({
        message: "Object 'another' is not defined",
        type: 'error'
      });
    });

    it('should error on an has_many without belongs_to', function () {
      var schema = parseSchema(
        '<schema>\n<object name="test" label="Test">\n<has_many name="others" type="test" /><display format="Test" /></object></schema>'
      );

      expect(schema.errors).toHaveError({
        message: 'Need <belongs_to type="test"> in object \'test\'',
        type: 'error'
      });
    });

    it('should error on an has_many with multiple belongs_to', function () {
      var schema = parseSchema(
        '<schema>\n<object name="test" label="Test">\n<belongs_to name="one" type="test" /><belongs_to name="two" type="test" /><has_many name="others" type="test" /><display format="Test" /></object></schema>'
      );

      expect(schema.errors).toHaveError({
        message: 'Ambiguous has_many - set inverse_of to one of one, two',
        type: 'error'
      });
    });

    it('should error on an has_many with invalid inverse_of', function () {
      var schema = parseSchema(
        '<schema>\n<object name="test" label="Test">\n<has_many name="others" type="test" inverse_of="something" /><display format="Test" /></object></schema>'
      );

      expect(schema.errors).toHaveError({
        message: "'something' is not defined on 'test'",
        type: 'error'
      });
    });

    it('should error on an has-many with invalid v3 inverse-of', function () {
      var schema = parseSchema(
        '<data-model>\n<model name="test" label="Test">\n<has-many name="others" model="test" inverse-of="something" /><display format="Test" /></model></data-model>',
        { apiVersion: v3 }
      );

      expect(schema.errors).toHaveError({
        message: "'something' is not defined on 'test'",
        type: 'error'
      });
    });

    it('should not allow inverse_of on a v3 has-many', function () {
      var schema = parseSchema(
        '<data-model>\n<model name="test" label="Test">\n<has-many name="others" model="test" inverse_of="something" /><display format="Test" /></model></data-model>',
        { apiVersion: v3 }
      );

      expect(schema.errors).toHaveErrors([
        {
          message: "Invalid attribute 'inverse_of'",
          type: 'warning'
        },
        {
          message: 'Need <belongs-to model="test"> in object \'test\'',
          type: 'error'
        }
      ]);
    });

    it('should error on duplicate belongs_to names', function () {
      var schema = parseSchema(
        '<schema>\n<object name="test" label="Test">\n<belongs_to type="test" name="test1" />\n<belongs_to name="test1" type="test" />\n<display format="Test" /></object></schema>'
      );

      expect(schema.errors).toHaveError({
        message: "Relationship 'test1' is already defined",
        type: 'error',
        start: { line: 3, column: 18 }
      });
    });

    it('should error on duplicate has_many names', function () {
      var schema = parseSchema(
        '<schema>\n' +
          '<object name="test" label="Test">\n<belongs_to type="other" name="a" />\n<belongs_to name="b" type="other" />\n<display format="Test" /></object>' +
          '<object name="other" label="O">\n<has_many type="test" name="tt" inverse_of="a" />\n<has_many type="test" name="tt" inverse_of="b" />\n<display format="Test" /></object>' +
          '</schema>'
      );

      expect(schema.errors).toHaveError({
        message: "Relationship 'tt' is already defined",
        type: 'error'
      });
    });

    it('should error on duplicate has_many', function () {
      var schema = parseSchema(
        '<schema>\n' +
          '<object name="test" label="Test">\n<belongs_to type="other" name="a" />\n<display format="Test" /></object>' +
          '<object name="other" label="O">\n<has_many type="test" name="t1" />\n<has_many type="test" name="t2" />\n<display format="Test" /></object>' +
          '</schema>',
        false
        // { v2syntax: true }
      );

      expect(schema.errors).toHaveError({
        message: "Relationship 'a' already has a has_many 't1'",
        type: 'error'
      });
    });

    it('should not allow anything other than <option> in an enum element', function () {
      var parser = parser2(new Schema());
      var attr = parser.parseField(
        xml(
          '<attribute name="colours" label="Colours" type="enum">' +
            '<option>Red</option>' +
            '<option>Green</option>' +
            '<option>Blue</option>' +
            'Some text' +
            '<somethingelse />' +
            '</attribute>'
        ),
        false
        // { v2syntax: true }
      );

      expect(attr.type.name).toEqual('single-choice-integer');
      expect(Object.keys(attr.type.options).length).toEqual(3);
      expect(attr.type.options[0].label).toEqual('Red');

      expect(parser.getErrors()).toHaveErrors([
        { message: "Invalid element 'somethingelse'", type: 'warning' },
        {
          message: 'Text is not allowed inside this element',
          type: 'warning'
        }
      ]);
    });

    it('should not allow anything in a normal attribute element', function () {
      var parser = parser2(new Schema());
      var attr = parser.parseField(
        xml(
          '<attribute name="colours" label="Colours" type="string">' +
            '<option>Red</option>' +
            'Some text' +
            '</attribute>'
        ),
        false
        // { v2syntax: true }
      );

      expect(attr.type.name).toEqual('text');

      expect(parser.getErrors()).toHaveErrors([
        { message: "Invalid element 'option'", type: 'warning' },
        {
          message: 'Text is not allowed inside this element',
          type: 'warning'
        }
      ]);
    });

    it('should validate an attribute name', function () {
      var parser = parser2(new Schema());
      var attr = parser.parseField(
        xml('<attribute name="my colour" label="My Colour" type="string"/>'),
        false
        // { v2syntax: true }
      );

      expect(attr.type.name).toEqual('text');

      expect(parser.getErrors()).toHaveError({
        message: 'Not a valid name',
        type: 'error'
      });
    });

    it('should report an error for reserved attribute names', function () {
      var parser = parser2(new Schema());
      var attr = parser.parseField(
        xml('<attribute name="id" label="My Colour" type="string"/>'),
        false
        // { v2syntax: true }
      );

      expect(attr.type.name).toEqual('text');

      expect(parser.getErrors()).toHaveError({
        message: "Reserved field name 'id'",
        type: 'error'
      });
    });

    it('should warn for bad attribute names', function () {
      var parser = parser2(new Schema());
      var attr = parser.parseField(
        xml('<attribute name="document_id" label="Document ID" type="string"/>'),
        false
        // { v2syntax: true }
      );

      expect(attr.type.name).toEqual('text');

      expect(parser.getErrors()).toHaveError({
        message: "Field name should not end with '_id'",
        type: 'warning'
      });
    });

    it('should report an error for invalid webhook types', function () {
      var schema = parseSchema(
        '<schema>\n<object label="Test" name="test"><display format="Test" /><webhook type="invalid" name="invalid_webhook"></webhook></object>\n</schema>'
      );

      expect(schema.errors).toHaveError({
        message: 'webhook type must be "ready" or "update"',
        type: 'error'
      });
    });

    it('should error for index on fields that are not indexable', function () {
      var schema = parseSchema(
        '<data-model>\n<model label="Test" name="test"><field name="mugshot" label="Mugshot" type="photo"/><display format="Test" /><index on="mugshot"/></model>\n</data-model>',
        { apiVersion: v3 }
      );

      expect(schema.errors).toHaveError({
        message: "Field is not indexable: 'mugshot'",
        type: 'error'
      });
    });

    it('should error for index on undefined fields', function () {
      var schema = parseSchema(
        '<data-model>\n<model label="Test" name="test"><display format="Test" /><index on="wtf"/></model>\n</data-model>',
        { apiVersion: v3 }
      );

      expect(schema.errors).toHaveError({
        message: "Undefined field or model in index: 'wtf'",
        type: 'error'
      });
    });

    it('should error for index on undefined fields when multiple are specified', function () {
      var schema = parseSchema(
        '<data-model>\n<model label="Test" name="test"><field name="name" label="Name" type="text"/><display format="Test" /><index on="name,wtf"/></model>\n</data-model>',
        { apiVersion: v3 }
      );

      expect(schema.errors).toHaveError({
        message: "Undefined field or model in index: 'wtf'",
        type: 'error'
      });
    });
  });
});
