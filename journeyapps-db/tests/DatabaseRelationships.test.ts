import { describe, it, expect, beforeEach } from 'vitest';
import { DBTestContext, setupContext } from './setup/databaseSetup';

// @ts-ignore
import schema3Xml from './fixtures/schema3.xml?raw';

declare module 'vitest' {
  export interface TestContext extends DBTestContext {
    first: any;
    second: any;
    third: any;
    room: any;
    building: any;
  }
}

describe('DB relationships', () => {
  beforeEach(async (context) => {
    const ctx = await setupContext(schema3Xml);
    context.adapter = ctx.adapter;
    context.schema = ctx.schema;
    context.db = ctx.db;

    context.first = context.db.asset.create({ make: 'Nokia', model: '5800' });
    context.second = context.db.asset.create({ make: 'Nokia', model: '5230' });
    context.third = context.db.asset.create({ make: 'Samsung', model: '5230' });

    context.room = context.db.room.create({ name: 'The War Room' });
    context.building = context.db.building.create({ name: 'The Office' });

    context.third.room(context.room);
    context.second.room(context.room);
    context.room.building(context.building);
    await Promise.all([
      context.first.save(),
      context.second.save(),
      context.third.save(),
      context.room.save(),
      context.building.save()
    ]);
  });

  it('should set a relationship', async ({ first, room }) => {
    first.room(room);
    expect(await first.room()).toEqual(room);
  });

  it('should set a relationship with an id', async ({ first, room }) => {
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

  it('should create an object with a relationship', async ({ db, room }) => {
    const asset = db.asset.create({ room: room });
    expect(asset.room_id).toBe(room.id);
    expect(await asset.room()).toEqual(room);
  });

  it('should load a relationship', async ({ db, third, room }) => {
    const asset = await db.asset.first(third.id);

    expect(asset.room_id).toBe(room.id);
    const aroom = await asset.room();

    expect(aroom).not.toBe(null);
    expect(aroom.id).toBe(room.id);
    expect(aroom.persisted).toBe(true);
    expect(aroom.name).toBe('The War Room');
  });

  it('should load a relationship twice without waiting', async ({ db, third, room }) => {
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

  it('should clear a relationship', async ({ db, third, room }) => {
    let asset = await db.asset.first(third.id);

    expect(asset.room_id).toEqual(room.id);
    asset.room(null);

    expect(await asset.room()).toEqual(null);

    // Save and reload
    await asset.save();
    asset = await db.asset.first(third.id);

    expect(asset.room_id).toBe(null);
    expect(await asset.room()).toBe(null);
  });

  it('should load chained relationships', async ({ db, third, building }) => {
    const asset = await db.asset.first(third.id);

    const room = await asset.room();
    const ourbuilding = await room.building();

    expect(ourbuilding).not.toEqual(null);
    expect(ourbuilding.id).toEqual(building.id);
    expect(ourbuilding.type.name).toEqual('building');
    expect(ourbuilding.name).toEqual('The Office');
  });

  it('should handle complicated cases', async ({ db, first }) => {
    let asset = await db.asset.first(first.id);

    const room = await db.room.first();
    asset.room(room);
    asset.make = 'Asus';
    asset.model = null;
    await asset.save();

    asset = await db.asset.first(first.id);

    const aroom = await asset.room();

    expect(aroom.id).toEqual(room.id);
    expect(aroom.name).toEqual('The War Room');
    expect(asset.make).toEqual('Asus');
    expect(asset.model).toEqual(null);
  });

  it('should list relationships', async ({ room }) => {
    const results = await room.assets.toArray();
    expect(results.length).toBe(2);
    const asset = results[0];
    expect(asset.type.name).toBe('asset');
    expect(asset.model).toBe('5230');
  });

  it('should not clear a relationship when the object does not exist', async ({ db, third, room }) => {
    let asset = await db.asset.first(third.id);

    await room.destroy();
    expect(asset.room_id).toBe(room.id);
    const aroom = await asset.room();

    // Save and reload
    await asset.save();
    asset = await db.asset.first(third.id);

    expect(aroom).toBe(null);
    expect(asset.room_id).toBe(room.id);
  });

  it('should handle more complicated cases', async ({ db, first }) => {
    let room = await db.room.first();
    first.room(room);
    await first.save();

    const asset1 = await db.asset.first(first.id);
    const asset2 = await db.asset.first(first.id);

    const room1 = await asset1.room();
    const room2 = await asset2.room();
    asset1.make = 'foobar';
    room2.name = 'Test room';
    await asset2.save();
    await asset1.save();
    await room.reload();
    expect(room.name).toBe('Test room');
  });
});
