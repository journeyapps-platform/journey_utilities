import { DatabaseObject, DBSchema as Schema, WebSQLAdapter, Collection, Database, Attachment } from '../../dist';

import { schema3Xml } from './fixtures';

import { EnumOption } from '@journeyapps/parser-schema';
import { Version } from '@journeyapps/parser-common';
import * as fetchMock from 'fetch-mock';
import { hasWebSQL } from './databaseSetup';

if (hasWebSQL()) {
  describe('Database with WebSQLAdapter', DatabaseWebSQLSpec);
}

function DatabaseWebSQLSpec() {
  let schema: Schema;
  let db: any;
  let adapter: WebSQLAdapter;

  beforeEach(async function () {
    const cleared = await WebSQLAdapter.clear();
    expect(cleared).toEqual([true, true]);
    adapter = new WebSQLAdapter({ name: 'objects', stf: false });
    await adapter.open();

    const v3 = new Version('3.1');
    schema = new Schema().loadXml(schema3Xml, { apiVersion: v3 });
    db = new Database(schema, adapter);
  });

  it('should load a schema', function () {
    expect(db.randomobject).toBe(undefined);
    expect(db.asset instanceof Collection).toBe(true);
  });

  it('should create a new object', function () {
    var obj = db.asset.create();
    expect(obj instanceof DatabaseObject).toBe(true);
    expect(obj.type.name).toBe('asset');
    obj.make = 'Nokia';
    expect(obj.make).toBe('Nokia');

    expect(obj.notdefined).toBe(undefined);

    // The object is sealed, so we should not be able to add new properties
    expect(function () {
      obj.notdefined = 'Test';
    }).toThrow();

    expect(obj.notdefined).toBe(undefined);

    var id = obj.id;
    expect(id).not.toEqual(null);

    var keys = Object.keys(obj);
    keys.sort();

    expect(keys).toEqual([
      'barcode',
      'class',
      'colours',
      'condition',
      'description',
      'make',
      'model',
      'photo',
      'position',
      'registration_date',
      'serial_number',
      'tnc_signature',
      'updated',
      'verified',
      'weight'
    ]);

    obj.setAll({ model: '5230' });
    expect(obj.make).toBe('Nokia');
    expect(obj.model).toBe('5230');
  });

  it('should cast numbers to strings on string attributes', function () {
    var obj = db.asset.create({ make: 123 });
    expect(obj.make).toBe('123');
  });

  it('should not allow strings for numbers attributes', function () {
    expect(function () {
      db.asset.create({ condition: 'Bad', weight: 'Heavy' });
    }).toThrow();
  });

  it('should allow EnumOption or a number for an enum attribute', function () {
    var obj = db.asset.create({ verified: 0 });
    expect(obj.verified).toEqual(0);

    obj.verified = 1;
    expect(obj.verified).toEqual(1);

    obj.verified = new EnumOption(0, 'Whatever');
    expect(obj.verified).toEqual(0);

    expect(function () {
      obj.verified = 'Yes';
    }).toThrow();

    expect(function () {
      obj.verified = 1.1;
    }).toThrow();

    expect(function () {
      obj.verified = 100;
    }).toThrow();
  });

  it('should only allow UUIDs and Attachment for attachment attributes', function () {
    var obj = db.asset.create();
    var validId = '89216540-430c-405b-b537-ff997f178ac9';
    obj.photo = validId;
    expect(obj.photo.id).toBe(validId);
    obj.photo = { id: validId };
    expect(obj.photo.id).toBe(validId);
    obj.photo = new Attachment({ id: validId });
    expect(obj.photo).toEqual(new Attachment({ id: validId }));

    expect(function () {
      obj.photo = 'photo1';
    }).toThrow();
  });

  it('should initialize an object with provided attribute values', function () {
    var obj = db.asset.create({
      make: 'Nokia',
      someother: 'Not a valid property'
    });
    expect(obj.make).toBe('Nokia');
    expect(obj.model).toBe(null);
    expect(obj.someother).toBe(undefined);
  });

  xit('should error when setting a reserved property', function () {
    // Not working properly in CI when minified.
    expect(function () {
      db.asset.create({ save: 'Test' });
    }).toThrow();

    expect(function () {
      var asset = db.asset.create();
      asset.save = 'Test';
    }).toThrow();
  });

  it('should save and load an object', async function () {
    var time = new Date();
    var obj = db.asset.create({ make: 'Nokia', model: '5800', updated: time });
    expect(obj.persisted).toBe(false);

    await obj.save();

    expect(obj.persisted).toBe(true);

    var asset = await db.asset.first(obj.id);

    expect(asset.make).toBe('Nokia');
    expect(asset.model).toBe('5800');
    expect(asset.updated).toEqual(time);
  });

  it('should reload an object', async function () {
    var obj = db.asset.create({
      make: 'Nokia',
      model: '5800',
      description: 'Test'
    });

    await obj.save();

    var asset = await db.asset.first(obj.id);

    asset.model = '5230';
    asset.description = null;
    await asset.save();

    await obj.reload();

    expect(obj.persisted).toBe(true);
    expect(obj.make).toBe('Nokia');
    expect(obj.model).toBe('5230');
    expect(obj.description).toBe(null);
  });

  it('should reload an object with cleared relationship', async function () {
    var obj = db.asset.create({
      make: 'Nokia',
      model: '5800',
      description: 'Test'
    });

    await obj.save();

    var asset = await db.asset.first(obj.id);
    asset.model = '5230';
    asset.description = null;
    await asset.save();

    await obj.reload();

    expect(obj.persisted).toBe(true);
    expect(obj.make).toBe('Nokia');
    expect(obj.model).toBe('5230');
    expect(obj.description).toBe(null);
  });

  it('should destroy an object after fetching', async function () {
    var obj = db.asset.create({ make: 'Nokia', model: '5800' });
    await obj.save();

    var asset = await db.asset.first(obj.id);

    expect(asset.persisted).toBe(true);
    await asset.destroy();

    expect(asset.persisted).toBe(false);
    asset = await db.asset.first(obj.id);
    expect(asset).toBe(null);
  });

  it('should not persist an object after destroying', async function () {
    var obj = db.asset.create({ make: 'Nokia', model: '5800' });
    await obj.save();

    await obj.destroy();
    await obj.save();

    expect(obj.persisted).toBe(false);
    var asset = await db.asset.first(obj.id);
    expect(asset).toBe(null);
  });

  it('should save and load an object with a query', async function () {
    var obj = db.asset.create({ make: 'Nokia', model: '5800' });
    await obj.save();

    var asset = await db.asset.first();

    expect(asset.persisted).toBe(true);
    expect(asset.make).toBe('Nokia');
    expect(asset.model).toBe('5800');
  });

  it('should evaluate the display name', function () {
    var obj = db.asset.create({ make: 'Nokia', model: '5800' });
    expect(obj.toString()).toBe('Nokia 5800 []');
  });

  describe('relationships', function () {
    var first, second, third, room, building;

    beforeEach(async function () {
      first = db.asset.create({ make: 'Nokia', model: '5800' });
      second = db.asset.create({ make: 'Nokia', model: '5230' });
      third = db.asset.create({ make: 'Samsung', model: '5230' });

      room = db.room.create({ name: 'The War Room' });
      building = db.building.create({ name: 'The Office' });

      third.room(room);
      second.room(room);
      room.building(building);
      await Promise.all([first.save(), second.save(), third.save(), room.save(), building.save()]);
    });

    it('should set a relationship', async function () {
      first.room(room);
      expect(await first.room()).toEqual(room);
    });

    it('should set a relationship with an id', async function () {
      expect(first.room_id).toBe(null);
      expect(await first.room()).toBe(null);
      first.room_id = room.id;
      expect(first.room_id).toBe(room.id);
      expect(await first.room()).toEqual(room);
      expect(first.toData(true)).toEqual({
        id: first.id,
        type: 'asset',
        attributes: {},
        belongs_to: {
          room: room.id
        }
      });
    });

    it('should create an object with a relationship', async function () {
      var asset = db.asset.create({ room: room });
      expect(asset.room_id).toBe(room.id);
      expect(await asset.room()).toEqual(room);
    });

    it('should load a relationship', async function () {
      var asset = await db.asset.first(third.id);

      expect(asset.room_id).toBe(room.id);
      var aroom = await asset.room();

      expect(aroom).not.toBe(null);
      expect(aroom.id).toBe(room.id);
      expect(aroom.persisted).toBe(true);
      expect(aroom.name).toBe('The War Room');
    });

    it('should load a relationship twice without waiting', async function () {
      var asset = await db.asset.first(third.id);

      var room1 = null;
      var room2 = null;

      var p1 = asset.room().then(function (result) {
        room1 = result;
      });

      var p2 = asset.room().then(function (result) {
        room2 = result;
      });

      await Promise.all([p1, p2]);

      expect(room1.id).toBe(room.id);
      expect(room1.name).toBe('The War Room');
      expect(room2.id).toBe(room.id);
      expect(room2.name).toBe('The War Room');
    });

    it('should clear a relationship', async function () {
      var asset = await db.asset.first(third.id);

      expect(asset.room_id).toEqual(room.id);
      asset.room(null);

      expect(await asset.room()).toEqual(null);

      // Save and reload
      await asset.save();
      asset = await db.asset.first(third.id);

      expect(asset.room_id).toBe(null);
      expect(await asset.room()).toBe(null);
    });

    it('should load chained relationships', async function () {
      var asset = await db.asset.first(third.id);

      var room = await asset.room();
      var ourbuilding = await room.building();

      expect(ourbuilding).not.toEqual(null);
      expect(ourbuilding.id).toEqual(building.id);
      expect(ourbuilding.type.name).toEqual('building');
      expect(ourbuilding.name).toEqual('The Office');
    });

    it('should handle complicated cases', async function () {
      var asset = await db.asset.first(first.id);

      var room = await db.room.first();
      asset.room(room);
      asset.make = 'Asus';
      asset.model = null;
      await asset.save();

      asset = await db.asset.first(first.id);

      var aroom = await asset.room();

      expect(aroom.id).toEqual(room.id);
      expect(aroom.name).toEqual('The War Room');
      expect(asset.make).toEqual('Asus');
      expect(asset.model).toEqual(null);
    });

    it('should list relationships', async function () {
      var results = await room.assets.toArray();
      expect(results.length).toBe(2);
      var asset = results[0];
      expect(asset.type.name).toBe('asset');
      expect(asset.model).toBe('5230');
    });

    it('should not clear a relationship when the object does not exist', async function () {
      var asset = await db.asset.first(third.id);

      await room.destroy();
      expect(asset.room_id).toBe(room.id);
      var aroom = await asset.room();

      // Save and reload
      await asset.save();
      asset = await db.asset.first(third.id);

      expect(aroom).toBe(null);
      expect(asset.room_id).toBe(room.id);
    });

    it('should handle more complicated cases', async function () {
      var room = await db.room.first();
      first.room(room);
      await first.save();

      var asset1 = await db.asset.first(first.id);
      var asset2 = await db.asset.first(first.id);

      var room1 = await asset1.room();
      var room2 = await asset2.room();
      asset1.make = 'foobar';
      room2.name = 'Test room';
      await asset2.save();
      await asset1.save();
      await room.reload();
      expect(room.name).toBe('Test room');
    });
  });

  describe('querying', function () {
    var first, second, third;

    beforeEach(async function () {
      first = db.asset.create({ make: 'Nokia', model: '5800' });
      second = db.asset.create({ make: 'Nokia', model: '5230' });
      third = db.asset.create({ make: 'Samsung', model: '5230' });

      await Promise.all([first.save(), second.save(), third.save()]);
    });

    it('should load all objects with all()', async function () {
      var assets = await db.asset.all().orderBy('make').toArray();
      expect(assets.length).toBe(3);
      expect(assets[0].make).toBe('Nokia');
      expect(assets[1].make).toBe('Nokia');
      expect(assets[2].make).toBe('Samsung');
    });

    it('should load all objects with where()', async function () {
      var assets = await db.asset.where().orderBy('make').toArray();

      expect(assets.length).toBe(3);
      expect(assets[0].make).toBe('Nokia');
      expect(assets[1].make).toBe('Nokia');
      expect(assets[2].make).toBe('Samsung');
    });

    it('should filter by attribute', async function () {
      var assets = await db.asset.where('model = ?', '5800').toArray();
      expect(assets.length).toBe(1);
      expect(assets[0].make).toBe('Nokia');
      expect(assets[0].model).toBe('5800');
    });

    it('should filter by attribute hash', async function () {
      var assets = await db.asset.where({ model: '5800' }).toArray();
      expect(assets.length).toBe(1);
      expect(assets[0].make).toBe('Nokia');
      expect(assets[0].model).toBe('5800');
    });

    it('should combine multiple filters', async function () {
      var assets = await db.asset.all().where('model = ?', '5230').where('make = ?', 'Samsung').toArray();
      expect(assets.length).toBe(1);
      expect(assets[0].make).toBe('Samsung');
      expect(assets[0].model).toBe('5230');
    });

    it('should order', async function () {
      var assets = await db.asset.all().orderBy('model', '-make').toArray();
      expect(assets.length).toBe(3);
      expect(assets[0].make).toBe('Samsung');
      expect(assets[0].model).toBe('5230');
      expect(assets[1].make).toBe('Nokia');
      expect(assets[1].model).toBe('5230');
      expect(assets[2].make).toBe('Nokia');
      expect(assets[2].model).toBe('5800');
    });

    it('should order case insensitive', async function () {
      await db.asset.create({ model: '5230', make: 'panasonic' }).save();

      var assets = await db.asset.all().orderBy('model', '-make').toArray();
      expect(assets.length).toBe(4);
      expect(assets[0].make).toBe('Samsung');
      expect(assets[0].model).toBe('5230');

      expect(assets[1].make).toBe('panasonic');
      expect(assets[1].model).toBe('5230');

      expect(assets[2].make).toBe('Nokia');
      expect(assets[2].model).toBe('5230');

      expect(assets[3].make).toBe('Nokia');
      expect(assets[3].model).toBe('5800');
    });

    it('should destroyAll', async function () {
      await db.asset.where('make = ?', 'Nokia').destroyAll();

      var remaining = await db.asset.all().toArray();
      expect(remaining.length).toBe(1);
      expect(remaining[0].make).toBe('Samsung');
    });

    it('should fetch objects with display relationships', async function () {
      var building = db.building.create({ name: 'The Building' });
      var room1 = db.room.create({
        barcode: 'R1',
        name: 'Room 1',
        building: building
      });
      var room2 = db.room.create({ barcode: 'R2', name: 'Room 2' });

      await Promise.all([building.save(), room1.save(), room2.save()]);

      var rooms;

      // Fetch without display rel
      rooms = await db.room.all().orderBy('name').toArray();

      expect(rooms.length).toBe(2);
      expect(rooms[0].toString()).toBe(null);
      expect(rooms[1].toString()).toBe(null);

      // Fetch with display rel
      rooms = await db.room.all().orderBy('name')._fetchWithDisplay();
      expect(rooms.length).toBe(2);
      expect(rooms[0].toString()).toBe('R1 Room 1 (The Building)');
      expect(rooms[1].toString()).toBe('R2 Room 2 ()');

      // It should not mark the building as dirty
      expect(rooms[0].toData(true)).toEqual({
        id: rooms[0].id,
        type: 'room',
        attributes: {},
        belongs_to: {}
      });
    });

    it('should fetch objects with display relationships that does not exist', async function () {
      var building = db.building.create({ name: 'The Building' });
      var room1 = db.room.create({
        barcode: 'R1',
        name: 'Room 1',
        building: building
      });
      var room2 = db.room.create({ barcode: 'R2', name: 'Room 2' });

      await Promise.all([building.save(), room1.save(), room2.save()]);

      await building.destroy();

      var rooms = await db.room.all().orderBy('name')._fetchWithDisplay();
      expect(rooms.length).toBe(2);
      expect(rooms[0].toString()).toBe('R1 Room 1 ()');
      expect(rooms[1].toString()).toBe('R2 Room 2 ()');
      expect(rooms[0].building_id).toBe(building.id);
    });

    it('should fetch objects with display attributes that are empty', async function () {
      var building = db.building.create({ name: 'The Building' });
      var room1 = db.room.create({
        barcode: '',
        name: 'Room 1',
        building: building
      });
      var room2 = db.room.create({ barcode: null, name: 'Room 2' });
      var room3 = db.room.create({ name: 'Room 3' });

      await Promise.all([building.save(), room1.save(), room2.save(), room3.save()]);

      var rooms = await db.room.all().orderBy('name')._fetchWithDisplay();
      expect(rooms.length).toBe(3);
      expect(rooms[0].toString()).toBe(' Room 1 (The Building)');
      expect(rooms[1].toString()).toBe(' Room 2 ()');
      expect(rooms[2].toString()).toBe(' Room 3 ()');
    });

    it('should fetch objects with nested preloaded relationships', async function () {
      const building = db.building.create({ name: 'The Building' });
      const room1 = db.room.create({
        barcode: 'R1',
        name: 'Room 1',
        building: building
      });
      const room2 = db.room.create({ barcode: 'R2', name: 'Room 2' });
      const asset1 = db.asset.create({ make: 'Test 1', room: room1 });
      const asset2 = db.asset.create({ make: 'Test 2', room: room2 });

      await Promise.all([building.save(), room1.save(), room2.save(), asset1.save(), asset2.save()]);

      // Included nested rel
      const assets = await db.asset
        .where('make starts with ?', 'Test')
        .order_by('make')
        .include('room.building')
        ._fetch();
      expect(assets.length).toBe(2);
      expect(assets[0].toString()).toBe('Test 1  []');
      expect(assets[1].toString()).toBe('Test 2  []');
      const room = assets[0]._cached('room');
      expect(room.name).toBe('Room 1');
      expect(room.id).toBe(room1.id);
      const lbuilding = room._cached('building');
      expect(lbuilding.name).toBe('The Building');
      expect(lbuilding.id).toBe(building.id);
      const lroom2 = assets[1]._cached('room');
      expect(lroom2._cached('building')).toBe(null);

      // It should not mark the room as dirty
      expect(assets[0].toData(true)).toEqual({
        id: assets[0].id,
        type: 'asset',
        attributes: {},
        belongs_to: {}
      });
    });

    it('should not attempt to evaluate JavaScript functions in Data Model format strings', function () {
      // format string for display element: {name} {$:invalidViewFunction()}
      //noinspection JSUnresolvedVariable
      const jsReference = db.javascript_function_reference.create({
        name: 'Function 1'
      });
      // the function token expression should be printed as a literal string and not be evaluated
      expect(jsReference.toString()).toEqual('Function 1 {$:invalidViewFunction()}');
    });

    it('should JSON.stringify() a query', function () {
      const query = db.asset.all();
      // Mock a circular reference
      (query as any).adapter = {};
      (query as any).adapter.a = query.adapter;
      const json = JSON.stringify(query);
      // The actual format is not defined - we just test that it doesn't throw an error.
      expect(typeof json).toBe('string');
    });
  });

  describe('batching', function () {
    it('should handle batch save with a relationship', async function () {
      var first = db.asset.create({ make: 'Nokia', model: '5800' });
      await first.save();
      expect(first.persisted).toBe(true);

      var room = db.room.create({ name: 'test' });
      first.make = 'test1';
      first.room(room);

      let batch = new db.Batch();
      batch.save(first);
      expect(batch._getOps()).toEqual([
        {
          op: 'patch',
          type: 'asset',
          id: first.id,
          data: {
            id: first.id,
            type: 'asset',
            attributes: { make: 'test1', model: '5800' },
            belongs_to: { room: room.id }
          },
          patch: {
            id: first.id,
            type: 'asset',
            attributes: { make: 'test1' },
            belongs_to: { room: room.id }
          },
          object: first
        },
        {
          op: 'put',
          type: 'room',
          id: room.id,
          data: {
            id: room.id,
            type: 'room',
            attributes: { name: 'test' },
            belongs_to: {}
          },
          patch: null,
          object: room
        }
      ]);
    });

    it('should not save a destroyed object', async function () {
      var first = db.asset.create({ make: 'Nokia', model: '5800' });
      await first._save();
      expect(first.persisted).toBe(true);
      await first._destroy();
      first.make = 'Destroyed';
      first.room(db.room.create({ name: 'Test' }));

      let batch = new db.Batch();
      batch.save(first);
      expect(batch._getOps()).toEqual([]);
    });

    it('should deduplicate saves', async function () {
      var first = db.asset.create({ make: 'Nokia', model: '5800' });
      var second = db.asset.create({ make: 'Nokia', model: '5230' });
      await first.save();
      await second.save();

      first.make = 'test1';
      second.make = 'test2';

      let batch = new db.Batch();
      batch.save(first);
      batch.save(second);
      batch.save(first);

      // Dedups to [first, second]

      expect(batch._getOps()).toEqual([
        {
          op: 'patch',
          type: 'asset',
          id: first.id,
          data: {
            id: first.id,
            type: 'asset',
            attributes: { make: 'test1', model: '5800' },
            belongs_to: {}
          },
          patch: {
            id: first.id,
            type: 'asset',
            attributes: { make: 'test1' },
            belongs_to: {}
          },
          object: first
        },
        {
          op: 'patch',
          type: 'asset',
          id: second.id,
          data: {
            id: second.id,
            type: 'asset',
            attributes: { make: 'test2', model: '5230' },
            belongs_to: {}
          },
          patch: {
            id: second.id,
            type: 'asset',
            attributes: { make: 'test2' },
            belongs_to: {}
          },
          object: second
        }
      ]);
    });

    it('should not deduplicate separate instances', async function () {
      var first = db.asset.create({ make: 'Nokia', model: '5800' });
      await first.save();

      // The `copy` has the same ID, but is a separate instance. Don't dedup.
      var copy = await db.asset._get(first.id);
      first.make = 'Samsung';
      copy.model = '6310i';

      let batch = new db.Batch();
      batch.save(first);
      batch.save(copy);

      expect(batch._getOps()).toEqual([
        {
          op: 'patch',
          type: 'asset',
          id: first.id,
          data: {
            id: first.id,
            type: 'asset',
            attributes: { make: 'Samsung', model: '5800' },
            belongs_to: {}
          },
          patch: {
            id: first.id,
            type: 'asset',
            attributes: { make: 'Samsung' },
            belongs_to: {}
          },
          object: first
        },
        {
          op: 'patch',
          type: 'asset',
          id: first.id,
          data: {
            id: first.id,
            type: 'asset',
            attributes: { make: 'Nokia', model: '6310i' },
            belongs_to: {}
          },
          patch: {
            id: first.id,
            type: 'asset',
            attributes: { model: '6310i' },
            belongs_to: {}
          },
          object: copy
        }
      ]);
    });

    it('should not save after delete', async function () {
      var first = db.asset.create({ make: 'Nokia', model: '5800' });
      await first.save();

      let batch = new db.Batch();
      batch.destroy(first);
      batch.save(first);

      expect(batch._getOps()).toEqual([
        {
          op: 'delete',
          type: 'asset',
          id: first.id,
          object: first
        }
      ]);
    });

    it('should dedup save before delete', async function () {
      var first = db.asset.create({ make: 'Nokia', model: '5800' });
      await first.save();

      let batch = new db.Batch();
      batch.save(first);
      batch.destroy(first);

      expect(batch._getOps()).toEqual([
        {
          op: 'delete',
          type: 'asset',
          id: first.id,
          object: first
        }
      ]);
    });

    it('should dedup delete after delete', async function () {
      var first = db.asset.create({ make: 'Nokia', model: '5800' });
      await first.save();

      let batch = new db.Batch();
      batch.destroy(first);
      batch.destroy(first);

      expect(batch._getOps()).toEqual([
        {
          op: 'delete',
          type: 'asset',
          id: first.id,
          object: first
        }
      ]);
    });

    it('should get an object via public API', async function () {
      var url = 'http://test.test/api/v4/testaccount/datamodel.xml';
      fetchMock.once(url, { body: schema3Xml });
      db = await Database.instance({
        baseUrl: 'http://test.test/api/v4/testaccount',
        token: ''
      });
      expect(db.randomobject).toBe(undefined);
      expect(db.asset instanceof Collection).toBe(true);
    });
  });
}
