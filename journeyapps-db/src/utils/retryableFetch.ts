import 'isomorphic-fetch';
import type { Response, RequestInit } from 'node-fetch';

function delay<T>(ms: number, value?: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// If a fetch request errors with a "socket hang up" or similar, retry it.
// Ensure the action is read-only or idempotent before using this function.
export const retryableFetch = async (url: string, options: RequestInit, retriesLeft: number = 1): Promise<Response> => {
  try {
    const response = await fetch(url, options as any);

    if (retriesLeft > 0 && response.status >= 500 && response.status < 599) {
      await delay(50);
      return retryableFetch(url, options, retriesLeft - 1);
    }
    if (retriesLeft > 0 && response.status === 429) {
      await delay(1000); //FIXME: Is this waiting too long or not long enough?
      return retryableFetch(url, options, retriesLeft - 1);
    }
    return response as any;
  } catch (error) {
    if (retriesLeft > 0) {
      return handleNodeFetchError(error, retryableFetch, [url, options, retriesLeft - 1]);
      // TODO: Can we handle native/browser fetch errors?
      // FIXME: do we want to retry on request.timeout?
    } else {
      throw error;
    }
  }
};

// FIXME: This refactor isn't quite as pretty as I was hoping. Is there a better way?
const handleNodeFetchError = async (error, retryFn: Function, args: any[]) => {
  if (
    // node-fetch wraps operational errors as FetchError. Other implementations don't.
    error.constructor.name === 'FetchError' &&
    error.type === 'system'
  ) {
    switch (error.code) {
      case 'ECONNRESET': // remote socket closed.
        // retry immediately.
        return retryFn(...args);
      case 'ENOTFOUND': // DNS
        await delay(1000);
        return retryFn(...args);
      case 'ECONNREFUSED': // service is down
        await delay(1000);
        return retryFn(...args);
    }
  }
  // Unknown error
  await delay(1000);
  return retryFn(...args);
};
