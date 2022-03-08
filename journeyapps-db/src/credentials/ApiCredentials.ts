import * as base64 from '../utils/base64';

export interface ApiCredentialOptions {
  /**
   * "https://run-<server>.journeyapps.com/api/v4/:accountId"
   */
  baseUrl: string;
  token?: string;
  username?: string;
  password?: string;
}

export class ApiCredentials {
  baseUrl: string;
  authorization: string;

  constructor(options: ApiCredentialOptions) {
    this.baseUrl = options.baseUrl;
    if (!this.baseUrl.endsWith('/')) {
      this.baseUrl += '/';
    }

    if (options.token) {
      this.authorization = 'Token ' + options.token;
    } else {
      this.authorization = 'Basic ' + base64.encode(options.username + ':' + options.password);
    }
  }

  api4Url() {
    return this.baseUrl;
  }

  apiAuthHeaders() {
    return {
      Authorization: this.authorization
    };
  }
}
