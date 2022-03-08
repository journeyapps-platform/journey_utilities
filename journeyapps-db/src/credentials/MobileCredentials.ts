import * as base64 from '../utils/base64';

export class MobileCredentials {
  baseUrl: string;
  accountId: string;
  enrollmentId: string;
  authToken: string;
  userId: string;

  constructor(options: {
    baseUrl: string;
    accountId: string;
    enrollmentId: string;
    authToken: string;
    userId: string;
  }) {
    this.baseUrl = options.baseUrl;
    this.accountId = options.accountId;
    this.enrollmentId = options.enrollmentId;
    this.authToken = options.authToken;
    this.userId = options.userId;
  }

  mobileUrl() {
    return this.baseUrl + 'mobile/';
  }

  toJSON() {
    var JSONObject = {
      baseUrl: this.baseUrl,
      accountId: this.accountId,
      enrollmentId: this.enrollmentId,
      authToken: this.authToken,
      userId: this.userId
    };
    return JSON.stringify(JSONObject);
  }

  api4Url() {
    return this.baseUrl + 'api/v4/' + this.accountId + '/';
  }

  basicAuth() {
    return 'Basic ' + base64.encode(this.enrollmentId + ':' + this.authToken);
  }

  apiAuthHeaders() {
    return {
      Authorization: this.basicAuth(),
      'Journey-Authentication-Type': 'Device'
    };
  }
}
