// Mock FetchError for browser and node
export class FetchError extends Error {
  type = 'system';

  constructor(public code: string, message: string) {
    super(message);
  }
}
