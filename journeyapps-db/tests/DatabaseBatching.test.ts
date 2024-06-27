import { Collection, Database } from '../src';
import * as fetchMock from 'fetch-mock';
import { describe, it, expect, beforeEach } from 'vitest';
import { DBTestContext, setupContext } from './setup/databaseSetup';

// @ts-ignore
import schema3Xml from './fixtures/schema3.xml?raw';

declare module 'vitest' {
  export interface TestContext extends DBTestContext {}
}

describe('batching', () => {
  beforeEach(async (context) => {
    const ctx = await setupContext(schema3Xml);
    context.adapter = ctx.adapter;
    context.schema = ctx.schema;
    context.db = ctx.db;
  });

  it('should handle batch save with a relationship', async ({ db }) => {
    const first = db.asset.create({ make: 'Nokia', model: '5800' });
    await first.save();
    expect(first.persisted).toBe(true);

    const room = db.room.create({ name: 'test' });
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

  it('should not save a destroyed object', async ({ db }) => {
    const first = db.asset.create({ make: 'Nokia', model: '5800' });
    await first._save();
    expect(first.persisted).toBe(true);
    await first._destroy();
    first.make = 'Destroyed';
    first.room(db.room.create({ name: 'Test' }));

    let batch = new db.Batch();
    batch.save(first);
    expect(batch._getOps()).toEqual([]);
  });

  it('should deduplicate saves', async ({ db }) => {
    const first = db.asset.create({ make: 'Nokia', model: '5800' });
    const second = db.asset.create({ make: 'Nokia', model: '5230' });
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

  it('should not deduplicate separate instances', async ({ db }) => {
    const first = db.asset.create({ make: 'Nokia', model: '5800' });
    await first.save();

    // The `copy` has the same ID, but is a separate instance. Don't dedup.
    const copy = await db.asset._get(first.id);
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

  it('should not save after delete', async ({ db }) => {
    const first = db.asset.create({ make: 'Nokia', model: '5800' });
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

  it('should dedup save before delete', async ({ db }) => {
    const first = db.asset.create({ make: 'Nokia', model: '5800' });
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

  it('should dedup delete after delete', async ({ db }) => {
    const first = db.asset.create({ make: 'Nokia', model: '5800' });
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

  it('should get an object via public API', async ({ db }) => {
    const url = 'http://test.test/api/v4/testaccount/datamodel.xml';
    fetchMock.once(url, { body: schema3Xml });
    db = await Database.instance({
      baseUrl: 'http://test.test/api/v4/testaccount',
      token: ''
    });
    expect(db.randomobject).toBe(undefined);
    expect(db.asset instanceof Collection).toBe(true);
  });
});
