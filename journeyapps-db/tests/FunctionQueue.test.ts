import { describe, it, expect } from 'vitest';
import { FunctionQueue } from '../src';

function async(nr) {
  return Promise.resolve(nr);
}

function asyncFn(nr) {
  return async.bind(null, nr);
}

function delayed(time, fn) {
  return new Promise<void>(function (resolve, reject) {
    setTimeout(function () {
      resolve();
    }, time);
  }).then(fn);
}

function delayedFn(time, fn) {
  return delayed.bind(null, time, fn);
}

describe('FunctionQueue', function () {
  it('should execute a single function', async function () {
    const queue = new FunctionQueue();
    expect(await queue.enqueue(asyncFn(42))).toEqual(42);
  });

  it('should execute multiple functions', async function () {
    const queue = new FunctionQueue();
    const promises = [queue.enqueue(asyncFn(42)), queue.enqueue(asyncFn(43)), queue.enqueue(asyncFn(44))];
    const results = await Promise.all(promises);
    expect(results).toEqual([42, 43, 44]);
  });

  it('should execute multiple functions in sequence', async function () {
    const queue = new FunctionQueue();
    let result = '';

    function increment(arg) {
      result += arg;
    }

    const start = Date.now();
    queue.enqueue(delayedFn(5, increment.bind(null, 'a')));
    queue.enqueue(delayedFn(15, increment.bind(null, 'b')));
    queue.enqueue(delayedFn(2, increment.bind(null, 'c')));
    await queue.enqueue(async function () {
      const _diff = Date.now() - start; // eslint-disable-line no-unused-vars
      // The above diff is assumed to be > the combined timeout above.
      // However, we don't test for it, since testing timeouts may not be reliable.
      return result;
    });

    expect(result).toEqual('abc');
  });

  it('should execute multi functions in parallel', async function () {
    const queue = new FunctionQueue();
    let result = '';

    let counter = 0;

    function incrementAndWait(n, message) {
      // throw new Error('wtf');
      counter += 1;
      return waitForCounter(n).then(function () {
        result += message;
      });
    }

    function waitForCounter(n) {
      return new Promise(function (resolve, reject) {
        function test() {
          if (counter >= n) {
            resolve(counter);
          } else {
            setTimeout(test, 0);
          }
        }
        test();
      });
    }

    queue.enqueueMulti(incrementAndWait.bind(null, 3, 'a'));
    queue.enqueueMulti(incrementAndWait.bind(null, 3, 'a'));
    queue.enqueueMulti(incrementAndWait.bind(null, 2, 'b'));

    const promises = [];

    promises.push(
      queue.enqueue(async function () {
        return result;
      })
    );
    queue.enqueueMulti(incrementAndWait.bind(null, 4, 'c'));
    promises.push(
      queue.enqueue(async function () {
        return result;
      })
    );

    const results = await Promise.all(promises);
    expect(results).toEqual(['baa', 'baac']);
  });

  it('should handle errors', async function () {
    const queue = new FunctionQueue();
    // Note the .catch() is *outside* the enqueue.
    const result = await queue
      .enqueue(function () {
        throw new Error('fail');
      })
      .catch(function (err) {
        return '!!' + err.message;
      });
    expect(result).toEqual('!!fail');
    // Test that we can still enqueue normal functions after this.
    expect(await queue.enqueue(asyncFn(43))).toEqual(43);
  });
});
