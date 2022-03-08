export type PromiseFunction<T> = () => Promise<T>;

interface Task {
  multi: boolean;
  execute: () => void;
}

/**
 * FunctionQueue maintains a queue of Promise-returning functions that
 * are executed sequentially (whereas normally they would execute their async code concurrently).
 */
export class FunctionQueue {
  private queue: Task[];
  private multiCount: number;
  private exclusiveLock: boolean;

  constructor() {
    this.queue = [];
    this.multiCount = 0;
    this.exclusiveLock = false;
  }

  /**
   * Place a function on the queue.
   * The function may either return a Promise or a value.
   * Return a Promise that is resolved with the result of the function.
   */
  enqueue<T>(promiseFn: PromiseFunction<T>, multi?: boolean): Promise<T> {
    var self = this;
    function unlock() {
      if (multi) {
        self.multiCount -= 1;
      } else {
        self.exclusiveLock = false;
      }
      self._tryNext();
    }
    return this._lockNext(multi).then(promiseFn).finally(unlock);
  }

  /**
   * Place a function on the queue.
   * This function may execute in parallel with other "multi" functions, but not with other functions on the exclusive
   * queue.
   */
  enqueueMulti<T>(promiseFn: PromiseFunction<T>): Promise<T> {
    return this.enqueue(promiseFn, true);
  }

  /**
   * Convert a normal Promise-returning function into one that is automatically enqueued.
   * The signature of the function stays the same - only the execution is potentially delayed.
   * The only exception is that if the function would have returned a scalar value, it now
   * returns a Promise.
   */
  qu<T>(fn: PromiseFunction<T>): () => Promise<T> {
    var self = this;
    return function () {
      var args = arguments;
      return self.enqueue(function () {
        return fn.apply(null, args);
      });
    };
  }

  private _lockNext(multi?: boolean) {
    var self = this;
    return new Promise<void>(function (resolve, reject) {
      var task = {
        execute: resolve,
        multi: multi
      };
      self.queue.push(task);
      self._tryNext();
    });
  }

  private _tryNext() {
    if (this.queue.length == 0) {
      return false;
    }

    if (this.exclusiveLock) {
      return false;
    }

    var task = this.queue[0];
    if (task.multi) {
      this.multiCount += 1;
      this.queue.shift();
      task.execute();
    } else if (this.multiCount == 0) {
      this.exclusiveLock = true;
      this.queue.shift();
      task.execute();
    } else {
      return false;
    }

    return true;
  }
}
