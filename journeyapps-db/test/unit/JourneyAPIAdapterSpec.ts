import * as fetchMock from 'fetch-mock';
import { Version } from '@journeyapps/parser-common';
import {
  ApiCredentials,
  Attachment,
  Batch,
  Database,
  DatabaseObject,
  DBSchema as Schema,
  JourneyAPIAdapter
} from '../../dist';
import { FetchError } from './FetchError';
import { schema3Xml } from './fixtures';

describe('JourneyAPIAdapter', function () {
  let adapter: JourneyAPIAdapter;

  const credentials = new ApiCredentials({
    baseUrl: 'http://test.test/api/v4/testaccount',
    token: 'testtoken'
  });

  const v3 = new Version('3.1');
  const schema = new Schema().loadXml(schema3Xml, { apiVersion: v3 });

  beforeEach(function () {
    adapter = new JourneyAPIAdapter(credentials, schema);
  });

  it('should get an object', async function () {
    var url = 'http://test.test/api/v4/testaccount/objects/asset/123.json';
    var mockData = {
      id: '123',
      foo: 'bar',
      updated_at: '2016-03-08T15:00:00Z',
      display: 'Test Asset',
      serial_number: '12345',
      room_id: 'R1',
      photo_id: '293b13a2-ea22-11e6-bca9-02429101cdef',
      photo: {
        state: 'uploaded',
        original: 'http://test.test/media/myphoto.jpg',
        thumbnail: 'http://test.test/media/myphoto-thumbnail.jpg'
      }
    };
    fetchMock.once(url, { body: mockData });
    var data = await adapter.get('asset', '123');
    expect(fetchMock.called(url)).toBe(true);
    expect(data).toEqual(
      jasmine.objectContaining({
        id: '123',
        type: 'asset',
        _updated_at: '2016-03-08T15:00:00Z',
        display: 'Test Asset',
        attributes: jasmine.objectContaining({
          serial_number: '12345',
          photo: {
            id: '293b13a2-ea22-11e6-bca9-02429101cdef',
            state: 'uploaded',
            urls: {
              original: 'http://test.test/media/myphoto.jpg',
              thumbnail: 'http://test.test/media/myphoto-thumbnail.jpg'
            }
          }
        }),
        belongs_to: jasmine.objectContaining({
          room: 'R1'
        })
      })
    );

    // @ts-ignore (internal API)
    const object = DatabaseObject.build<{ photo: Attachment }>(adapter, schema.objects.asset, data.id, data);
    expect(object.photo.id).toEqual('293b13a2-ea22-11e6-bca9-02429101cdef');
    expect(object.photo.url()).toEqual('http://test.test/media/myphoto.jpg');
    expect(object.photo.present()).toBe(true);
    expect(object.photo.processed('thumbnail').url()).toEqual('http://test.test/media/myphoto-thumbnail.jpg');
  });

  it('should getAll', async function () {
    var url = 'http://test.test/api/v4/testaccount/objects/asset/query.json';
    var mockData = {
      objects: [
        {
          id: '123',
          updated_at: '2016-03-08T15:00:00Z',
          display: 'Test Asset',
          serial_number: '12345',
          room_id: 'R1'
        }
      ]
    };
    fetchMock.once(url, { body: mockData });
    const data = await adapter.getAll('asset', ['123', '246']);
    expect(fetchMock.called(url)).toBe(true);
    expect(data).toEqual([
      jasmine.objectContaining({
        id: '123',
        type: 'asset',
        _updated_at: '2016-03-08T15:00:00Z',
        display: 'Test Asset',
        attributes: jasmine.objectContaining({
          serial_number: '12345'
        }),
        belongs_to: jasmine.objectContaining({
          room: 'R1'
        })
      }),
      null
    ]);
    const lastBody = JSON.parse(fetchMock.lastOptions(url).body.toString());
    expect(lastBody).toEqual({
      expression: 'id in ?',
      arguments: [['123', '246']],
      limit: null,
      skip: null,
      sort: []
    });
  });

  it('should return null for a 404', async function () {
    var url = 'http://test.test/api/v4/testaccount/objects/asset/123.json';
    var mockData = {
      type: 'OBJECT_NOT_FOUND',
      title: 'Object not found.',
      detail: "No user found with ID: '123'",
      see: 'https://resources.journeyapps.com/v4/api/errors/OBJECT_NOT_FOUND'
    };
    fetchMock.once(url, { body: mockData, status: 404 });
    var data = await adapter.get('asset', '123');
    expect(fetchMock.called(url)).toEqual(true);
    expect(data).toEqual(null);
  });

  it('should retry a get on "socket hang up" error', async function () {
    const url = 'http://test.test/api/v4/testaccount/objects/asset/123.json';

    // simulating https://github.com/nodejs/node/blob/ddedf8eaac7f4914deea10397c5a15824c84626d/lib/internal/errors.js#L581-L586
    const hangUp = new FetchError('ECONNRESET', 'socket hang up');

    fetchMock.once(
      {
        overwriteRoutes: false,
        url: url
      },
      { throws: hangUp }
    );
    const mockData = {
      id: '123',
      updated_at: '2016-03-08T15:00:00Z'
    };
    fetchMock.once(
      {
        overwriteRoutes: false,
        url: url
      },
      { body: mockData }
    );

    const data = await adapter.get('asset', '123');
    expect(fetchMock.called(url)).toBe(true);
    expect(data).toEqual(
      jasmine.objectContaining({
        id: '123',
        _updated_at: '2016-03-08T15:00:00Z'
      })
    );
  });

  it('should retry a get on 504 error', async function () {
    const url = 'http://test.test/api/v4/testaccount/objects/asset/123.json';

    fetchMock.once(url, 504);
    const mockData = {
      id: '123',
      updated_at: '2016-03-08T15:00:00Z'
    };
    fetchMock.once(
      {
        url,
        overwriteRoutes: false
      },
      { body: mockData }
    );

    const data = await adapter.get('asset', '123');
    expect(fetchMock.called(url)).toBe(true);
    expect(data).toEqual(
      jasmine.objectContaining({
        id: '123',
        _updated_at: '2016-03-08T15:00:00Z'
      })
    );
  });

  it('should fail after 2 tries', async function () {
    const url = 'http://test.test/api/v4/testaccount/objects/asset/123.json';
    fetchMock.once(
      {
        url,
        overwriteRoutes: false
      },
      504
    );
    fetchMock.once(
      {
        url,
        overwriteRoutes: false
      },
      504
    );
    let error: any = null;
    try {
      await adapter.get('asset', '123');
    } catch (err) {
      error = err;
    }
    expect(error).not.toBe(null);
    expect(error.message).toEqual('HTTP Error 504: Gateway Timeout\n');
  });

  it('should get a first object', async function () {
    var url = 'http://test.test/api/v4/testaccount/objects/asset.json?limit=1&skip=&';
    var mockData = {
      objects: [
        {
          id: '123',
          updated_at: '2016-03-08T15:00:00Z',
          display: 'Test Asset',
          serial_number: '12345'
        }
      ]
    };
    fetchMock.once(url, { body: mockData });

    const db = Database.getTypedDatabase<{ asset: { serial_number: string } }>(schema, adapter);
    let asset = await db.asset.first();
    expect(fetchMock.called(url)).toBe(true);
    expect(asset.serial_number).toBe('12345');
  });

  it('should fetch all the objects, regardless of paging', async function () {
    var urlFirstPage = 'http://test.test/api/v4/testaccount/objects/asset.json?limit=&skip=&';
    var urlSecondPage = 'http://test.test/api/v4/testaccount/objects/asset.json?limit=1000&skip=1000&';
    const MOCK_TOTAL = 1001,
      API_LIMIT = 1000;

    function mockObject() {
      return {
        id: '123',
        updated_at: '2016-03-08T15:00:00Z',
        display: 'Test Asset',
        serial_number: '12345'
      };
    }

    var firstPage = new Array(API_LIMIT).fill(mockObject());
    var secondPage = new Array(MOCK_TOTAL % API_LIMIT).fill(mockObject());

    var mockFirstPage = {
      objects: firstPage,
      count: API_LIMIT,
      total: MOCK_TOTAL,
      more: true
    };
    var mockSecondPage = {
      objects: secondPage,
      count: MOCK_TOTAL % API_LIMIT,
      total: MOCK_TOTAL,
      more: false
    };
    fetchMock.once(urlFirstPage, { body: mockFirstPage });
    fetchMock.once(urlSecondPage, { body: mockSecondPage });

    const db = Database.getTypedDatabase<{ asset: {} }>(schema, adapter);
    let results = await db.asset.all().toArray();
    expect(fetchMock.called(urlFirstPage)).toBe(true);
    expect(fetchMock.called(urlSecondPage)).toBe(true);
    expect(results.length).toBe(MOCK_TOTAL);
  });

  it('should handle split batches', async function () {
    var url = 'http://test.test/api/v4/testaccount/batch.json';
    var mockResponse1 = {
      operations: [
        {
          method: 'put',
          object: {},
          success: true
        },
        {
          method: 'put',
          object: {},
          success: true
        }
      ]
    };
    fetchMock.once(
      {
        url
      },
      { body: mockResponse1 }
    );
    var mockResponse2 = {
      operations: [
        {
          method: 'put',
          object: {},
          success: true
        }
      ]
    };
    fetchMock.once(
      {
        url: url,
        overwriteRoutes: false
      },
      { body: mockResponse2 }
    );

    var batch = new Batch(adapter);
    const db = Database.getTypedDatabase<{ asset: {} }>(schema, adapter);

    adapter.batchLimit = 2;

    var object1 = db.asset.create({ make: 'Test 1' });
    var object2 = db.asset.create({ make: 'Test 2' });
    var object3 = db.asset.create({ make: 'Test 3' });
    batch.save(object1);
    batch.save(object2);
    batch.save(object3);

    await batch.execute();

    expect(object1.persisted).toBe(true);
    expect(object2.persisted).toBe(true);
    expect(object3.persisted).toBe(true);

    expect(fetchMock.called(url)).toBe(true);

    var calls = fetchMock.calls(url);
    expect(calls.length).toBe(2);

    var body1 = JSON.parse(calls[0]['1'].body.toString());
    var body2 = JSON.parse(calls[1]['1'].body.toString());
    expect(body1).toEqual({
      operations: [
        {
          method: 'put',
          object: {
            type: 'asset',
            id: object1.id,
            make: 'Test 1'
          }
        },
        {
          method: 'put',
          object: {
            type: 'asset',
            id: object2.id,
            make: 'Test 2'
          }
        }
      ]
    });
    expect(body2).toEqual({
      operations: [
        {
          method: 'put',
          object: {
            type: 'asset',
            id: object3.id,
            make: 'Test 3'
          }
        }
      ]
    });
  });

  it('should execute a crud batch', async function () {
    var url = 'http://test.test/api/v4/testaccount/batch.json';
    var mockResponse = {
      operations: [
        {
          method: 'put',
          object: {},
          success: true
        },
        {
          method: 'put',
          object: {},
          success: true
        }
      ]
    };
    fetchMock.once(url, { body: mockResponse });

    var batch = new Batch(adapter);
    const db = Database.getTypedDatabase<{ asset: {} }>(schema, adapter);

    var object1 = db.asset.create({ make: 'Test 1' });
    var object2 = db.asset.create({ make: 'Test 2' });
    batch.save(object1);
    batch.save(object2);

    await batch.execute();

    expect(object1.persisted).toBe(true);
    expect(object2.persisted).toBe(true);

    expect(fetchMock.called(url)).toBe(true);
    const lastCall = fetchMock.lastCall(url);
    const bodyText = lastCall[1].body;
    const body = JSON.parse(bodyText.toString());
    expect(body).toEqual({
      operations: [
        {
          method: 'put',
          object: {
            type: 'asset',
            id: object1.id,
            make: 'Test 1'
          }
        },
        {
          method: 'put',
          object: {
            type: 'asset',
            id: object2.id,
            make: 'Test 2'
          }
        }
      ]
    });
  });

  it('should handle errors in a crud batch', async function () {
    var url = 'http://test.test/api/v4/testaccount/batch.json';
    var mockResponse = {
      operations: [
        {
          method: 'put',
          object: {},
          success: true
        },
        {
          method: 'put',
          object: {},
          success: false,
          error: {
            type: 'MOCK_ERROR',
            detail: 'Mock message'
          }
        },
        {
          method: 'delete',
          object: {},
          success: true
        },
        {
          method: 'delete',
          object: {},
          success: false,
          error: {
            type: 'OBJECT_NOT_FOUND',
            detail: 'Mock message'
          }
        },
        {
          method: 'delete',
          object: {},
          success: false,
          error: {
            type: 'MOCK_DELETE_ERROR',
            detail: 'Mock delete message'
          }
        }
      ]
    };
    fetchMock.once(url, { body: mockResponse });

    var batch = new Batch(adapter);
    const db = Database.getTypedDatabase<{ asset: {} }>(schema, adapter);

    var object1 = db.asset.create({ make: 'Test 1' });
    var object2 = db.asset.create({ make: 'Test 2' });
    var object3 = db.asset.create({ make: 'Test 3' });
    var objectPhantom = db.asset.create({ make: 'Test Phantom' });
    var objectFail = db.asset.create({ make: 'Test Fail' });

    batch.save(object1);
    batch.save(object2);
    batch.destroy(object3);
    batch.destroy(objectPhantom);
    batch.destroy(objectFail);

    try {
      await batch.execute();
      expect(false).toBeTruthy();
    } catch (err) {
      if (!err.errors) {
        throw err;
      }
      expect(err.errors.length).toBe(2);
      expect(err.errors[0].object).toBe(object2);
      expect(err.errors[0].error).toEqual({
        type: 'MOCK_ERROR',
        detail: 'Mock message'
      });

      expect(err.errors[1].object).toBe(objectFail);
      expect(err.errors[1].error).toEqual({
        type: 'MOCK_DELETE_ERROR',
        detail: 'Mock delete message'
      });
    }

    expect(object1.persisted).toBe(true);
    expect(object2.persisted).toBe(false);
    expect(fetchMock.called(url)).toBe(true);
  });

  it('should save an attachment', async function () {
    // Note: Attachments contains a lot of inter-related behaviour between the database and adapter,
    // so we do more of an "integration test" here than an unit test.
    const url = 'http://test.test/api/v4/testaccount/batch.json';
    const mockPutResponse = {
      operations: [
        {
          method: 'put',
          object: {},
          success: true
        }
      ]
    };
    fetchMock.once(
      {
        url,
        overwriteRoutes: false
      },
      { body: mockPutResponse }
    );

    const db = Database.getTypedDatabase<{ asset: { serial_number: string; photo: Attachment; photo_id: string } }>(
      schema,
      adapter
    );
    const asset = db.asset.create();
    asset.serial_number = '12345';
    asset.photo = await Attachment.create({ text: 'test file', filename: 'myfile.txt' });
    await asset.save();

    const putOptions = fetchMock.lastOptions(url);
    const putBody = JSON.parse(putOptions.body.toString());

    expect(putBody).toEqual({
      operations: [
        {
          method: 'put',
          object: {
            type: 'asset',
            id: asset.id,
            serial_number: '12345',
            photo: {
              base64: 'dGVzdCBmaWxl',
              filename: 'myfile.txt'
            }
          }
        }
      ]
    });

    // Save again - no changes to attachment
    const mockPatchResponse = {
      operations: [
        {
          method: 'patch',
          object: {},
          success: true
        }
      ]
    };
    fetchMock.once(
      {
        url,
        overwriteRoutes: false
      },
      { body: mockPatchResponse }
    );
    asset.serial_number = '123456';
    await asset.save();

    const patchOptions = fetchMock.lastOptions(url);
    const patchBody = JSON.parse(patchOptions.body.toString());

    expect(patchBody).toEqual({
      operations: [
        {
          method: 'patch',
          object: {
            type: 'asset',
            id: asset.id,
            serial_number: '123456'
          }
        }
      ]
    });

    // Save again, with existing attachment (id)
    fetchMock.once(
      {
        url,
        overwriteRoutes: false
      },
      { body: mockPatchResponse }
    );

    const PHOTO_ID = '6f2ae0e0-03e2-4879-95a2-17cbf7ad5825';
    asset.photo = new Attachment(PHOTO_ID);
    await asset.save();

    const patch2Options = fetchMock.lastOptions(url);
    const patch2Body = JSON.parse(patch2Options.body.toString());

    expect(patch2Body).toEqual({
      operations: [
        {
          method: 'patch',
          object: {
            type: 'asset',
            id: asset.id,
            photo_id: PHOTO_ID
          }
        }
      ]
    });
  });

  afterEach(function () {
    expect(fetchMock.calls('unmatched')).toEqual([]);
    fetchMock.restore();
  });
});
